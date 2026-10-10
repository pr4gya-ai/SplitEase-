// Split `amount` (integer paise) equally; leftover paise go to the first members.
function splitEqual(amount, userIds) {
  const n = userIds.length;
  if (!n) throw new Error('At least one participant is required');
  const base = Math.floor(amount / n);
  let remainder = amount - base * n;
  return userIds.map((user) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { user, amount: base + extra };
  });
}

// Custom splits must be integer paise and sum exactly to the total.
function validateSplits(amount, splits) {
  if (!Array.isArray(splits) || !splits.length) return 'Splits are required';
  if (!splits.every((s) => Number.isInteger(s.amount) && s.amount >= 0)) {
    return 'Split amounts must be non-negative integers (paise)';
  }
  const sum = splits.reduce((t, s) => t + s.amount, 0);
  return sum === amount ? null : `Splits total ${sum} but expense is ${amount}`;
}

const rupeesToPaise = (r) => Math.round(Number(r) * 100);

module.exports = { splitEqual, validateSplits, rupeesToPaise };
