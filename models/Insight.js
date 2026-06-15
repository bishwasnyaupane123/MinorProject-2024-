// models/Insight.js
const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['spending', 'saving', 'budget']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'danger']
  },
  action: {
    type: String,
    required: true
  },
  period: {
    type: String,
    required: true,
    enum: ['week', 'month', 'quarter', 'year']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Insight', insightSchema);