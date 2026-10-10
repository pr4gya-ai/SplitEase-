const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // payer
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // receiver
    amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settlement', settlementSchema);
