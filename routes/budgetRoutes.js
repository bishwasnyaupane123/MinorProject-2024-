const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Budget = require("../models/Budget");
const TotalBudget = require("../models/TotalBudget");

// Get all budgets (including total budget)
router.get("/", auth, async (req, res) => {
  try {
    const totalBudget = await TotalBudget.findOne({ user: req.user.userId });
    const budgets = await Budget.find({ user: req.user.userId });
    res.json({
      totalBudget: totalBudget?.totalBudget || 0,
      categories: budgets
    });
  } catch (error) {
    console.error("Get budgets error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Set total budget
router.post("/", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    let totalBudget = await TotalBudget.findOne({ user: req.user.userId });
    
    if (totalBudget) {
      // If budget is increasing, proportionally increase category allocations
      const budgetIncrease = amount - totalBudget.totalBudget;
      if (budgetIncrease > 0) {
        const categories = await Budget.find({ user: req.user.userId });
        for (const category of categories) {
          // Calculate proportion of current allocation
          const proportion = category.amount / totalBudget.totalBudget;
          // Increase category allocation by the same proportion of the increase
          category.amount += budgetIncrease * proportion;
          await category.save();
        }
      }
      
      totalBudget.totalBudget = amount;
      await totalBudget.save();
    } else {
      totalBudget = new TotalBudget({
        user: req.user.userId,
        totalBudget: amount
      });
      await totalBudget.save();
    }

    res.json({
      totalBudget: totalBudget.totalBudget
    });
  } catch (error) {
    console.error("Set total budget error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all categories
router.get("/categories", auth, async (req, res) => {
  try {
    // First check if total budget exists
    const totalBudget = await TotalBudget.findOne({ user: req.user.userId });
    if (!totalBudget || totalBudget.totalBudget <= 0) {
      return res.status(400).json({ 
        message: "Please set a total budget first",
        code: "NO_TOTAL_BUDGET"
      });
    }

    const budgets = await Budget.find({ user: req.user.userId });
    const categories = budgets.map(budget => ({
      _id: budget._id,
      name: budget.category,
      allocation: budget.amount,
      spent: budget.spent,
      expenses: budget.expenses
    }));
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add new category
router.post("/categories", auth, async (req, res) => {
  try {
    const { name, allocation } = req.body;

    // Check if category already exists for this user
    const existingCategory = await Budget.findOne({
      user: req.user.userId,
      category: name
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // Check total budget
    const totalBudget = await TotalBudget.findOne({ user: req.user.userId });
    if (!totalBudget) {
      return res.status(400).json({ message: "Please set total budget first" });
    }

    // Get sum of all category allocations
    const budgets = await Budget.find({ user: req.user.userId });
    const currentTotalAllocation = budgets.reduce((sum, budget) => sum + budget.amount, 0);

    // Check if new allocation would exceed total budget
    if (currentTotalAllocation + allocation > totalBudget.totalBudget) {
      return res.status(400).json({ 
        message: "Category allocation would exceed total budget",
        remainingBudget: totalBudget.totalBudget - currentTotalAllocation
      });
    }

    const budget = new Budget({
      user: req.user.userId,
      category: name,
      amount: allocation,
      period: 'monthly',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });

    await budget.save();
    
    // Return updated categories list
    const updatedBudgets = await Budget.find({ user: req.user.userId });
    const categories = updatedBudgets.map(budget => ({
      _id: budget._id,
      name: budget.category,
      allocation: budget.amount,
      spent: budget.spent,
      expenses: budget.expenses
    }));
    res.status(201).json(categories);
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add expense to category
router.post("/categories/:id/expenses", auth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({ message: "Category not found" });
    }

    budget.expenses.push({ amount, description });
    budget.spent = budget.expenses.reduce((total, exp) => total + exp.amount, 0);
    await budget.save();

    // Return updated categories list
    const budgets = await Budget.find({ user: req.user.userId });
    const categories = budgets.map(budget => ({
      _id: budget._id,
      name: budget.category,
      allocation: budget.amount,
      spent: budget.spent,
      expenses: budget.expenses
    }));
    res.json(categories);
  } catch (error) {
    console.error("Add expense error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete category
router.delete("/categories/:id", auth, async (req, res) => {
  try {
    await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    // Return updated categories list
    const budgets = await Budget.find({ user: req.user.userId });
    const categories = budgets.map(budget => ({
      _id: budget._id,
      name: budget.category,
      allocation: budget.amount,
      spent: budget.spent,
      expenses: budget.expenses
    }));
    res.json(categories);
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create a budget
router.post("/", auth, async (req, res) => {
  try {
    const { category, amount, period, startDate, endDate } = req.body;

    const budget = new Budget({
      user: req.user.userId,
      category,
      amount,
      period,
      startDate,
      endDate
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error("Create budget error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single budget
router.get("/:id", auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json(budget);
  } catch (error) {
    console.error("Get budget error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update budget
router.put("/:id", auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: req.body },
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json(budget);
  } catch (error) {
    console.error("Update budget error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete budget
router.delete("/:id", auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ message: "Budget removed" });
  } catch (error) {
    console.error("Delete budget error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
