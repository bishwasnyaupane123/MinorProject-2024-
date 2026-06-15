const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

// Get all goals
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.userId });
        res.json(goals);
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create a goal
router.post('/', auth, async (req, res) => {
    try {
        const { 
            name, 
            category,
            targetAmount, 
            currentAmount, 
            deadline, 
            priority,
            notes 
        } = req.body;

        const goal = new Goal({
            user: req.user.userId,
            name,
            category,
            targetAmount,
            currentAmount,
            deadline,
            priority,
            notes
        });

        await goal.save();
        res.status(201).json(goal);
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add contribution to a goal
router.post('/:id/contributions', auth, async (req, res) => {
    try {
        const { amount, date } = req.body;
        
        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Check if adding this contribution would exceed the target amount
        const newTotal = goal.currentAmount + Number(amount);
        if (newTotal > goal.targetAmount) {
            return res.status(400).json({ 
                message: `The maximum contribution allowed is Rs ${(goal.targetAmount - goal.currentAmount).toLocaleString()}`
            });
        }

        // Add the contribution
        goal.contributions.push({ amount, date });
        goal.currentAmount = newTotal;

        // Check if goal is completed
        if (newTotal >= goal.targetAmount) {
            goal.status = 'completed';
        }

        await goal.save();
        res.json(goal);
    } catch (error) {
        console.error('Add contribution error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single goal
router.get('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        console.error('Get goal error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update goal
router.put('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json({ message: 'Goal removed' });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;