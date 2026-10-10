const Group = require('../models/Group');
const User = require('../models/User');
const { HttpError } = require('../middleware/error');

// Loads a group and ensures the requester is a member.
async function getGroupForMember(groupId, userId) {
  const group = await Group.findById(groupId).populate('members', 'name email upiId');
  if (!group) throw new HttpError(404, 'Group not found');
  if (!group.members.some((m) => String(m._id) === String(userId))) {
    throw new HttpError(403, 'You are not a member of this group');
  }
  return group;
}

exports.getGroupForMember = getGroupForMember;

exports.create = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) throw new HttpError(400, 'Group name is required');
  const group = await Group.create({ name, members: [req.userId], createdBy: req.userId });
  res.status(201).json({ group });
};

exports.list = async (req, res) => {
  const groups = await Group.find({ members: req.userId }).populate('members', 'name email').sort('-createdAt');
  res.json({ groups });
};

exports.get = async (req, res) => {
  res.json({ group: await getGroupForMember(req.params.groupId, req.userId) });
};

exports.addMember = async (req, res) => {
  const group = await getGroupForMember(req.params.groupId, req.userId);
  const email = (req.body.email || '').toLowerCase().trim();
  if (!email) throw new HttpError(400, 'Email is required');
  const user = await User.findOne({ email });
  if (!user) throw new HttpError(404, 'No user with that email. Ask them to sign up first.');
  if (group.members.some((m) => String(m._id) === String(user._id))) {
    throw new HttpError(409, 'Already a member');
  }
  group.members.push(user._id);
  await group.save();
  res.json({ group: await getGroupForMember(group._id, req.userId) });
};
