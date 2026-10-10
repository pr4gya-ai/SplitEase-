// Net balance per user in paise. Positive = is owed money, negative = owes money.
function computeBalances(expenses, settlements) {
  const net = {};
  const add = (id, v) => {
    const k = String(id);
    net[k] = (net[k] || 0) + v;
  };

  for (const e of expenses) {
    add(e.paidBy, e.amount);
    for (const s of e.splits) add(s.user, -s.amount);
  }
  // A settlement is a payment from -> to: payer's debt shrinks, receiver's credit shrinks.
  for (const s of settlements) {
    add(s.from, s.amount);
    add(s.to, -s.amount);
  }
  return net;
}

// Greedy debt simplification: repeatedly match the largest debtor with the
// largest creditor. Produces at most (n - 1) payments.
function simplifyDebts(net) {
  const creditors = [];
  const debtors = [];
  for (const [user, bal] of Object.entries(net)) {
    if (bal > 0) creditors.push({ user, amt: bal });
    else if (bal < 0) debtors.push({ user, amt: -bal });
  }

  const payments = [];
  while (creditors.length && debtors.length) {
    creditors.sort((a, b) => b.amt - a.amt);
    debtors.sort((a, b) => b.amt - a.amt);
    const c = creditors[0];
    const d = debtors[0];
    const pay = Math.min(c.amt, d.amt);
    payments.push({ from: d.user, to: c.user, amount: pay });
    c.amt -= pay;
    d.amt -= pay;
    if (c.amt === 0) creditors.shift();
    if (d.amt === 0) debtors.shift();
  }
  return payments;
}

module.exports = { computeBalances, simplifyDebts };
