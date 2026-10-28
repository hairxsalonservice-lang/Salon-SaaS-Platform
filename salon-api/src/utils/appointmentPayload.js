// Socket events are visible to every client in a room. Only send the fields
// the UI needs for a live update — never the full appointment document, which
// contains customer email/phone and internal notes.
const buildAppointmentEventPayload = (appointment) => {
  if (!appointment) return null;

  const raw =
    typeof appointment.toObject === "function"
      ? appointment.toObject()
      : appointment;

  const asObject = (value) =>
    value && typeof value === "object" && (value._id || value.name)
      ? value
      : null;

  const idOf = (value) => {
    const object = asObject(value);
    return object ? object._id || object.id || null : value || null;
  };

  const customer = asObject(raw.customerId);
  const snapshot = raw.customerSnapshot || {};
  const customerName = customer?.name || snapshot.name || raw.customerName || null;
  const service = asObject(raw.serviceId);
  const staff = asObject(raw.staffId);
  const branch = asObject(raw.branchId);
  const salon = asObject(raw.salonId);

  return {
    appointmentId: raw._id,
    status: raw.status,
    source: raw.source || "APP",
    customerName,
    serviceName: service?.name || raw.serviceName || null,
    appointment: {
      _id: raw._id,
      status: raw.status,
      source: raw.source || "APP",
      date: raw.date,
      startTime: raw.startTime,
      endTime: raw.endTime,
      pricePaid: raw.pricePaid,
      customerId: {
        _id: idOf(raw.customerId),
        name: customerName,
      },
      serviceId: {
        _id: idOf(raw.serviceId),
        name: service?.name || raw.serviceName || null,
        price: service?.price ?? null,
      },
      staffId: {
        _id: idOf(raw.staffId),
        name: staff?.name || null,
      },
      branchId: {
        _id: idOf(raw.branchId),
        name: branch?.name || null,
      },
      salonId: {
        _id: idOf(raw.salonId),
        name: salon?.name || null,
      },
    },
  };
};

module.exports = { buildAppointmentEventPayload };
