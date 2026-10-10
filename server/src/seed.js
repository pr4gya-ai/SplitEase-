'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');

async function seed() {
  await connectDB();

  // Wipe collections (idempotent)
  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Expense.deleteMany({}),
    Settlement.deleteMany({}),
  ]);

  // ── Users ─────────────────────────────────────────────────────────────────
  const passwordHash = bcrypt.hashSync('password123', 10);

  const [alice, bob, carol, dave] = await User.insertMany([
    { name: 'Alice', email: 'alice@example.com', passwordHash },
    { name: 'Bob',   email: 'bob@example.com',   passwordHash },
    { name: 'Carol', email: 'carol@example.com', passwordHash },
    { name: 'Dave',  email: 'dave@example.com',  passwordHash, upiId: 'dave@upi' },
  ]);

  // ── Group ──────────────────────────────────────────────────────────────────
  const group = await Group.create({
    name: 'Weekend Trip',
    createdBy: alice._id,
    members: [alice._id, bob._id, carol._id, dave._id],
  });

  // ── Expenses ───────────────────────────────────────────────────────────────
  await Expense.insertMany([
    // 1. Restaurant dinner — ₹480, equal split among all 4 → 12000 each
    {
      group: group._id,
      description: 'Restaurant dinner',
      amount: 48000,
      paidBy: alice._id,
      splits: [
        { user: alice._id, amount: 12000 },
        { user: bob._id,   amount: 12000 },
        { user: carol._id, amount: 12000 },
        { user: dave._id,  amount: 12000 },
      ],
      createdBy: alice._id,
    },
    // 2. Taxi to hotel — ₹360, equal split among Bob/Carol/Dave → 12000 each
    {
      group: group._id,
      description: 'Taxi to hotel',
      amount: 36000,
      paidBy: bob._id,
      splits: [
        { user: bob._id,   amount: 12000 },
        { user: carol._id, amount: 12000 },
        { user: dave._id,  amount: 12000 },
      ],
      createdBy: bob._id,
    },
    // 3. Groceries — ₹250, equal split between Bob and Alice → 12500 each
    {
      group: group._id,
      description: 'Groceries',
      amount: 25000,
      paidBy: bob._id,
      splits: [
        { user: bob._id,   amount: 12500 },
        { user: alice._id, amount: 12500 },
      ],
      createdBy: bob._id,
    },
    // 4. Hotel room — ₹1200, custom split: Alice 40000, Bob 30000, Carol 30000, Dave 20000
    {
      group: group._id,
      description: 'Hotel room',
      amount: 120000,
      paidBy: carol._id,
      splits: [
        { user: alice._id, amount: 40000 },
        { user: bob._id,   amount: 30000 },
        { user: carol._id, amount: 30000 },
        { user: dave._id,  amount: 20000 },
      ],
      createdBy: carol._id,
    },
    // 5. Snacks — ₹160, equal split among all 4 → 4000 each
    {
      group: group._id,
      description: 'Snacks',
      amount: 16000,
      paidBy: dave._id,
      splits: [
        { user: alice._id, amount: 4000 },
        { user: bob._id,   amount: 4000 },
        { user: carol._id, amount: 4000 },
        { user: dave._id,  amount: 4000 },
      ],
      createdBy: dave._id,
    },
  ]);

  // ── Settlement ─────────────────────────────────────────────────────────────
  // Dave pays Alice ₹150 (15000 paise) to partially settle his balance
  await Settlement.create({
    group: group._id,
    from: dave._id,
    to: alice._id,
    amount: 15000,
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('=== Seed complete ===');
  console.log('Users: Alice, Bob, Carol, Dave');
  console.log('Group: Weekend Trip (4 members)');
  console.log('Expenses:');
  console.log('  1. Restaurant dinner \u2014 \u20b9480 (equal split, 4 members)');
  console.log('  2. Taxi to hotel \u2014 \u20b9360 (equal split, 3 members)');
  console.log('  3. Groceries \u2014 \u20b9250 (equal split, 2 members)');
  console.log('  4. Hotel room \u2014 \u20b91200 (custom split, 4 members)');
  console.log('  5. Snacks \u2014 \u20b9160 (equal split, 4 members)');
  console.log('Settlement: Dave \u2192 Alice \u20b9150');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
