const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const auth = require("../middleware/auth");
const User = require("../models/User");
const { sendBillReminder } = require("../utils/emailService");

// Create a new bill
router.post("/", auth, async (req, res) => {
  try {
    const { name, amount, dueDate, category, description, recurring, frequency } = req.body;

    // Validate required fields
    if (!name || !amount || !dueDate || !category) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["name", "amount", "dueDate", "category"]
      });
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number"
      });
    }

    // Validate date
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid due date format"
      });
    }

    const bill = new Bill({
      user: req.user.userId,
      name: name.trim(),
      amount: parsedAmount,
      dueDate: parsedDate,
      category: category.trim(),
      description: description?.trim(),
      recurring: !!recurring,
      frequency: recurring ? frequency : 'monthly'
    });

    const savedBill = await bill.save();
    res.status(201).json(savedBill);
  } catch (error) {
    console.error("Bill creation error:", error);
    res.status(500).json({
      message: "Error creating bill",
      error: error.message
    });
  }
});

// Get all bills
router.get("/", auth, async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user.userId }).sort({ dueDate: 1 });
    const user = await User.findById(req.user.userId);
    
    // Debug logging
    console.log('Fetching bills for user:', user.email);
    console.log('Email notifications enabled:', user.settings?.emailNotifications);
    console.log('Number of bills:', bills.length);
    
    // Try to send email notifications, but don't let it break the API response
    if (user && user.settings?.emailNotifications) {
      try {
        console.log('Attempting to send bill reminder email...');
        await sendBillReminder(user.email, bills);
        console.log('Bill reminder email sent successfully');
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        // Continue execution without breaking the API response
      }
    } else {
      console.log('Email notifications are disabled for this user');
    }
    
    res.json(bills);
  } catch (error) {
    console.error("Get bills error:", error);
    res.status(500).json({
      message: "Error fetching bills",
      error: error.message
    });
  }
});

// Get single bill
router.get("/:id", auth, async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    console.error("Get bill error:", error);
    res.status(500).json({
      message: "Error fetching bill",
      error: error.message
    });
  }
});

// Update bill
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, amount, dueDate, category, description, recurring, frequency } = req.body;

    // Validate amount if provided
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          message: "Amount must be a positive number"
        });
      }
      req.body.amount = parsedAmount;
    }

    // Validate date if provided
    if (dueDate !== undefined) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid due date format"
        });
      }
      req.body.dueDate = parsedDate;
    }

    // Trim string fields
    if (name) req.body.name = name.trim();
    if (category) req.body.category = category.trim();
    if (description) req.body.description = description.trim();

    // Handle recurring and frequency
    if (recurring !== undefined) {
      req.body.recurring = !!recurring;
      if (!recurring) {
        req.body.frequency = 'monthly'; // Reset to default if not recurring
      }
    }

    const bill = await Bill.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId
      },
      { 
        $set: req.body,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    console.error("Update bill error:", error);
    res.status(500).json({
      message: "Error updating bill",
      error: error.message
    });
  }
});

// Mark bill as paid
router.put("/:id/pay", auth, async (req, res) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId
      },
      { 
        $set: { 
          paid: true,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    console.error("Mark bill as paid error:", error);
    res.status(500).json({
      message: "Error marking bill as paid",
      error: error.message
    });
  }
});

// Delete bill
router.delete("/:id", auth, async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Delete bill error:", error);
    res.status(500).json({
      message: "Error deleting bill",
      error: error.message
    });
  }
});

module.exports = router;
