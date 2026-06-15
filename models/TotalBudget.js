const mongoose = require('mongoose');

const totalBudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    default: 'monthly',
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

totalBudgetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TotalBudget', totalBudgetSchema); 