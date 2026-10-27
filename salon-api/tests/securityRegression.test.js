// Regression tests for the vulnerabilities fixed during the security audit.
// These cover the DB-backed paths: Apple identity binding, tenant-scoped
// deletion, logout revocation and the reduced socket payload.

const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../src/app');
const User = require('../src/models/user.model');
const Role = require('../src/models/role.model');
const UploadedFile = require('../src/models/uploadedFile.model');
const StorageService = require('../src/services/storage.service');
const {
  buildAppointmentEventPayload,
} = require('../src/controllers/appointment.controller');

jest.setTimeout(180000);

let mongoServer;
let customerRole;

const mintAccessToken = (user, overrides = {}) =>
  jwt.sign(
    {
      userId: String(user._id),
      role: 'customer',
      tokenVersion: user.tokenVersion ?? 0,
      ...overrides,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' },
  );

const mockAppleToken = (claims) => {
  jest.spyOn(jwt, 'verify').mockImplementation((token, key, options, callback) => {
    callback(null, {
      iss: 'https://appleid.apple.com',
      aud: process.env.APPLE_CLIENT_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
      ...claims,
    });
  });
};

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
    User.deleteMany({}),
    Role.deleteMany({}),
    UploadedFile.deleteMany({}),
  ]);
  customerRole = await Role.create({ name: 'customer' });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Apple sign-in identity binding', () => {
  const appleLogin = (body) => request(app).post('/api/v1/auth/apple').send(body);

  test('fails closed with 503 when APPLE_CLIENT_ID is not configured', async () => {
    const original = process.env.APPLE_CLIENT_ID;
    delete process.env.APPLE_CLIENT_ID;

    try {
      mockAppleToken({ sub: 'apple-sub', email: 'user@example.com' });

      const res = await appleLogin({ identityToken: 'fake-but-well-formed' });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(await User.countDocuments()).toBe(0);
    } finally {
      process.env.APPLE_CLIENT_ID = original;
    }
  });

  test('never trusts request-body user/email over the verified token', async () => {
    mockAppleToken({
      sub: 'apple-real-sub',
      email: 'real@example.com',
      email_verified: 'true',
    });

    const res = await appleLogin({
      identityToken: 'token',
      user: 'victim-apple-sub',
      email: 'victim@example.com',
      fullName: { givenName: 'Real', familyName: 'User' },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('real@example.com');

    const created = await User.findOne({ email: 'real@example.com' }).lean();
    expect(created).toBeTruthy();
    expect(created.appleId).toBe('apple-real-sub');

    expect(await User.findOne({ email: 'victim@example.com' })).toBeNull();
    expect(await User.findOne({ appleId: 'victim-apple-sub' })).toBeNull();
  });

  test('links an existing password account by the verified token email', async () => {
    const existing = await User.create({
      name: 'Existing',
      email: 'existing@example.com',
      role: customerRole._id,
    });

    mockAppleToken({
      sub: 'apple-link-sub',
      email: 'existing@example.com',
      email_verified: 'true',
    });

    const res = await appleLogin({ identityToken: 'token' });

    expect(res.status).toBe(200);

    const users = await User.find({ email: 'existing@example.com' }).lean();
    expect(users).toHaveLength(1);
    expect(String(users[0]._id)).toBe(String(existing._id));
    expect(users[0].appleId).toBe('apple-link-sub');
    expect(users[0].isEmailVerified).toBe(true);
  });

  test('refuses to take over an account linked to a different Apple subject', async () => {
    await User.create({
      name: 'Already Linked',
      email: 'taken@example.com',
      appleId: 'other-apple-sub',
      role: customerRole._id,
    });

    mockAppleToken({
      sub: 'attacker-apple-sub',
      email: 'taken@example.com',
      email_verified: 'true',
    });

    const res = await appleLogin({ identityToken: 'token' });

    expect(res.status).toBe(409);

    const user = await User.findOne({ email: 'taken@example.com' }).lean();
    expect(user.appleId).toBe('other-apple-sub');
  });

  test('rejects a token whose Apple email is not verified', async () => {
    mockAppleToken({
      sub: 'apple-unverified-sub',
      email: 'unverified@example.com',
      email_verified: false,
    });

    const res = await appleLogin({ identityToken: 'token' });

    expect(res.status).toBe(401);
    expect(await User.countDocuments()).toBe(0);
  });

  test('rejects a token without a stable subject', async () => {
    mockAppleToken({ email: 'nosub@example.com', email_verified: 'true' });

    const res = await appleLogin({ identityToken: 'token' });

    expect(res.status).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });
});

describe('Tenant-scoped file deletion', () => {
  const uploaderId = new mongoose.Types.ObjectId();
  const salonA = new mongoose.Types.ObjectId();
  const salonB = new mongoose.Types.ObjectId();
  const branchA1 = new mongoose.Types.ObjectId();
  const branchA2 = new mongoose.Types.ObjectId();
  const branchB1 = new mongoose.Types.ObjectId();

  const makeFile = (overrides = {}) =>
    UploadedFile.create({
      key: 'salons/a/gallery/file.png',
      url: 'https://cdn.example.com/salons/a/gallery/file.png',
      originalName: 'file.png',
      mimeType: 'image/png',
      size: 100,
      folder: 'gallery',
      uploadedBy: uploaderId,
      salonId: salonA,
      branchId: branchA1,
      ...overrides,
    });

  test('an owner from another salon cannot delete the file', async () => {
    const file = await makeFile();

    const result = await StorageService.deleteFile(file.key, {
      userId: new mongoose.Types.ObjectId(),
      role: 'owner',
      salonId: salonB,
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('UNAUTHORIZED');
    expect(await UploadedFile.countDocuments({ key: file.key })).toBe(1);
  });

  test('a manager from another branch of the same salon cannot delete the file', async () => {
    const file = await makeFile();

    const result = await StorageService.deleteFile(file.key, {
      userId: new mongoose.Types.ObjectId(),
      role: 'manager',
      salonId: salonA,
      branchId: branchA2,
    });

    expect(result.success).toBe(false);
    expect(await UploadedFile.countDocuments({ key: file.key })).toBe(1);
  });

  test('the owner of the salon can delete the file', async () => {
    const file = await makeFile();

    const result = await StorageService.deleteFile(file.key, {
      userId: new mongoose.Types.ObjectId(),
      role: 'owner',
      salonId: salonA,
    });

    expect(result.success).toBe(true);
    expect(await UploadedFile.countDocuments({ key: file.key })).toBe(0);
  });

  test('a manager of the exact salon and branch can delete the file', async () => {
    const file = await makeFile();

    const result = await StorageService.deleteFile(file.key, {
      userId: new mongoose.Types.ObjectId(),
      role: 'manager',
      salonId: salonA,
      branchId: branchA1,
    });

    expect(result.success).toBe(true);
  });

  test('the uploader can always delete their own file', async () => {
    const file = await makeFile();

    const result = await StorageService.deleteFile(file.key, {
      userId: uploaderId,
      role: 'manager',
      salonId: salonB,
      branchId: branchB1,
    });

    expect(result.success).toBe(true);
  });

  test('untracked files are superadmin-only', async () => {
    const untrackedKey = 'legacy/orphan.png';

    const denied = await StorageService.deleteFile(untrackedKey, {
      userId: new mongoose.Types.ObjectId(),
      role: 'owner',
      salonId: salonA,
    });
    expect(denied.success).toBe(false);

    const allowed = await StorageService.deleteFile(untrackedKey, {
      userId: new mongoose.Types.ObjectId(),
      role: 'superadmin',
    });
    expect(allowed.success).toBe(true);
  });
});

describe('Logout invalidates the current access token', () => {
  test('replaying the token after logout returns 401', async () => {
    const user = await User.create({
      name: 'Customer',
      email: 'logout@example.com',
      role: customerRole._id,
      isEmailVerified: true,
    });

    const token = mintAccessToken(user);

    const before = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);

    const replay = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(replay.status).toBe(401);

    const updated = await User.findById(user._id).lean();
    expect(updated.tokenVersion).toBe(1);
  });
});

describe('Socket appointment payload', () => {
  test('omits customer contact details and internal notes', () => {
    const payload = buildAppointmentEventPayload({
      _id: 'appointment-1',
      status: 'CONFIRMED',
      date: '2026-11-01',
      startTime: '10:00',
      endTime: '11:00',
      pricePaid: 500,
      customerNotes: 'private customer note',
      internalNotes: 'staff-only note',
      customerId: {
        _id: 'customer-1',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '+919999999999',
      },
      serviceId: { _id: 'service-1', name: 'Haircut', price: 500 },
      staffId: { _id: 'staff-1', name: 'Bob', email: 'bob@example.com' },
      branchId: { _id: 'branch-1', name: 'Main Branch' },
      salonId: { _id: 'salon-1', name: 'Salon' },
    });

    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain('alice@example.com');
    expect(serialized).not.toContain('+919999999999');
    expect(serialized).not.toContain('bob@example.com');
    expect(serialized).not.toContain('private customer note');
    expect(serialized).not.toContain('staff-only note');
    expect(payload.customerName).toBe('Alice');
    expect(payload.appointment.customerId).toEqual({
      _id: 'customer-1',
      name: 'Alice',
    });
  });
});
