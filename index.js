const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env file
const envPath = path.resolve(__dirname, ".env");
console.log("Looking for .env file at:", envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("Error loading .env file:", result.error);
  process.exit(1);
}

// Log environment variables status
console.log("Environment variables loaded:", {
  JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
  JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length,
  MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
  PORT_EXISTS: !!process.env.PORT,
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const billRoutes = require("./routes/billRoutes");
const profileRoutes = require("./routes/profileRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const debtRoutes = require("./routes/debtRoutes");
const goalRoutes = require("./routes/goalRoutes");
const insightRoutes = require("./routes/insightRoutes");

// Verify JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined");
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/finance-app")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/insights", insightRoutes);

// Basic route
app.get("/", (req, res) => {
  res.send("Finance App API is running");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
