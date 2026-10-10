const Expense = require('../models/Expense');
const { HttpError } = require('../middleware/error');
const { getGroupForMember } = require('./groupController');
const { splitEqual, validateSplits } = require('../utils/money');
const { parseExpense } = require('../utils/parseExpense');

exports.create = async (req, res) => {
  const group = await getGroupForMember(req.params.groupId, req.userId);
  const memberIds = group.members.map((m) => String(m._id));
  const { description, amount, paidBy, splitType = 'equal', participants, splits } = req.body;

  if (!description || !description.trim()) throw new HttpError(400, 'Description is required');
  if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'Amount must be a positive integer (paise)');
  const payer = String(paidBy || req.userId);
  if (!memberIds.includes(payer)) throw new HttpError(400, 'Payer must be a group member');

  let finalSplits;
  if (splitType === 'equal') {
    const ids = (participants && participants.length ? participants : memberIds).map(String);
    if (!ids.every((id) => memberIds.includes(id))) throw new HttpError(400, 'All participants must be group members');
    finalSplits = splitEqual(amount, ids);
  } else if (splitType === 'custom') {
    const err = validateSplits(amount, splits);
    if (err) throw new HttpError(400, err);
    if (!splits.every((s) => memberIds.includes(String(s.user)))) throw new HttpError(400, 'All split users must be group members');
    finalSplits = splits.map((s) => ({ user: s.user, amount: s.amount }));
  } else {
    throw new HttpError(400, 'splitType must be "equal" or "custom"');
  }

  const expense = await Expense.create({
    group: group._id,
    description: description.trim(),
    amount,
    paidBy: payer,
    splits: finalSplits,
    createdBy: req.userId,
  });
  res.status(201).json({ expense });
};

exports.list = async (req, res) => {
  const group = await getGroupForMember(req.params.groupId, req.userId);
  const expenses = await Expense.find({ group: group._id })
    .populate('paidBy', 'name')
    .populate('splits.user', 'name')
    .sort('-createdAt');
  res.json({ expenses });
};

exports.remove = async (req, res) => {
  const group = await getGroupForMember(req.params.groupId, req.userId);
  const expense = await Expense.findOne({ _id: req.params.expenseId, group: group._id });
  if (!expense) throw new HttpError(404, 'Expense not found');
  if (String(expense.createdBy) !== String(req.userId)) throw new HttpError(403, 'Only the creator can delete this expense');
  await expense.deleteOne();
  res.json({ message: 'Deleted' });
};

// Returns a DRAFT only. Nothing is saved until the client posts it to create().
exports.parse = async (req, res) => {
  const group = await getGroupForMember(req.params.groupId, req.userId);
  const text = (req.body.text || '').trim();
  if (!text) throw new HttpError(400, 'Text is required');
  if (text.length > 300) throw new HttpError(400, 'Text is too long (max 300 characters)');

  const result = await parseExpense(text, group.members, req.userId);
  if (result.error) throw new HttpError(422, result.error);
  res.json(result);
};
