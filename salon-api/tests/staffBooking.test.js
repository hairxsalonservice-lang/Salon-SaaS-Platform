// Staff-created appointments for walk-in / phone customers.
//
// These exercise the DB-backed path: guest snapshots, linking an existing
// app customer, branch scoping, slot conflicts, staff leave, multi-service
// duration, and the permission boundary.

const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dayjs = require('dayjs');

const { app } = require('../src/app');
const User = require('../src/models/user.model');
const Role = require('../src/models/role.model');
const Permission = require('../src/models/permission.model');
const Salon = require('../src/models/salon.model');
const Branch = require('../src/models/branch.model');
const Service = require('../src/models/service.model');
const Slot = require('../src/models/slot.model');
const Appointment = require('../src/models/appointment.model');
const StaffLeave = require('../src/models/staffLeave.model');

jest.setTimeout(180000);

let mongoServer;

let roles = {};
let salon;
let otherSalon;
let branch;
let otherBranch;
let staffA;
let staffB;
let otherBranchStaff;
let manager;
let owner;
let customer;
let outsiderCustomer;
let serviceHaircut;
let serviceWash;
let slotA1;
let slotA2;
let slotB1;
let otherBranchSlot;
let date;

const tokenFor = (user, role) =>
  jwt.sign(
    {
      userId: String(user._id),
      role,
      tokenVersion: user.tokenVersion ?? 0,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' },
  );

const asStaff = () => tokenFor(staffA, 'staff');
const asManager = () => tokenFor(manager, 'manager');
const asOwner = () => tokenFor(owner, 'owner');
const asCustomer = () => tokenFor(customer, 'customer');

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const staffBooking = (token, body) =>
  request(app)
    .post('/api/v1/appointments/staff')
    .set(auth(token))
    .send(body);

const guest = (overrides = {}) => ({
  name: 'Walk In Guest',
  phone: '+91 98765 43210',
  ...overrides,
});

const makeAppointment = (overrides = {}) =>
  Appointment.create({
    salonId: salon._id,
    branchId: branch._id,
    customerId: customer._id,
    staffId: staffA._id,
    serviceId: serviceHaircut._id,
    services: [serviceHaircut._id],
    slotId: new mongoose.Types.ObjectId(),
    date: dayjs(date).subtract(7, 'day').format('YYYY-MM-DD'),
    startTime: '10:00',
    endTime: '11:00',
    pricePaid: 50000,
    status: 'COMPLETED',
    source: 'APP',
    ...overrides,
  });

const makeSlot = (staff, startTime, endTime, targetBranch = branch) =>
  Slot.create({
    salonId: salon._id,
    branchId: targetBranch._id,
    staffId: staff._id,
    date,
    startTime,
    endTime,
    status: 'AVAILABLE',
  });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.6' } });
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    Appointment.deleteMany({}),
    Slot.deleteMany({}),
    StaffLeave.deleteMany({}),
    Service.deleteMany({}),
    Branch.deleteMany({}),
    Salon.deleteMany({}),
    User.deleteMany({}),
    Role.deleteMany({}),
    Permission.deleteMany({}),
  ]);

  const permissions = await Permission.insertMany([
    { resource: 'appointment', action: 'create', description: 'Book' },
    { resource: 'appointment', action: 'read', description: 'Read' },
    { resource: 'appointment', action: 'update', description: 'Update' },
  ]);
  const permissionIds = permissions.map((p) => p._id);

  const [ownerRole, managerRole, staffRole, customerRole] = await Promise.all([
    Role.create({ name: 'owner', permissions: permissionIds }),
    Role.create({ name: 'manager', permissions: permissionIds }),
    Role.create({ name: 'staff', permissions: permissionIds }),
    Role.create({ name: 'customer', permissions: permissionIds }),
  ]);
  roles = { ownerRole, managerRole, staffRole, customerRole };

  owner = await User.create({
    name: 'Owner One',
    email: 'owner@example.com',
    phone: '+91-9000000001',
    role: ownerRole._id,
    isActive: true,
  });

  salon = await Salon.create({
    name: 'Test Salon',
    owner: owner._id,
    contactEmail: 'salon@example.com',
  });
  owner.salonId = salon._id;
  await owner.save();

  otherSalon = await Salon.create({
    name: 'Other Salon',
    owner: new mongoose.Types.ObjectId(),
  });

  branch = await Branch.create({
    salonId: salon._id,
    name: 'Main Branch',
    address: {
      street: '1 Main Road',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751001',
    },
    contactPhone: '+91-9000000002',
  });
  otherBranch = await Branch.create({
    salonId: salon._id,
    name: 'Second Branch',
    address: {
      street: '2 Side Road',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751002',
    },
    contactPhone: '+91-9000000003',
  });

  staffA = await User.create({
    name: 'Staff A',
    email: 'staff.a@example.com',
    phone: '+91-9000000010',
    role: staffRole._id,
    salonId: salon._id,
    branchId: branch._id,
    isActive: true,
  });
  staffB = await User.create({
    name: 'Staff B',
    email: 'staff.b@example.com',
    phone: '+91-9000000011',
    role: staffRole._id,
    salonId: salon._id,
    branchId: branch._id,
    isActive: true,
  });
  otherBranchStaff = await User.create({
    name: 'Staff Other Branch',
    email: 'staff.other@example.com',
    phone: '+91-9000000012',
    role: staffRole._id,
    salonId: salon._id,
    branchId: otherBranch._id,
    isActive: true,
  });
  manager = await User.create({
    name: 'Manager One',
    email: 'manager@example.com',
    phone: '+91-9000000020',
    role: managerRole._id,
    salonId: salon._id,
    branchId: branch._id,
    isActive: true,
  });
  customer = await User.create({
    name: 'Known Customer',
    email: 'known@example.com',
    phone: '+91-9876543001',
    role: customerRole._id,
    isActive: true,
    isEmailVerified: true,
  });
  outsiderCustomer = await User.create({
    name: 'Outsider Customer',
    email: 'outsider@example.com',
    phone: '+91-9876543002',
    role: customerRole._id,
    isActive: true,
    isEmailVerified: true,
  });

  [serviceHaircut, serviceWash] = await Service.insertMany([
    {
      branchId: branch._id,
      salonId: salon._id,
      name: 'Haircut',
      category: 'hair',
      price: 50000,
      durationMinutes: 60,
      eligibleStaff: [staffA._id, staffB._id],
      isActive: true,
    },
    {
      branchId: branch._id,
      salonId: salon._id,
      name: 'Hair Wash',
      category: 'hair',
      price: 20000,
      durationMinutes: 30,
      eligibleStaff: [staffA._id, staffB._id],
      isActive: true,
    },
  ]);

  date = dayjs().add(3, 'day').format('YYYY-MM-DD');

  slotA1 = await makeSlot(staffA, '10:00', '11:00');
  slotA2 = await makeSlot(staffA, '11:00', '12:00');
  slotB1 = await makeSlot(staffB, '10:00', '11:00');
  otherBranchSlot = await makeSlot(
    otherBranchStaff,
    '10:00',
    '11:00',
    otherBranch,
  );
});

describe('Staff walk-in and phone bookings', () => {
  test('a staff member can create a guest walk-in appointment', async () => {
    const res = await staffBooking(asStaff(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      branchId: branch._id,
      customer: guest(),
      source: 'WALK_IN',
    });

    expect(res.status).toBe(201);
    const appointment = res.body.data.appointment;

    expect(appointment.customerId).toBeNull();
    expect(appointment.customerSnapshot).toMatchObject({
      name: 'Walk In Guest',
      phone: '+91 98765 43210',
    });
    expect(appointment.source).toBe('WALK_IN');
    expect(appointment.status).toBe('CONFIRMED');
    expect(appointment.pricePaid).toBe(50000);
    expect(String(appointment.createdBy)).toBe(String(staffA._id));

    const slot = await Slot.findById(slotA1._id);
    expect(slot.status).toBe('BOOKED');
    expect(String(slot.appointmentId)).toBe(String(appointment._id));

    const history = appointment.statusHistory;
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe('CONFIRMED');
  });

  test('a phone booking is recorded with source PHONE', async () => {
    const res = await staffBooking(asStaff(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      branchId: branch._id,
      customer: guest({ name: 'Phone Guest', phone: '9876543211' }),
      source: 'PHONE',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.appointment.source).toBe('PHONE');
  });

  test('staff can book an active colleague and then see that booking', async () => {
    const res = await staffBooking(asStaff(), {
      slotId: slotB1._id,
      serviceId: serviceHaircut._id,
      staffId: staffB._id,
      branchId: branch._id,
      customer: guest(),
    });

    expect(res.status).toBe(201);
    expect(String(res.body.data.appointment.staffId)).toBe(String(staffB._id));
    expect(String(res.body.data.appointment.createdBy)).toBe(String(staffA._id));

    const list = await request(app)
      .get('/api/v1/appointments')
      .query({ date })
      .set(auth(asStaff()));

    expect(list.status).toBe(200);
    const ids = list.body.data.appointments.map((a) => String(a._id));
    expect(ids).toContain(String(res.body.data.appointment._id));
  });

  test('owner can create a booking for a staff member in another branch', async () => {
    const res = await staffBooking(asOwner(), {
      slotId: otherBranchSlot._id,
      serviceId: serviceHaircut._id,
      branchId: otherBranch._id,
      customer: guest(),
    });

    // The service belongs to the main branch, so this correctly fails even
    // though the owner is allowed to act on either branch.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not belong to this branch/i);

    const service = await Service.create({
      branchId: otherBranch._id,
      salonId: salon._id,
      name: 'Other Branch Cut',
      category: 'hair',
      price: 40000,
      durationMinutes: 60,
      eligibleStaff: [otherBranchStaff._id],
      isActive: true,
    });

    const ok = await staffBooking(asOwner(), {
      slotId: otherBranchSlot._id,
      serviceId: service._id,
      branchId: otherBranch._id,
      customer: guest(),
    });

    expect(ok.status).toBe(201);
    expect(String(ok.body.data.appointment.branchId)).toBe(
      String(otherBranch._id),
    );
  });

  test('a customer account already known to the salon can be linked', async () => {
    await makeAppointment();

    const res = await staffBooking(asManager(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      customerId: customer._id,
    });

    expect(res.status).toBe(201);
    expect(String(res.body.data.appointment.customerId)).toBe(
      String(customer._id),
    );
    expect(res.body.data.appointment.customerSnapshot?.name).toBeFalsy();
  });

  test('a customer never seen by this salon cannot be linked', async () => {
    const res = await staffBooking(asManager(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      customerId: outsiderCustomer._id,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not known to your salon/i);
    expect(await Appointment.countDocuments()).toBe(0);
  });

  test('lookup only returns customers already known to the salon', async () => {
    const unknown = await request(app)
      .get('/api/v1/appointments/staff/customer-lookup')
      .query({ phone: '9876543001' })
      .set(auth(asStaff()));

    expect(unknown.status).toBe(200);
    expect(unknown.body.data.customer).toBeNull();

    await makeAppointment();

    const known = await request(app)
      .get('/api/v1/appointments/staff/customer-lookup')
      .query({ phone: '9876543001' })
      .set(auth(asStaff()));

    expect(known.status).toBe(200);
    expect(String(known.body.data.customer._id)).toBe(String(customer._id));
    expect(known.body.data.customer.phone).toBeUndefined();
  });

  test('staff cannot create a booking outside their own branch', async () => {
    const res = await staffBooking(asStaff(), {
      slotId: otherBranchSlot._id,
      serviceId: serviceHaircut._id,
      branchId: otherBranch._id,
      customer: guest(),
    });

    expect(res.status).toBe(403);
    expect(await Appointment.countDocuments()).toBe(0);
  });

  test('a manager cannot create a booking outside their own branch', async () => {
    const res = await staffBooking(asManager(), {
      slotId: otherBranchSlot._id,
      serviceId: serviceHaircut._id,
      branchId: otherBranch._id,
      customer: guest(),
    });

    expect(res.status).toBe(403);
  });

  test('a slot that is already booked is rejected', async () => {
    const first = await staffBooking(asStaff(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      branchId: branch._id,
      customer: guest({ name: 'First' }),
    });
    expect(first.status).toBe(201);

    const second = await staffBooking(asStaff(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      branchId: branch._id,
      customer: guest({ name: 'Second' }),
    });

    expect(second.status).toBe(409);
    expect(await Appointment.countDocuments()).toBe(1);
  });

  test('an approved staff leave blocks the booking', async () => {
    await StaffLeave.create({
      staffId: staffA._id,
      branchId: branch._id,
      salonId: salon._id,
      createdBy: manager._id,
      type: 'SINGLE',
      date,
      allDay: true,
      status: 'APPROVED',
      isActive: true,
    });

    const res = await staffBooking(asStaff(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      branchId: branch._id,
      customer: guest(),
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not available/i);
  });

  test('multi-service bookings reserve consecutive slots and sum the price', async () => {
    const res = await staffBooking(asStaff(), {
      slotId: slotA1._id,
      serviceIds: [serviceHaircut._id, serviceWash._id],
      branchId: branch._id,
      customer: guest(),
    });

    expect(res.status).toBe(201);
    const appointment = res.body.data.appointment;

    expect(appointment.endTime).toBe('11:30');
    expect(appointment.pricePaid).toBe(70000);
    expect(appointment.services).toHaveLength(2);

    const slots = await Slot.find({ _id: { $in: [slotA1._id, slotA2._id] } });
    expect(slots.every((s) => s.status === 'BOOKED')).toBe(true);
    expect(
      slots.every((s) => String(s.appointmentId) === String(appointment._id)),
    ).toBe(true);
  });

  test('guest name and phone are required', async () => {
    const missingPhone = await staffBooking(asStaff(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      branchId: branch._id,
      customer: { name: 'No Phone' },
    });
    expect(missingPhone.status).toBe(400);

    const bothCustomerAndGuest = await staffBooking(asStaff(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      customerId: customer._id,
      customer: guest(),
    });
    expect(bothCustomerAndGuest.status).toBe(400);
    expect(await Appointment.countDocuments()).toBe(0);
  });

  test('a customer token cannot use the staff booking endpoint', async () => {
    const res = await staffBooking(asCustomer(), {
      slotId: slotA1._id,
      serviceId: serviceHaircut._id,
      customer: guest(),
    });

    expect(res.status).toBe(403);
    expect(await Appointment.countDocuments()).toBe(0);
  });
});
