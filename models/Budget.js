const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const incomeSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  recurring: {
    type: Boolean,
    default: false
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  }
});

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  income: {
    type: Number,
    default: 0,
    min: 0
  },
  budgetPercentage: {
    type: Number,
    default: 60, // Default budget is 60% of salary
    min: 0,
    max: 100
  },
  extraBudgetIncrement: {
    type: Number,
    default: 10, // 10% increment when budget is finished
    min: 0,
    max: 100
  },
  incomeHistory: [incomeSchema],
  expenses: [expenseSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
budgetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to calculate budget based on salary
budgetSchema.methods.calculateBudgetFromSalary = async function(salary) {
  this.amount = (salary * this.budgetPercentage) / 100;
  await this.save();
};

// Method to increase budget when finished
budgetSchema.methods.increaseBudgetWhenFinished = async function() {
  if (this.spent >= this.amount) {
    const increment = (this.amount * this.extraBudgetIncrement) / 100;
    this.amount += increment;
    await this.save();
    return true;
  }
  return false;
};

module.exports = mongoose.model('Budget', budgetSchema);