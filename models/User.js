const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: function() {
        // Password is not required for Google-authenticated users
        return !this.googleId;
      }
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    profilePicture: {
      type: String
    },
    phone: String,
    avatar: String,
    salary: {
      amount: {
        type: Number,
        default: 0
      },
      lastReset: {
        type: Date,
        default: Date.now
      }
    },
    savings: {
      amount: {
        type: Number,
        default: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    settings: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      billReminders: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
      currency: { type: String, default: "USD" },
      language: { type: String, default: "English" },
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check and reset monthly salary
userSchema.methods.checkAndResetSalary = async function() {
  const now = new Date();
  const lastReset = new Date(this.salary.lastReset);
  
  // If it's a new month
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    // Add remaining salary to savings
    this.savings.amount += this.salary.amount;
    this.savings.lastUpdated = now;
    
    // Reset salary
    this.salary.amount = 0;
    this.salary.lastReset = now;
    
    await this.save();
  }
};

module.exports = mongoose.model("User", userSchema);
