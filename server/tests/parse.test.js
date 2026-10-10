const test = require('node:test');
const assert = require('node:assert/strict');
const { parseWithRules, resolveDraft } = require('../src/utils/parseExpense');
const { buildUpiLink } = require('../src/utils/upi');

const members = [
  { _id: 'u1', name: 'Pragya Singh' },
  { _id: 'u2', name: 'Rahul Verma' },
  { _id: 'u3', name: 'Aman Gupta' },
  { _id: 'u4', name: 'Neha Rao' },
];

test('rules: "dinner 1200 split with Rahul and Aman"', () => {
  const raw = parseWithRules('dinner 1200 split with Rahul and Aman', members);
  assert.equal(raw.amountRupees, 1200);
  assert.deepEqual(raw.participants.sort(), ['Aman Gupta', 'Rahul Verma']);
  assert.equal(raw.payer, null);
  const { draft } = resolveDraft(raw, members, 'u1');
  assert.equal(draft.amount, 120000);
  assert.equal(draft.paidBy, 'u1');
  assert.deepEqual(draft.participants.sort(), ['u1', 'u2', 'u3']); // payer included
});

test('rules: payer and ₹ with commas', () => {
  const raw = parseWithRules('Rahul paid ₹1,250.50 for cabs', members);
  assert.equal(raw.amountRupees, 1250.5);
  assert.equal(raw.payer, 'Rahul Verma');
  assert.equal(raw.participants, null);
  assert.equal(resolveDraft(raw, members, 'u1').draft.amount, 125050);
});

test('resolve: unknown names are reported, bad amounts rejected', () => {
  const r = resolveDraft({ description: 'x', amountRupees: 300, participants: ['Rahul', 'Zed'] }, members, 'u1');
  assert.deepEqual(r.unmatched, ['Zed']);
  assert.ok(resolveDraft({ description: 'x', amountRupees: 'abc' }, members, 'u1').error);
  assert.ok(resolveDraft({ description: 'x', amountRupees: -5 }, members, 'u1').error);
});

test('upi link format', () => {
  const link = buildUpiLink({ upiId: 'aman@okhdfc', name: 'Aman Gupta', amountPaise: 30050, note: 'Goa Trip' });
  assert.equal(link, 'upi://pay?pa=aman@okhdfc&pn=Aman%20Gupta&am=300.50&cu=INR&tn=Goa%20Trip');
  assert.equal(buildUpiLink({ upiId: '', amountPaise: 100 }), null);
});
