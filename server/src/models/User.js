const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    upiId: { type: String, trim: true }, // used for UPI settle-up links
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
