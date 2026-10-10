'use strict';

// Must be set before any app code is required
process.env.JWT_SECRET = 'test-secret';
process.env.CLIENT_URL = '*';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Expense = require('../src/models/Expense');

let mongod;

// Helper: sign a JWT for a test user
function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
}

// Helper: create a user directly (no real bcrypt needed in tests)
async function createUser(name, email) {
  return User.create({ name, email, passwordHash: 'dummy' });
}

// Helper: create a group with the given member ids
async function createGroup(name, memberIds, createdById) {
  return Group.create({ name, members: memberIds, createdBy: createdById });
}

// Wipe all collections between tests so each test is fully isolated
async function cleanup() {
  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Expense.deleteMany({}),
    mongoose.connection.collection('settlements').deleteMany({}),
  ]);
}

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('non-member gets 403 when posting an expense', async () => {
  await cleanup();

  const alice = await createUser('Alice', 'alice@test.com');
  const bob = await createUser('Bob', 'bob@test.com');
  // Group has only alice as a member
  const group = await createGroup('Alice Group', [alice._id], alice._id);

  const bobToken = signToken(bob);

  const res = await supertest(app)
    .post(`/api/groups/${group._id}/expenses`)
    .set('Authorization', `Bearer ${bobToken}`)
    .send({ description: 'Dinner', amount: 500, paidBy: String(bob._id), splitType: 'equal' });

  assert.equal(res.status, 403);
});

test('custom split mismatch returns 400', async () => {
  await cleanup();

  const alice = await createUser('Alice', 'alice@test.com');
  const group = await createGroup('Alice Group', [alice._id], alice._id);
  const token = signToken(alice);

  // splits sum to 600 but expense amount is 1000 — should fail
  const res = await supertest(app)
    .post(`/api/groups/${group._id}/expenses`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      description: 'Hotel',
      amount: 1000,
      paidBy: String(alice._id),
      splitType: 'custom',
      splits: [{ user: String(alice._id), amount: 600 }],
    });

  assert.equal(res.status, 400);
  assert.ok(
    res.body.message,
    'Expected an error message in the response body'
  );
});

test('equal split of 1000 paise among 3 members sums to exactly 1000', async () => {
  await cleanup();

  const alice = await createUser('Alice', 'alice@test.com');
  const bob = await createUser('Bob', 'bob@test.com');
  const charlie = await createUser('Charlie', 'charlie@test.com');
  const group = await createGroup('Trip', [alice._id, bob._id, charlie._id], alice._id);
  const token = signToken(alice);

  // No participants array — all 3 members split equally
  const res = await supertest(app)
    .post(`/api/groups/${group._id}/expenses`)
    .set('Authorization', `Bearer ${token}`)
    .send({ description: 'Dinner', amount: 1000, paidBy: String(alice._id), splitType: 'equal' });

  assert.equal(res.status, 201);

  // Fetch the stored expense directly to inspect splits
  const saved = await Expense.findById(res.body.expense._id).lean();
  assert.ok(saved, 'Expense should be saved to the database');
  assert.equal(saved.splits.length, 3, 'Should have exactly 3 split entries');

  const total = saved.splits.reduce((sum, s) => sum + s.amount, 0);
  assert.equal(total, 1000, `Splits must sum to 1000 paise, got ${total}`);
});

test('settlement reduces the payer balance', async () => {
  await cleanup();

  const alice = await createUser('Alice', 'alice@test.com');
  const bob = await createUser('Bob', 'bob@test.com');
  const group = await createGroup('Duo', [alice._id, bob._id], alice._id);

  const aliceToken = signToken(alice);
  const bobToken = signToken(bob);

  // Alice pays 1000 paise; only bob is a participant (bob owes alice 1000)
  const expRes = await supertest(app)
    .post(`/api/groups/${group._id}/expenses`)
    .set('Authorization', `Bearer ${aliceToken}`)
    .send({
      description: 'Groceries',
      amount: 1000,
      paidBy: String(alice._id),
      splitType: 'equal',
      participants: [String(bob._id)],
    });
  assert.equal(expRes.status, 201);

  // Get initial balances — alice should be owed 1000 (net +1000)
  const before = await supertest(app)
    .get(`/api/groups/${group._id}/balances`)
    .set('Authorization', `Bearer ${aliceToken}`);
  assert.equal(before.status, 200);

  const aliceBefore = before.body.balances.find((b) => String(b.user.id) === String(alice._id));
  assert.ok(aliceBefore, 'Alice should appear in balances');
  assert.equal(aliceBefore.net, 1000, `Alice should be owed 1000 before settlement, got ${aliceBefore.net}`);

  // Bob settles 500 paise to alice
  const settleRes = await supertest(app)
    .post(`/api/groups/${group._id}/settlements`)
    .set('Authorization', `Bearer ${bobToken}`)
    .send({ from: String(bob._id), to: String(alice._id), amount: 500 });
  assert.equal(settleRes.status, 201);

  // Get balances after settlement — alice's net should drop to 500
  const after = await supertest(app)
    .get(`/api/groups/${group._id}/balances`)
    .set('Authorization', `Bearer ${aliceToken}`);
  assert.equal(after.status, 200);

  const aliceAfter = after.body.balances.find((b) => String(b.user.id) === String(alice._id));
  assert.ok(aliceAfter, 'Alice should still appear in balances after settlement');
  assert.equal(aliceAfter.net, 500, `Alice's net should be 500 after partial settlement, got ${aliceAfter.net}`);
});
