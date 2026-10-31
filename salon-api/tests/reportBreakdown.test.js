// Booking source and payment method breakdown report.
//
// The endpoint returns two views over one aggregation:
//   - all appointments grouped by source (APP / WALK_IN / PHONE)
//   - only COMPLETED appointments grouped by payment method
//
// It must respect owner (whole salon) vs manager (own branch) scoping.

const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../src/app');
const User = require('../src/models/user.model');
const Role = require('../src/models/role.model');
const Permission = require('../src/models/permission.model');
const Salon = require('../src/models/salon.model');
const Branch = require('../src/models/branch.model');
const Appointment = require('../src/models/appointment.model');
const { delCachePattern } = require('../src/services/cache.service');

jest.setTimeout(180000);

let mongoServer;
let salon;
let branch;
let otherBranch;
let owner;
let manager;
let staff;

const DATE = '2026-02-10';
const START_DATE = '2026-02-01';
const END_DATE = '2026-02-28';

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

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const getBreakdown = (token) =>
  request(app)
    .get('/api/v1/reports/booking-breakdown')
    .set(auth(token))
    .query({ startDate: START_DATE, endDate: END_DATE });

const makeAppointment = (overrides = {}) =>
  Appointment.create({
    salonId: salon._id,
    branchId: branch._id,
    customerId: new mongoose.Types.ObjectId(),
    staffId: new mongoose.Types.ObjectId(),
    serviceId: new mongoose.Types.ObjectId(),
    services: [],
    slotId: new mongoose.Types.ObjectId(),
    date: DATE,
    startTime: '10:00',
    endTime: '11:00',
    pricePaid: 10000,
    status: 'COMPLETED',
    source: 'APP',
    paymentMethod: 'cash',
    ...overrides,
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
    Branch.deleteMany({}),
    Salon.deleteMany({}),
    User.deleteMany({}),
    Role.deleteMany({}),
    Permission.deleteMany({}),
  ]);
  await delCachePattern('report:booking-breakdown:*');

  const [reportRead] = await Permission.insertMany([
    { resource: 'report', action: 'read', description: 'Read reports' },
  ]);

  const [ownerRole, managerRole, staffRole] = await Promise.all([
    Role.create({ name: 'owner', permissions: [reportRead._id] }),
    Role.create({ name: 'manager', permissions: [reportRead._id] }),
    Role.create({ name: 'staff', permissions: [] }),
  ]);

  owner = await User.create({
    name: 'Owner One',
    email: 'owner@example.com',
    phone: '+91-9000000001',
    role: ownerRole._id,
    isActive: true,
  });

  salon = await Salon.create({
    name: 'Report Salon',
    owner: owner._id,
    contactEmail: 'report-salon@example.com',
  });
  owner.salonId = salon._id;
  await owner.save();

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

  manager = await User.create({
    name: 'Manager One',
    email: 'manager@example.com',
    phone: '+91-9000000020',
    role: managerRole._id,
    salonId: salon._id,
    branchId: branch._id,
    isActive: true,
  });

  staff = await User.create({
    name: 'Staff One',
    email: 'staff@example.com',
    phone: '+91-9000000030',
    role: staffRole._id,
    salonId: salon._id,
    branchId: branch._id,
    isActive: true,
  });

  // Main branch: two app bookings, three walk-ins and two phone bookings.
  await Promise.all([
    makeAppointment({
      source: 'APP',
      status: 'COMPLETED',
      paymentMethod: 'cash',
      pricePaid: 50000,
    }),
    makeAppointment({
      source: 'APP',
      status: 'CONFIRMED',
      paymentMethod: 'upi',
      pricePaid: 40000,
    }),
    makeAppointment({
      source: 'WALK_IN',
      status: 'COMPLETED',
      paymentMethod: 'upi',
      pricePaid: 30000,
    }),
    makeAppointment({
      source: 'WALK_IN',
      status: 'COMPLETED',
      paymentMethod: 'card',
      pricePaid: 20000,
    }),
    makeAppointment({
      source: 'WALK_IN',
      status: 'CANCELLED',
      paymentMethod: 'not_recorded',
      pricePaid: 25000,
    }),
    makeAppointment({
      source: 'PHONE',
      status: 'COMPLETED',
      paymentMethod: 'cash',
      pricePaid: 10000,
    }),
    makeAppointment({
      source: 'PHONE',
      status: 'COMPLETED',
      paymentMethod: 'not_recorded',
      pricePaid: 15000,
    }),
    // Same salon, different branch. Included for the owner, excluded for
    // the branch manager.
    makeAppointment({
      branchId: otherBranch._id,
      source: 'WALK_IN',
      status: 'COMPLETED',
      paymentMethod: 'cash',
      pricePaid: 88888,
    }),
  ]);
});

describe('GET /api/v1/reports/booking-breakdown', () => {
  test('owner sees salon-wide sources and completed payments by method', async () => {
    const res = await getBreakdown(tokenFor(owner, 'owner'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.period).toEqual({ startDate: START_DATE, endDate: END_DATE });

    expect(data.sources.total).toBe(8);
    expect(data.sources.items).toEqual([
      { source: 'APP', count: 2, completed: 1, percentage: 25 },
      { source: 'WALK_IN', count: 4, completed: 3, percentage: 50 },
      { source: 'PHONE', count: 2, completed: 2, percentage: 25 },
    ]);

    const payments = Object.fromEntries(
      data.payments.items.map((item) => [item.method, item]),
    );

    expect(data.payments.completedAppointments).toBe(6);
    expect(data.payments.totalCollected).toBe(213888);

    expect(payments.cash).toMatchObject({ count: 3, amount: 148888 });
    expect(payments.upi).toMatchObject({ count: 1, amount: 30000 });
    expect(payments.card).toMatchObject({ count: 1, amount: 20000 });
    expect(payments.other).toMatchObject({ count: 0, amount: 0 });
    expect(payments.not_recorded).toMatchObject({ count: 1, amount: 15000 });

    // The confirmed APP booking's UPI amount is not collected yet.
    expect(payments.upi.count).toBe(1);
    expect(payments.upi.amount).toBe(30000);
  });

  test('manager only sees their own branch', async () => {
    const res = await getBreakdown(tokenFor(manager, 'manager'));

    expect(res.status).toBe(200);
    const data = res.body.data;

    expect(data.sources.total).toBe(7);
    expect(data.sources.items).toEqual([
      { source: 'APP', count: 2, completed: 1, percentage: 28.6 },
      { source: 'WALK_IN', count: 3, completed: 2, percentage: 42.9 },
      { source: 'PHONE', count: 2, completed: 2, percentage: 28.6 },
    ]);

    const payments = Object.fromEntries(
      data.payments.items.map((item) => [item.method, item]),
    );

    expect(data.payments.completedAppointments).toBe(5);
    expect(data.payments.totalCollected).toBe(125000);
    expect(payments.cash).toMatchObject({ count: 2, amount: 60000, percentage: 48 });
    expect(payments.upi).toMatchObject({ count: 1, amount: 30000, percentage: 24 });
    expect(payments.card).toMatchObject({ count: 1, amount: 20000, percentage: 16 });
    expect(payments.not_recorded).toMatchObject({
      count: 1,
      amount: 15000,
      percentage: 12,
    });
  });

  test('requires authentication and report:read permission', async () => {
    const anonymous = await request(app)
      .get('/api/v1/reports/booking-breakdown')
      .query({ startDate: START_DATE, endDate: END_DATE });
    expect(anonymous.status).toBe(401);

    const forbidden = await getBreakdown(tokenFor(staff, 'staff'));
    expect(forbidden.status).toBe(403);
  });
});
