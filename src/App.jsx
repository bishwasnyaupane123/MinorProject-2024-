import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import BudgetManagement from "./components/BudgetManagement";
import DebtManagement from "./components/DebtManagement";
import BillReminder from "./components/BillReminder";
import AIInsights from "./components/AIInsights";
import GoalSetting from "./components/GoalSetting";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Profile from './components/Profile';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Service from "./components/Service";
import About from "./components/About";
import { FinanceProvider } from "./context/FinanceContext";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId="194802921639-1bp27s647uqdlccqitmbng90a25t0hv7.apps.googleusercontent.com">
      <Router>
        <FinanceProvider>
          <div className="app">
            <ToastContainer />
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <div className="main-container">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <Dashboard />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budget"
                element={
                  <ProtectedRoute>
                    <div className="main-container">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <BudgetManagement />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debt"
                element={
                  <ProtectedRoute>
                    <div className="main-container">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <DebtManagement />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bills"
                element={
                  <ProtectedRoute>
                    <div className="main-container">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <BillReminder />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/insights"
                element={
                  <ProtectedRoute>
                    <div className="main-container">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <AIInsights />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <div className="main-container">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <GoalSetting />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <div className="main-container">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <Service />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/about"
                element={
                  <ProtectedRoute>
                    <div className="main-container">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <About />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <div className="main-container">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <Profile />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </FinanceProvider>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
