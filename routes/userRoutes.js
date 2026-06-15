const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const Budget = require('../models/Budget');
const TotalBudget = require('../models/TotalBudget');

// Register User
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Google Authentication
router.post("/google-auth", async (req, res) => {
  try {
    const { email, firstName, lastName, picture } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      const randomPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        profilePicture: picture
      });

      await user.save();
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Server error during Google authentication" });
  }
});

// Get User Profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user's salary
router.post('/update-salary', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid salary amount' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update salary
    user.salary.amount = amount;
    user.salary.lastReset = new Date();
    await user.save();

    // Calculate budget (60% of salary)
    const budgetAmount = amount * 0.6;

    // Update or create TotalBudget
    let totalBudget = await TotalBudget.findOne({ user: req.user.userId });
    if (totalBudget) {
      totalBudget.totalBudget = budgetAmount;
      await totalBudget.save();
    } else {
      totalBudget = new TotalBudget({
        user: req.user.userId,
        totalBudget: budgetAmount
      });
      await totalBudget.save();
    }

    // Get existing categories
    const existingBudgets = await Budget.find({ user: req.user.userId });
    
    if (existingBudgets.length > 0) {
      // If there are existing categories, distribute the new budget proportionally
      const totalAllocation = existingBudgets.reduce((sum, budget) => sum + budget.amount, 0);
      
      for (const budget of existingBudgets) {
        // Calculate the proportion this category previously had
        const proportion = totalAllocation > 0 ? budget.amount / totalAllocation : 1 / existingBudgets.length;
        // Apply that proportion to the new total budget
        budget.amount = budgetAmount * proportion;
        await budget.save();
      }
    }

    res.json({ 
      success: true, 
      message: 'Salary and budgets updated successfully',
      data: {
        salary: user.salary,
        savings: user.savings,
        totalBudget: totalBudget.totalBudget
      }
    });
  } catch (error) {
    console.error('Error updating salary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating salary and budgets' 
    });
  }
});

// Get user's salary and savings info
router.get('/financial-info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get budget information
    const totalBudget = await TotalBudget.findOne({ user: req.user.userId });
    const budgets = await Budget.find({ user: req.user.userId });
    const totalSpent = budgets.reduce((sum, cat) => sum + cat.spent, 0);
    const remainingBudget = totalBudget ? totalBudget.totalBudget - totalSpent : 0;

    // Calculate total savings (existing savings + remaining budget + 40% of monthly income)
    const monthlyIncomeSavings = user.salary.amount * 0.4;
    const totalSavings = user.savings.amount + remainingBudget + monthlyIncomeSavings;

    // Check and reset salary if it's a new month
    await user.checkAndResetSalary();

    res.json({
      success: true,
      data: {
        salary: user.salary,
        savings: {
          ...user.savings,
          amount: totalSavings,
          remainingBudget,
          monthlyIncomeSavings
        }
      }
    });
  } catch (error) {
    console.error('Error getting financial info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving financial information' 
    });
  }
});

module.exports = router;
