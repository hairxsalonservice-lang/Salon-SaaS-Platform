const mongoose = require('mongoose');
const dayjs = require('dayjs');

const Appointment = require('../models/appointment.model');
const Slot = require('../models/slot.model');
const Service = require('../models/service.model');
const Branch = require('../models/branch.model');
const AppError = require('../utils/AppError');
const { getActiveStaffLeaves } = require('../utils/staffLeaveQueries');
const { slotOverlapsLeave } = require('../utils/staffLeaveHelper');
const { delCachePattern } = require('./cache.service');
const redis = require('../config/redis');
const { getIO } = require('../config/socket');
const { buildAppointmentEventPayload } = require('../utils/appointmentPayload');

const VALID_SOURCES = ['APP', 'WALK_IN', 'PHONE'];

/**
 * Create an appointment and atomically acquire every slot it needs.
 *
 * Both the customer endpoint and the staff/walk-in endpoint use this function
 * so leave checks, service eligibility, slot locking, multi-slot acquisition,
 * cache invalidation and realtime events can never drift apart.
 */
const createAppointment = async ({
  actorId,
  actorRole = 'customer',
  customerId = null,
  customerSnapshot = null,
  source = 'APP',
  status = 'PENDING',
  slotId,
  serviceIds = [],
  customerNotes = null,
  guests = 1,
  allowPastSlot = false,
  allowBookedByActor = false,
}) => {
  if (!mongoose.Types.ObjectId.isValid(String(slotId || ''))) {
    throw new AppError('Slot ID is required', 400);
  }

  if (!VALID_SOURCES.includes(source)) {
    throw new AppError('Invalid appointment source', 400);
  }

  if (!['PENDING', 'CONFIRMED'].includes(status)) {
    throw new AppError('Staff-created appointments must start as PENDING or CONFIRMED', 400);
  }

  const guestCount = Math.min(Math.max(parseInt(guests, 10) || 1, 1), 10);

  // --------------------------------
  // Step 1 — validate the slot
  // --------------------------------
  const slot = await Slot.findById(slotId);
  if (!slot) {
    throw new AppError('Slot not found', 404);
  }

  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
  const isSlotAvailable =
    slot.status === 'AVAILABLE' ||
    (allowBookedByActor &&
      slot.reservedBy &&
      String(slot.reservedBy) === String(actorId) &&
      ['RESERVED', 'BOOKED'].includes(slot.status)) ||
    (slot.status === 'RESERVED' &&
      slot.reservedAt &&
      slot.reservedAt < tenMinsAgo &&
      !slot.appointmentId);

  if (!isSlotAvailable) {
    throw new AppError('This slot is no longer available', 409);
  }

  // --------------------------------
  // Step 1b — staff leave check
  // --------------------------------
  const staffLeaves = await getActiveStaffLeaves({
    staffId: slot.staffId,
    startDate: slot.date,
    endDate: slot.date,
  });

  if (
    staffLeaves.length > 0 &&
    slotOverlapsLeave(slot.startTime, slot.endTime, staffLeaves, slot.date)
  ) {
    throw new AppError(
      'This staff member is not available at that time. Please pick another slot.',
      400,
    );
  }

  // --------------------------------
  // Step 1c — past-slot check
  // App bookings must start in the future. A staff-created walk-in may
  // use a slot that has already started, as long as it has not ended.
  // --------------------------------
  const slotStart = dayjs(`${slot.date} ${slot.startTime}`);
  const slotEnd = dayjs(`${slot.date} ${slot.endTime}`);

  if (allowPastSlot) {
    if (slotEnd.isBefore(dayjs())) {
      throw new AppError('Cannot book a slot that has already ended', 400);
    }
  } else if (slotStart.isBefore(dayjs())) {
    throw new AppError('Cannot book a slot in the past', 400);
  }

  // --------------------------------
  // Step 2 — distributed lock
  // --------------------------------
  const lockKey = `lock:slot:${slotId}`;
  const lockValue = `${actorId}:${Date.now()}`;
  const lockAcquired = await redis.set(lockKey, lockValue, 'NX', 'EX', 10);

  if (!lockAcquired) {
    throw new AppError(
      'Slot is being processed by another request. Please try again.',
      409,
    );
  }

  const releaseLock = async () => {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    try {
      await redis.eval(script, 1, lockKey, lockValue);
    } catch (e) {
      // Redis stub / connection dropped — the 10s TTL will release it.
    }
  };

  try {
    // --------------------------------
    // Step 3 — validate service(s)
    // --------------------------------
    const requestedServiceIds = [
      ...new Set(
        (Array.isArray(serviceIds) ? serviceIds : [serviceIds])
          .filter(Boolean)
          .map(String),
      ),
    ];

    if (requestedServiceIds.length === 0) {
      throw new AppError('At least one service is required', 400);
    }

    const services = await Service.find({
      _id: { $in: requestedServiceIds },
    });

    if (services.length !== requestedServiceIds.length) {
      throw new AppError('Selected service(s) not found', 404);
    }

    const primaryService = services[0];
    let totalPricePaid = 0;

    for (const svc of services) {
      if (!svc.isActive) {
        throw new AppError(`Service "${svc.name}" is not available`, 400);
      }

      if (svc.branchId.toString() !== slot.branchId.toString()) {
        throw new AppError(
          `Service "${svc.name}" does not belong to this branch`,
          400,
        );
      }

      if (
        svc.eligibleStaff &&
        svc.eligibleStaff.length > 0 &&
        !svc.eligibleStaff
          .map((id) => id.toString())
          .includes(slot.staffId.toString())
      ) {
        throw new AppError(
          `This staff member cannot perform the selected service "${svc.name}"`,
          400,
        );
      }

      totalPricePaid += svc.price ?? 0;
    }

    const serviceIdList = services.map((s) => s._id);

    // --------------------------------
    // Step 4 — customer double-booking check
    // Guests have no account, so there is nothing to compare.
    // --------------------------------
    if (customerId) {
      const conflict = await Appointment.findOne({
        customerId,
        date: slot.date,
        startTime: slot.startTime,
        status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      })
        .populate('salonId', 'name')
        .populate('serviceId', 'name')
        .populate('staffId', 'name');

      if (conflict) {
        const err = new AppError(
          'This customer already has an appointment at this time',
          400,
        );
        err.conflictAppointment = {
          _id: conflict._id,
          salonName: conflict.salonId?.name || 'Salon',
          serviceName: conflict.serviceId?.name || 'Service',
          staffName: conflict.staffId?.name || 'Specialist',
          date: conflict.date,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          status: conflict.status,
        };
        throw err;
      }
    }

    // --------------------------------
    // Step 5 — work out consecutive slots
    // --------------------------------
    let totalServiceDurationMinutes = 0;
    for (const svc of services) {
      totalServiceDurationMinutes += svc.durationMinutes || svc.duration || 30;
    }
    if (totalServiceDurationMinutes < 30) totalServiceDurationMinutes = 30;

    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const startMins = startHour * 60 + startMinute;
    const targetEndMins = startMins + totalServiceDurationMinutes;
    const computedEndTime = `${String(
      Math.floor(targetEndMins / 60) % 24,
    ).padStart(2, '0')}:${String(targetEndMins % 60).padStart(2, '0')}`;

    const consecutiveStaffSlots = await Slot.find({
      staffId: slot.staffId,
      date: slot.date,
    }).sort({ startTime: 1 });

    const requiredSlots = consecutiveStaffSlots.filter((s) => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const sMins = sh * 60 + sm;
      return sMins >= startMins && sMins < targetEndMins;
    });

    const requiredSlotIds = requiredSlots.map((s) => s._id);
    if (requiredSlotIds.length === 0) {
      requiredSlotIds.push(slot._id);
    }

    // --------------------------------
    // Step 6 — atomic multi-slot acquisition
    // --------------------------------
    const slotAcquireFilter = allowBookedByActor
      ? {
          $or: [
            { status: 'AVAILABLE' },
            {
              reservedBy: actorId,
              status: { $in: ['RESERVED', 'BOOKED'] },
            },
            {
              status: 'RESERVED',
              reservedAt: { $lt: tenMinsAgo },
              appointmentId: null,
            },
          ],
        }
      : {
          $or: [
            { status: 'AVAILABLE' },
            {
              status: 'RESERVED',
              reservedAt: { $lt: tenMinsAgo },
              appointmentId: null,
            },
          ],
        };

    const appointmentDoc = {
      salonId: slot.salonId,
      branchId: slot.branchId,
      customerId: customerId || null,
      ...(customerId
        ? {}
        : {
            customerSnapshot: {
              name: customerSnapshot?.name || null,
              phone: customerSnapshot?.phone || null,
              email: customerSnapshot?.email || null,
            },
          }),
      staffId: slot.staffId,
      serviceId: primaryService._id,
      services: serviceIdList,
      slotId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: computedEndTime,
      pricePaid: totalPricePaid,
      currency: primaryService.currency || 'INR',
      customerNotes: customerNotes || null,
      guests: guestCount,
      status,
      source,
      createdBy: actorId,
      statusHistory: [
        {
          status,
          changedBy: actorId,
          changedAt: new Date(),
          note:
            source === 'APP'
              ? 'Appointment booked by customer'
              : `Appointment created by ${actorRole} (${source})`,
        },
      ],
    };

    let appointment = null;

    let session = null;
    try {
      session = await mongoose.startSession();
    } catch (sErr) {
      session = null;
    }

    const acquireSlotsAtomically = async (sess) => {
      const acquiredSlotIds = [];
      try {
        for (const id of requiredSlotIds) {
          const acquired = await Slot.findOneAndUpdate(
            { _id: id, ...slotAcquireFilter },
            { status: 'BOOKED', reservedBy: actorId, reservedAt: new Date() },
            { new: true, session: sess },
          );
          if (!acquired) {
            throw new AppError(
              'Required consecutive slot was just booked by another customer',
              409,
            );
          }
          acquiredSlotIds.push(acquired._id);
        }

        const created = await Appointment.create([appointmentDoc], {
          session: sess,
        });
        appointment = created[0];

        await Slot.updateMany(
          { _id: { $in: acquiredSlotIds } },
          { appointmentId: appointment._id },
          { session: sess },
        );
      } catch (err) {
        if (acquiredSlotIds.length > 0) {
          await Slot.updateMany(
            { _id: { $in: acquiredSlotIds } },
            {
              status: 'AVAILABLE',
              reservedBy: null,
              reservedAt: null,
              appointmentId: null,
            },
            { session: sess },
          );
        }
        throw err;
      }
    };

    if (session && typeof session.withTransaction === 'function') {
      try {
        await session.withTransaction(acquireSlotsAtomically);
      } catch (txError) {
        // The transaction was aborted; anything it wrote is gone.
        appointment = null;

        if (
          txError.status === 409 ||
          txError.message?.includes('booked by another customer')
        ) {
          throw new AppError('Slot was just booked by another customer', 409);
        }
        // Standalone MongoDB (e.g. local dev / tests) has no transactions.
        // Fall through to the conditional-update fallback below.
      } finally {
        session.endSession();
      }
    }

    // --------------------------------
    // Step 7 — non-transactional fallback
    // --------------------------------
    if (!appointment) {
      const acquiredSlotIds = [];
      try {
        for (const id of requiredSlotIds) {
          const acquired = await Slot.findOneAndUpdate(
            { _id: id, ...slotAcquireFilter },
            { status: 'BOOKED', reservedBy: actorId, reservedAt: new Date() },
            { new: true },
          );
          if (!acquired) {
            throw new AppError(
              'Required consecutive slot was just booked by another customer',
              409,
            );
          }
          acquiredSlotIds.push(acquired._id);
        }

        appointment = await Appointment.create(appointmentDoc);

        await Slot.updateMany(
          { _id: { $in: acquiredSlotIds } },
          { appointmentId: appointment._id },
        );
      } catch (createErr) {
        if (acquiredSlotIds.length > 0) {
          await Slot.updateMany(
            { _id: { $in: acquiredSlotIds } },
            {
              status: 'AVAILABLE',
              reservedBy: null,
              reservedAt: null,
              appointmentId: null,
            },
          );
        }
        throw createErr;
      }
    }

    // --------------------------------
    // Step 8 — caches
    // --------------------------------
    delCachePattern(`branch:slots:${slot.branchId}:${slot.date}:*`);

    try {
      const branchForCache = await Branch.findById(slot.branchId)
        .select('citySlug')
        .lean();
      if (branchForCache?.citySlug) {
        delCachePattern(`initial_load:${branchForCache.citySlug}:*`);
      }
    } catch (e) {
      console.log('initial_load invalidation error:', e.message);
    }

    // --------------------------------
    // Step 9 — realtime event
    // --------------------------------
    try {
      const io = getIO();
      if (io) {
        const populated = await Appointment.findById(appointment._id)
          .populate('customerId', 'name')
          .populate('serviceId', 'name price')
          .populate('staffId', 'name')
          .populate('branchId', 'name')
          .populate('salonId', 'name')
          .lean();

        const eventData =
          buildAppointmentEventPayload(populated) ||
          buildAppointmentEventPayload(appointment);

        const branchIdStr = String(appointment.branchId);
        const salonIdStr = appointment.salonId
          ? String(appointment.salonId)
          : null;
        const customerIdStr = appointment.customerId
          ? String(appointment.customerId)
          : null;

        if (customerIdStr) {
          io.to(`customer_${customerIdStr}`).emit(
            'appointment_created',
            eventData,
          );
          io.to(`customer_${customerIdStr}`).emit(
            'appointment_status_changed',
            eventData,
          );
        }

        io.to(`branch_${branchIdStr}`).emit(
          'appointment_created',
          eventData,
        );
        io.to(`branch_${branchIdStr}`).emit(
          'appointment_updated',
          eventData,
        );

        if (salonIdStr) {
          io.to(`salon_${salonIdStr}`).emit(
            'appointment_created',
            eventData,
          );
          io.to(`salon_${salonIdStr}`).emit(
            'appointment_updated',
            eventData,
          );
        }
      }
    } catch (e) {
      console.log('WebSocket emit error:', e.message);
    }

    return { appointment, slot, services, primaryService };
  } finally {
    await releaseLock();
  }
};

module.exports = { createAppointment };
