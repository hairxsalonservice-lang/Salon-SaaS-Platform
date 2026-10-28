// End-to-end Socket.IO tests: handshake authentication, DB-backed identity,
// and room authorization. Each test talks to the real Socket.IO server over an
// ephemeral loopback port.

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { io: createClient } = require('socket.io-client');

const { server } = require('../src/app');
const { getIO } = require('../src/config/socket');
const { generateAccessToken } = require('../src/utils/token');
const User = require('../src/models/user.model');
const Role = require('../src/models/role.model');
const Branch = require('../src/models/branch.model');

jest.setTimeout(180000);

let mongoServer;
let baseUrl;
let roleDocs = {};
let emailSeq = 0;
const openClients = new Set();

const nextEmail = (label) => `${label}-${++emailSeq}@example.com`;

const signFor = (user, roleName, overrides = {}) =>
  generateAccessToken({
    _id: user._id,
    roleName,
    salonId: user.salonId,
    branchId: user.branchId,
    tokenVersion: user.tokenVersion,
    ...overrides,
  });

const createUser = async ({
  role,
  email,
  salonId = null,
  branchId = null,
  isActive = true,
}) =>
  User.create({
    name: `${role} user`,
    email: email || nextEmail(role),
    role: roleDocs[role]._id,
    salonId,
    branchId,
    isActive,
    isEmailVerified: true,
  });

const createBranch = (salonId, name) =>
  Branch.create({
    salonId,
    name,
    address: {
      street: '1 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    contactPhone: '9999999999',
  });

const openSocket = (token) =>
  new Promise((resolve, reject) => {
    const client = createClient(baseUrl, {
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
      timeout: 5000,
      auth: token === undefined ? {} : { token },
    });

    openClients.add(client);

    client.once('connect', () => resolve(client));
    client.once('connect_error', (err) => {
      openClients.delete(client);
      client.close();
      reject(err);
    });
  });

const connectError = async (token) => {
  try {
    await openSocket(token);
  } catch (err) {
    return err.message;
  }
  throw new Error('Expected the socket connection to be rejected');
};

const emitAck = (socket, event, payload) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event} ack`)),
      5000,
    );
    socket.emit(event, payload, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });

const roomHasSocket = (socketId, roomName) =>
  Boolean(getIO()?.sockets?.adapter?.rooms?.get(roomName)?.has(socketId));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.6' } });
  await mongoose.connect(mongoServer.getUri());

  roleDocs = {
    customer: await Role.create({ name: 'customer' }),
    manager: await Role.create({ name: 'manager' }),
    owner: await Role.create({ name: 'owner' }),
  };

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  openClients.forEach((client) => client.close());
  openClients.clear();

  await new Promise((resolve) => {
    const io = getIO();
    if (io) io.close(resolve);
    else resolve();
  });

  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  openClients.forEach((client) => client.close());
  openClients.clear();
  await Promise.all([User.deleteMany({}), Branch.deleteMany({})]);
});

afterEach(() => {
  openClients.forEach((client) => client.close());
  openClients.clear();
});

describe('Socket handshake authentication', () => {
  test('rejects a connection with no token', async () => {
    expect(await connectError(undefined)).toBe('Authentication required');
  });

  test('rejects a malformed token', async () => {
    expect(await connectError('not-a-jwt')).toBe('Invalid or expired token');
  });

  test('rejects an expired token', async () => {
    const user = await createUser({ role: 'customer' });
    const jwt = require('jsonwebtoken');

    const pastToken = jwt.sign(
      {
        userId: String(user._id),
        role: 'customer',
        tokenVersion: user.tokenVersion,
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      process.env.JWT_ACCESS_SECRET,
    );

    expect(await connectError(pastToken)).toBe('Invalid or expired token');
  });

  test('rejects a deactivated account', async () => {
    const user = await createUser({ role: 'customer', isActive: false });

    expect(await connectError(signFor(user, 'customer'))).toBe(
      'Account is inactive',
    );
  });

  test('rejects a token whose tokenVersion was revoked', async () => {
    const user = await createUser({ role: 'customer' });
    const staleToken = signFor(user, 'customer', {
      tokenVersion: (user.tokenVersion || 0) + 5,
    });

    expect(await connectError(staleToken)).toBe('Session expired');
  });

  test('accepts a valid, active token', async () => {
    const user = await createUser({ role: 'customer' });
    const socket = await openSocket(signFor(user, 'customer'));

    expect(socket.connected).toBe(true);
  });
});

describe('Socket room authorization', () => {
  test('a customer can only join their own personal room', async () => {
    const customer = await createUser({ role: 'customer' });
    const other = new mongoose.Types.ObjectId();
    const socket = await openSocket(signFor(customer, 'customer'));

    expect(await emitAck(socket, 'join_customer', String(customer._id))).toEqual({
      joined: true,
    });
    expect(
      roomHasSocket(socket.id, `customer_${customer._id}`),
    ).toBe(true);

    expect(await emitAck(socket, 'join_customer', String(other))).toEqual({
      joined: false,
    });
    expect(roomHasSocket(socket.id, `customer_${other}`)).toBe(false);

    expect(await emitAck(socket, 'join_user', String(customer._id))).toEqual({
      joined: true,
    });
    expect(await emitAck(socket, 'join_user', String(other))).toEqual({
      joined: false,
    });
  });

  test('a manager can only join their own branch and never the salon room', async () => {
    const salonA = new mongoose.Types.ObjectId();
    const salonB = new mongoose.Types.ObjectId();
    const branchA1 = await createBranch(salonA, 'Salon A - Branch 1');
    const branchA2 = await createBranch(salonA, 'Salon A - Branch 2');
    const branchB1 = await createBranch(salonB, 'Salon B - Branch 1');

    const manager = await createUser({
      role: 'manager',
      salonId: salonA,
      branchId: branchA1._id,
    });
    const socket = await openSocket(signFor(manager, 'manager'));

    expect(await emitAck(socket, 'join_branch', String(branchA1._id))).toEqual({
      joined: true,
    });
    expect(roomHasSocket(socket.id, `branch_${branchA1._id}`)).toBe(true);

    expect(await emitAck(socket, 'join_branch', String(branchA2._id))).toEqual({
      joined: false,
    });
    expect(roomHasSocket(socket.id, `branch_${branchA2._id}`)).toBe(false);

    expect(await emitAck(socket, 'join_branch', String(branchB1._id))).toEqual({
      joined: false,
    });
    expect(roomHasSocket(socket.id, `branch_${branchB1._id}`)).toBe(false);

    expect(await emitAck(socket, 'join_salon', String(salonA))).toEqual({
      joined: false,
    });
    expect(roomHasSocket(socket.id, `salon_${salonA}`)).toBe(false);
  });

  test('an owner can join their salon and its branches, but not another salon', async () => {
    const salonA = new mongoose.Types.ObjectId();
    const salonB = new mongoose.Types.ObjectId();
    const branchA1 = await createBranch(salonA, 'Salon A - Branch 1');
    const branchA2 = await createBranch(salonA, 'Salon A - Branch 2');
    const branchB1 = await createBranch(salonB, 'Salon B - Branch 1');

    const owner = await createUser({ role: 'owner', salonId: salonA });
    const socket = await openSocket(signFor(owner, 'owner'));

    expect(await emitAck(socket, 'join_salon', String(salonA))).toEqual({
      joined: true,
    });
    expect(roomHasSocket(socket.id, `salon_${salonA}`)).toBe(true);

    expect(await emitAck(socket, 'join_salon', String(salonB))).toEqual({
      joined: false,
    });
    expect(roomHasSocket(socket.id, `salon_${salonB}`)).toBe(false);

    expect(await emitAck(socket, 'join_branch', String(branchA1._id))).toEqual({
      joined: true,
    });
    expect(await emitAck(socket, 'join_branch', String(branchA2._id))).toEqual({
      joined: true,
    });
    expect(await emitAck(socket, 'join_branch', String(branchB1._id))).toEqual({
      joined: false,
    });
    expect(roomHasSocket(socket.id, `branch_${branchB1._id}`)).toBe(false);
  });

  test('stale role/salon claims in a token cannot expand room access', async () => {
    const salonA = new mongoose.Types.ObjectId();
    const salonB = new mongoose.Types.ObjectId();
    const branchA1 = await createBranch(salonA, 'Salon A - Branch 1');
    const branchB1 = await createBranch(salonB, 'Salon B - Branch 1');

    const manager = await createUser({
      role: 'manager',
      salonId: salonA,
      branchId: branchA1._id,
    });

    // Simulates a token minted before the user's role/scope changed: the
    // signature is valid, but its claims no longer match the database.
    const staleClaims = signFor(manager, 'owner', {
      salonId: salonB,
      branchId: branchB1._id,
    });

    const socket = await openSocket(staleClaims);

    expect(await emitAck(socket, 'join_salon', String(salonB))).toEqual({
      joined: false,
    });
    expect(await emitAck(socket, 'join_salon', String(salonA))).toEqual({
      joined: false,
    });
    expect(await emitAck(socket, 'join_branch', String(branchB1._id))).toEqual({
      joined: false,
    });
    expect(await emitAck(socket, 'join_branch', String(branchA1._id))).toEqual({
      joined: true,
    });
  });
});
