const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const goalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {        // Added category field
        type: String,
        required: true,
        enum: ['savings', 'investment', 'debt_payment', 'purchase', 'education', 'other']
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    deadline: {
        type: Date,
        required: true
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
    },
    status: {
        type: String,
        required: true,
        enum: ['in_progress', 'completed', 'cancelled'],
        default: 'in_progress'
    },
    notes: {
        type: String,
        trim: true
    },
    contributions: [contributionSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Goal', goalSchema);