const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const { HttpError } = require('../middleware/error');
const { getGroupForMember } = require('./groupController');
const { computeBalances, simplifyDebts } = require('../utils/balances');
const { buildUpiLink } = require('../utils/upi');

exports.getBalances = async (req, res) => {
  const group = await getGroupForMember(req.params.groupId, req.userId);
  const [expenses, settlements] = await Promise.all([
    Expense.find({ group: group._id }).lean(),
    Settlement.find({ group: group._id }).lean(),
  ]);

  const net = computeBalances(expenses, settlements);
  const members = Object.fromEntries(group.members.map((m) => [String(m._id), m]));
  const label = (id) => ({ id, name: members[id]?.name, upiId: members[id]?.upiId });

  res.json({
    balances: group.members.map((m) => ({ user: label(String(m._id)), net: net[String(m._id)] || 0 })),
    suggestedPayments: simplifyDebts(net).map((p) => ({
      from: label(p.from),
      to: label(p.to),
      amount: p.amount,
      upiLink: buildUpiLink({
        upiId: members[p.to]?.upiId,
        name: members[p.to]?.name,
        amountPaise: p.amount,
        note: `SplitEase: ${group.name}`,
      }),
    })),
  });
};

exports.settle = async (req, res) => {
  const group = await getGroupForMember(req.params.groupId, req.userId);
  const { to, amount } = req.body;
  const from = req.body.from || req.userId;
  const ids = group.members.map((m) => String(m._id));
  if (!ids.includes(String(from)) || !ids.includes(String(to))) throw new HttpError(400, 'Both users must be group members');
  if (String(from) === String(to)) throw new HttpError(400, 'Cannot settle with yourself');
  if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'Amount must be a positive integer (paise)');

  const settlement = await Settlement.create({ group: group._id, from, to, amount });
  res.status(201).json({ settlement });
};
