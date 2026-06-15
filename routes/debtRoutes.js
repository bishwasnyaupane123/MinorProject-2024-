const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Debt = require('../models/Debt');

// Helper function to validate and parse decimal number
const parseDecimal = (value, isInterestRate = false) => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return isInterestRate ? num : Number(num.toFixed(2));
};

// Get all debts
router.get('/', auth, async (req, res) => {
    try {
        const debts = await Debt.find({ user: req.user.userId });
        res.json(debts);
    } catch (error) {
        console.error('Get debts error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create a debt
router.post('/', auth, async (req, res) => {
    try {
        const { name, amount, interestRate, frequency, dueDate, type } = req.body;

        // Validate numeric fields
        const parsedAmount = parseDecimal(amount);
        const parsedInterestRate = parseDecimal(interestRate, true);

        if (parsedAmount === null || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount value' });
        }
        if (parsedInterestRate === null || parsedInterestRate < 0) {
            return res.status(400).json({ message: 'Invalid interest rate value' });
        }

        const debt = new Debt({
            user: req.user.userId,
            name,
            amount: parsedAmount,
            remainingAmount: parsedAmount,
            interestRate: parsedInterestRate,
            frequency,
            dueDate,
            type,
            payments: []
        });

        await debt.save();
        res.status(201).json(debt);
    } catch (error) {
        console.error('Create debt error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add payment to debt
router.post('/:id/payments', auth, async (req, res) => {
    try {
        const { amount, date } = req.body;
        
        // Validate amount
        const parsedAmount = parseDecimal(amount);
        if (parsedAmount === null || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid payment amount' });
        }

        // Validate date
        const paymentDate = new Date(date);
        if (isNaN(paymentDate.getTime())) {
            return res.status(400).json({ message: 'Invalid payment date' });
        }

        const debt = await Debt.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!debt) {
            return res.status(404).json({ message: 'Debt not found' });
        }

        // Validate payment amount against remaining amount
        if (parsedAmount > debt.remainingAmount) {
            return res.status(400).json({ 
                message: `Payment amount (${parsedAmount}) cannot exceed remaining debt amount (${debt.remainingAmount})` 
            });
        }

        // Add payment and update remaining amount
        debt.payments.push({ amount: parsedAmount, date: paymentDate });
        debt.remainingAmount = parseDecimal(debt.remainingAmount - parsedAmount);
        await debt.save();

        res.json(debt);
    } catch (error) {
        console.error('Add payment error:', error);
        res.status(500).json({ 
            message: 'Failed to add payment', 
            error: error.message 
        });
    }
});

// Get single debt
router.get('/:id', auth, async (req, res) => {
    try {
        const debt = await Debt.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!debt) {
            return res.status(404).json({ message: 'Debt not found' });
        }

        res.json(debt);
    } catch (error) {
        console.error('Get debt error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update debt
router.put('/:id', auth, async (req, res) => {
    try {
        const updates = { ...req.body };
        
        // If numeric fields are being updated, validate them
        if (updates.amount !== undefined) {
            const parsedAmount = parseDecimal(updates.amount);
            if (parsedAmount === null || parsedAmount <= 0) {
                return res.status(400).json({ message: 'Invalid amount value' });
            }
            updates.amount = parsedAmount;
        }
        if (updates.interestRate !== undefined) {
            const parsedRate = parseDecimal(updates.interestRate, true);
            if (parsedRate === null || parsedRate < 0) {
                return res.status(400).json({ message: 'Invalid interest rate value' });
            }
            updates.interestRate = parsedRate;
        }
        if (updates.minimumPayment !== undefined) {
            const parsedMinPayment = parseDecimal(updates.minimumPayment);
            if (parsedMinPayment === null || parsedMinPayment < 0) {
                return res.status(400).json({ message: 'Invalid minimum payment value' });
            }
            updates.minimumPayment = parsedMinPayment;
        }

        // If amount is being updated, adjust remaining amount proportionally
        if (updates.amount !== undefined) {
            const debt = await Debt.findOne({
                _id: req.params.id,
                user: req.user.userId
            });
            
            if (debt) {
                const ratio = updates.amount / debt.amount;
                updates.remainingAmount = parseDecimal(debt.remainingAmount * ratio);
            }
        }

        const debt = await Debt.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            { $set: updates },
            { new: true }
        );

        if (!debt) {
            return res.status(404).json({ message: 'Debt not found' });
        }

        res.json(debt);
    } catch (error) {
        console.error('Update debt error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete debt
router.delete('/:id', auth, async (req, res) => {
    try {
        const debt = await Debt.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!debt) {
            return res.status(404).json({ message: 'Debt not found' });
        }

        res.json({ message: 'Debt removed' });
    } catch (error) {
        console.error('Delete debt error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;