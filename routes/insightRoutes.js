const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Bill = require('../models/Bill');
const Debt = require('../models/Debt');
const Goal = require('../models/Goal');
const Budget = require('../models/Budget');
const Insight = require('../models/Insight');

// Get financial data for AI insights
router.get('/', auth, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const today = new Date();
        let startDate;

        // Calculate start date based on period
        switch (period) {
            case 'week':
                startDate = new Date(today.setDate(today.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(today.setMonth(today.getMonth() - 6)); // Get last 6 months of data
                break;
            case 'quarter':
                startDate = new Date(today.setMonth(today.getMonth() - 3));
                break;
            case 'year':
                startDate = new Date(today.setFullYear(today.getFullYear() - 1));
                break;
            default:
                startDate = new Date(today.setMonth(today.getMonth() - 6));
        }

        // Get all financial data within the period
        const bills = await Bill.find({
            user: req.user.userId,
            dueDate: { $gte: startDate }
        });
        const budgets = await Budget.find({
            user: req.user.userId,
            startDate: { $lte: today },
            endDate: { $gte: startDate }
        });

        // Initialize arrays for monthly data
        const months = [];
        const monthlyIncome = [];
        const monthlyExpenses = [];

        // Generate array of months
        let currentDate = new Date(startDate);
        while (currentDate <= today) {
            months.push(currentDate.toLocaleString('default', { month: 'short', year: 'numeric' }));
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // Calculate monthly income from budgets
        months.forEach((month, index) => {
            const monthIncome = budgets.reduce((sum, budget) => {
                if (budget.income) {
                    return sum + budget.income;
                }
                return sum;
            }, 0);
            monthlyIncome.push(monthIncome);
        });

        // Calculate monthly expenses from bills
        months.forEach((month, index) => {
            const [monthStr, yearStr] = month.split(' ');
            const monthExpenses = bills.reduce((sum, bill) => {
                const billDate = new Date(bill.dueDate);
                if (
                    billDate.toLocaleString('default', { month: 'short' }) === monthStr &&
                    billDate.getFullYear().toString() === yearStr
                ) {
                    return sum + bill.amount;
                }
                return sum;
            }, 0);
            monthlyExpenses.push(monthExpenses);
        });

        // Calculate savings
        const savings = monthlyIncome.map((inc, idx) => inc - monthlyExpenses[idx]);

        // Group expenses by category
        const categories = bills.reduce((acc, bill) => {
            acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
            return acc;
        }, {});

        res.json({
            labels: months,
            income: monthlyIncome,
            expenses: monthlyExpenses,
            savings,
            categories
        });
    } catch (error) {
        console.error('Get financial data error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get AI-generated recommendations
router.get('/recommendations', auth, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const bills = await Bill.find({ user: req.user.userId });
        const budgets = await Budget.find({ user: req.user.userId });
        const debts = await Debt.find({ user: req.user.userId });

        // Calculate spending patterns
        const totalExpenses = bills.reduce((sum, bill) => sum + bill.amount, 0);
        const expensesByCategory = bills.reduce((acc, bill) => {
            acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
            return acc;
        }, {});

        // Generate savings recommendations
        const savingsRecommendations = [];
        
        // Check high-expense categories
        const categories = Object.entries(expensesByCategory);
        categories.sort((a, b) => b[1] - a[1]);
        
        if (categories.length > 0) {
            const [highestCategory, amount] = categories[0];
            if (amount > totalExpenses * 0.3) { // If category takes up more than 30% of expenses
                savingsRecommendations.push({
                    type: 'reduce_expenses',
                    category: highestCategory,
                    message: `Consider reducing spending in ${highestCategory} category as it represents ${Math.round(amount/totalExpenses*100)}% of your expenses`
                });
            }
        }

        // Check for debt optimization
        const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
        if (totalDebt > 0) {
            const highInterestDebts = debts.filter(debt => debt.interestRate > 15);
            if (highInterestDebts.length > 0) {
                savingsRecommendations.push({
                    type: 'debt_management',
                    message: 'Consider prioritizing payment of high-interest debts to reduce interest expenses'
                });
            }
        }

        // Generate expense recommendations
        const expenseRecommendations = [];

        // Check for recurring bills
        const recurringBills = bills.filter(bill => bill.recurring);
        if (recurringBills.length > 0) {
            expenseRecommendations.push({
                type: 'subscription_review',
                message: 'Review your recurring bills and subscriptions to identify potential savings'
            });
        }

        // Check budget adherence
        const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
        if (totalExpenses > totalBudget) {
            expenseRecommendations.push({
                type: 'budget_adherence',
                message: 'Your expenses exceed your budget. Consider reviewing your spending habits.'
            });
        }

        res.json({
            savings: savingsRecommendations,
            expenses: expenseRecommendations
        });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get insights
router.get('/insights', auth, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const insights = [];

        // Get financial data
        const bills = await Bill.find({ user: req.user.userId });
        const budgets = await Budget.find({ user: req.user.userId });
        const debts = await Debt.find({ user: req.user.userId });

        // Calculate key metrics
        const totalExpenses = bills.reduce((sum, bill) => sum + bill.amount, 0);
        const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
        const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);

        // Generate spending insights
        if (totalExpenses > totalBudget) {
            insights.push({
                id: 'overspending',
                type: 'spending',
                title: 'Overspending Alert',
                description: `You've exceeded your budget by Rs ${(totalExpenses - totalBudget).toFixed(2)}`,
                severity: 'warning',
                action: 'Review your expenses and identify areas to cut back'
            });
        }

        // Generate debt insights
        if (totalDebt > 0) {
            const highInterestDebts = debts.filter(debt => debt.interestRate > 15);
            if (highInterestDebts.length > 0) {
                insights.push({
                    id: 'high_interest',
                    type: 'debt',
                    title: 'High Interest Debt Alert',
                    description: 'You have debts with high interest rates that need attention',
                    severity: 'warning',
                    action: 'Consider prioritizing payment of high-interest debts or exploring refinancing options'
                });
            }
        }

        // Generate savings insights
        const monthlyIncome = budgets.reduce((sum, budget) => sum + (budget.income || 0), 0);
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalExpenses) / monthlyIncome) * 100 : 0;
        
        if (savingsRate < 20) {
            insights.push({
                id: 'low_savings',
                type: 'saving',
                title: 'Low Savings Rate',
                description: `Your current savings rate is ${savingsRate.toFixed(1)}%`,
                severity: 'info',
                action: 'Try to save at least 20% of your income for long-term financial health'
            });
        }

        // Generate budget insights
        const unpaidBills = bills.filter(bill => !bill.paid && new Date(bill.dueDate) < new Date());
        if (unpaidBills.length > 0) {
            insights.push({
                id: 'unpaid_bills',
                type: 'budget',
                title: 'Unpaid Bills',
                description: `You have ${unpaidBills.length} overdue bills`,
                severity: 'danger',
                action: 'Review and pay your overdue bills to avoid late fees'
            });
        }

        res.json(insights);
    } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Overview (Summary of all financial data)
router.get('/overview', auth, async (req, res) => {
    try {
        // Get all user's data
        const bills = await Bill.find({ user: req.user.userId });
        const debts = await Debt.find({ user: req.user.userId });
        const goals = await Goal.find({ user: req.user.userId });
        const budgets = await Budget.find({ user: req.user.userId });

        // Calculate totals
        const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
        const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);
        const totalGoals = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
        const totalBudgets = budgets.reduce((sum, budget) => sum + budget.amount, 0);

        res.json({
            summary: {
                totalBills,
                totalDebts,
                totalGoals,
                totalBudgets
            },
            counts: {
                bills: bills.length,
                debts: debts.length,
                goals: goals.length,
                budgets: budgets.length
            }
        });
    } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Bill Analysis
router.get('/bills-analysis', auth, async (req, res) => {
    try {
        const bills = await Bill.find({ user: req.user.userId });

        // Group bills by category
        const billsByCategory = bills.reduce((acc, bill) => {
            acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
            return acc;
        }, {});

        // Get upcoming bills (due in next 30 days)
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));
        const upcomingBills = bills.filter(bill => 
            new Date(bill.dueDate) <= thirtyDaysFromNow && 
            bill.status !== 'paid'
        );

        res.json({
            billsByCategory,
            upcomingBills,
            totalBills: bills.reduce((sum, bill) => sum + bill.amount, 0)
        });
    } catch (error) {
        console.error('Bills analysis error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Debt Analysis
router.get('/debt-analysis', auth, async (req, res) => {
    try {
        const debts = await Debt.find({ user: req.user.userId });

        // Calculate total debt and interest payments
        const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
        const monthlyInterest = debts.reduce((sum, debt) => 
            sum + (debt.amount * (debt.interestRate / 100) / 12), 0
        );

        // Group debts by type
        const debtsByType = debts.reduce((acc, debt) => {
            acc[debt.type] = (acc[debt.type] || 0) + debt.amount;
            return acc;
        }, {});

        res.json({
            totalDebt,
            monthlyInterest,
            debtsByType,
            debtCount: debts.length
        });
    } catch (error) {
        console.error('Debt analysis error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Goals Progress
router.get('/goals-progress', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.userId });

        const goalsProgress = goals.map(goal => ({
            name: goal.name,
            progress: (goal.currentAmount / goal.targetAmount) * 100,
            remaining: goal.targetAmount - goal.currentAmount,
            deadline: goal.deadline
        }));

        res.json({
            goalsProgress,
            totalGoals: goals.length,
            completedGoals: goals.filter(goal => goal.status === 'completed').length
        });
    } catch (error) {
        console.error('Goals progress error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Budget vs Actual
router.get('/budget-analysis', auth, async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user.userId });
        const bills = await Bill.find({ user: req.user.userId });

        // Group budgets by category
        const budgetsByCategory = budgets.reduce((acc, budget) => {
            acc[budget.category] = (acc[budget.category] || 0) + budget.amount;
            return acc;
        }, {});

        // Group actual spending (bills) by category
        const actualByCategory = bills.reduce((acc, bill) => {
            acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
            return acc;
        }, {});

        res.json({
            budgetsByCategory,
            actualByCategory,
            totalBudgeted: budgets.reduce((sum, budget) => sum + budget.amount, 0),
            totalSpent: bills.reduce((sum, bill) => sum + bill.amount, 0)
        });
    } catch (error) {
        console.error('Budget analysis error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create new insight
router.post('/', auth, async (req, res) => {
    try {
        const { type, title, description, severity, action, period } = req.body;
        
        const insight = new Insight({
            user: req.user.userId,
            type,
            title,
            description,
            severity,
            action,
            period
        });

        const savedInsight = await insight.save();
        res.status(201).json(savedInsight);
    } catch (error) {
        console.error('Create insight error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;