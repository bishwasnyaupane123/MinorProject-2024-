const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true
    }
}, { timestamps: true });

const debtSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    remainingAmount: {
        type: Number,
        required: true,
        min: 0
    },
    interestRate: {
        type: Number,
        required: true,
        min: 0
    },
    frequency: {
        type: String,
        required: true,
        enum: ['monthly', 'quarterly', 'semi_annually', 'annually'],
        default: 'monthly'
    },
    dueDate: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['credit_card', 'personal_loan', 'car_loan', 'mortgage', 'student_loan', 'other']
    },
    payments: [paymentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Set initial remaining amount when creating a new debt
debtSchema.pre('save', function(next) {
    if (this.isNew) {
        this.remainingAmount = this.amount;
    }
    next();
});

module.exports = mongoose.model('Debt', debtSchema);