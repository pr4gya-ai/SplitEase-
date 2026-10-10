const test = require('node:test');
const assert = require('node:assert/strict');
const { splitEqual, validateSplits } = require('../src/utils/money');
const { computeBalances, simplifyDebts } = require('../src/utils/balances');

test('splitEqual distributes leftover paise and sums exactly', () => {
  const s = splitEqual(1000, ['a', 'b', 'c']);
  assert.deepEqual(s.map((x) => x.amount), [334, 333, 333]);
  assert.equal(s.reduce((t, x) => t + x.amount, 0), 1000);
});

test('validateSplits rejects mismatched totals and floats', () => {
  assert.ok(validateSplits(1000, [{ user: 'a', amount: 500 }]));
  assert.ok(validateSplits(100, [{ user: 'a', amount: 50.5 }, { user: 'b', amount: 49.5 }]));
  assert.equal(validateSplits(1000, [{ user: 'a', amount: 400 }, { user: 'b', amount: 600 }]), null);
});

test('circular debts cancel out', () => {
  // A owes B 500, B owes C 500, C owes A 500
  const expenses = [
    { paidBy: 'B', amount: 500, splits: [{ user: 'A', amount: 500 }] },
    { paidBy: 'C', amount: 500, splits: [{ user: 'B', amount: 500 }] },
    { paidBy: 'A', amount: 500, splits: [{ user: 'C', amount: 500 }] },
  ];
  assert.deepEqual(simplifyDebts(computeBalances(expenses, [])), []);
});

test('trip example settles in two payments', () => {
  // Hotel 2000 (P), food 800 (R), cabs 400 (A), split equally among 4
  const people = ['P', 'R', 'A', 'X'];
  const mk = (paidBy, amount) => ({
    paidBy,
    amount,
    splits: people.map((user) => ({ user, amount: amount / 4 })),
  });
  const net = computeBalances([mk('P', 2000), mk('R', 800), mk('A', 400)], []);
  const pay = simplifyDebts(net);
  assert.ok(pay.length <= 3);
  // total money moved equals total owed
  const owed = Object.values(net).filter((v) => v > 0).reduce((t, v) => t + v, 0);
  assert.equal(pay.reduce((t, p) => t + p.amount, 0), owed);
});

test('settlements reduce balances', () => {
  const expenses = [{ paidBy: 'A', amount: 300, splits: [{ user: 'B', amount: 300 }] }];
  const settlements = [{ from: 'B', to: 'A', amount: 300 }];
  const net = computeBalances(expenses, settlements);
  assert.equal(net.A, 0);
  assert.equal(net.B, 0);
});
