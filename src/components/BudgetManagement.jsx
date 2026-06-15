import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { FaPlus, FaEdit, FaTrash, FaWallet, FaChartPie, FaTags, FaCheck, FaTimes } from 'react-icons/fa';
import './BudgetManagement.css';
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api';

// Error handling utility function
const handleApiError = (error) => {
  if (error.response) {
    if (error.response.status === 401) {
      return 'Your session has expired. Please login again.';
    }
    return error.response.data.message || 'An error occurred with the server';
  } else if (error.request) {
    return 'Unable to connect to the server';
  } else {
    return 'An error occurred while processing your request';
  }
};

// Get auth header
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

const BudgetManagement = () => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', allocation: '' });
  const [newExpense, setNewExpense] = useState({ amount: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // First get the total budget
      const budgetResponse = await axios.get(`${API_BASE_URL}/budgets`, { 
        headers: getAuthHeader() 
      });
      setBudget(budgetResponse.data);

      // Only fetch categories if there's a total budget set
      if (budgetResponse.data.totalBudget > 0) {
        const categoriesResponse = await axios.get(`${API_BASE_URL}/budgets/categories`, { 
          headers: getAuthHeader() 
        });
        setCategories(categoriesResponse.data);
      } else {
        setCategories([]);
      }
      setError('');
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetTotalBudget = async (e) => {
    e.preventDefault();
    try {
      // Get the user's income and current budget usage from the API
      const [userResponse, budgetResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/users/financial-info`, {
          headers: getAuthHeader()
        }),
        axios.get(`${API_BASE_URL}/budgets`, {
          headers: getAuthHeader()
        })
      ]);
      
      const monthlyIncome = userResponse.data.data.salary.amount;
      const currentBudget = budgetResponse.data.totalBudget;
      const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
      const budgetUsagePercentage = (totalSpent / currentBudget) * 100;

      let budgetAmount;
      if (budgetUsagePercentage >= 85) {
        // Add 10% of monthly income to current budget
        const additionalBudget = monthlyIncome * 0.1;
        budgetAmount = currentBudget + additionalBudget;
      } else {
        // Set to 60% of income if not updating
        budgetAmount = monthlyIncome * 0.6;
      }

      const response = await axios.post(
        `${API_BASE_URL}/budgets`, 
        { amount: budgetAmount },
        { headers: getAuthHeader() }
      );
      
      setBudget(response.data);
      setShowSetBudget(false);
      setNewBudgetAmount('');
      setError('');
      
      // Show success message
      if (budgetUsagePercentage >= 85) {
        toast.success(`Budget increased by 10% of monthly income (Rs ${(monthlyIncome * 0.1).toLocaleString()})`);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      // Check if total budget exists
      if (!budget?.totalBudget) {
        setError('Please set a total budget first before adding categories');
        setShowAddCategory(false);
        return;
      }

      // Calculate current total allocation
      const currentTotalAllocation = categories.reduce((sum, cat) => sum + cat.allocation, 0);
      const newAllocation = Number(newCategory.allocation);

      // Check if new allocation would exceed total budget
      if (currentTotalAllocation + newAllocation > budget.totalBudget) {
        setError(`Cannot add category. Total allocation would exceed budget. Available: Rs ${(budget.totalBudget - currentTotalAllocation).toLocaleString()}`);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/budgets/categories`,
        {
          name: newCategory.name,
          allocation: newAllocation
        },
        { headers: getAuthHeader() }
      );
      setCategories(response.data);
      setShowAddCategory(false);
      setNewCategory({ name: '', allocation: '' });
      setError('');
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    }
  };

  const handleAddCategoryClick = () => {
    if (!budget?.totalBudget) {
      setError('Please set a total budget first before adding categories');
      return;
    }
    setShowAddCategory(true);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const expenseAmount = Number(newExpense.amount);
      const category = categories.find(cat => cat._id === selectedCategory._id);
      
      // Check if expense would exceed category allocation
      if (category.spent + expenseAmount > category.allocation) {
        setError(`This expense would exceed the category budget. Available: Rs ${(category.allocation - category.spent).toLocaleString()}`);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/budgets/categories/${selectedCategory._id}/expenses`,
        {
          amount: expenseAmount,
          description: newExpense.description
        },
        { headers: getAuthHeader() }
      );
      setCategories(response.data);
      setShowAddExpense(false);
      setNewExpense({ amount: '', description: '' });
      setError('');
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/budgets/categories/${categoryId}`,
        { headers: getAuthHeader() }
      );
      setCategories(response.data);
      setError('');
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    }
  };

  const calculateProgress = (spent, allocation) => {
    return (spent / allocation) * 100;
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return '#EF4444'; // Red for danger
    if (progress >= 75) return '#FBBF24'; // Yellow for warning
    return '#34D399'; // Green for safe
  };

  // Clear error when closing modals
  const closeSetBudget = () => {
    setShowSetBudget(false);
    setNewBudgetAmount('');
    setError('');
  };

  const closeAddCategory = () => {
    setShowAddCategory(false);
    setNewCategory({ name: '', allocation: '' });
    setError('');
  };

  const closeAddExpense = () => {
    setShowAddExpense(false);
    setNewExpense({ amount: '', description: '' });
    setSelectedCategory(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="budget-management loading">
        <div className="loader"></div>
        <p>Loading budget data...</p>
      </div>
    );
  }

  return (
    <div className="budget-management">
      {error && <div className="error-message">{error}</div>}
      
      {/* Set Budget Modal */}
      {showSetBudget && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Set Total Budget</h2>
            <form onSubmit={handleSetTotalBudget}>
              <div className="form-group">
                <p>Your total budget will be automatically set to 60% of your monthly income.</p>
                <div className="input-help">
                  This helps ensure responsible budget allocation while leaving room for savings and discretionary spending.
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowSetBudget(false)}>Cancel</button>
                <button type="submit">Set Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Allocation Amount (Maximum: Rs {budget ? (budget.totalBudget - categories.reduce((sum, cat) => sum + cat.allocation, 0)).toLocaleString() : 0})</label>
                <input
                  type="number"
                  value={newCategory.allocation}
                  onChange={(e) => setNewCategory({ ...newCategory, allocation: e.target.value })}
                  placeholder="Enter allocation amount"
                  min="0"
                  max={budget ? budget.totalBudget - categories.reduce((sum, cat) => sum + cat.allocation, 0) : 0}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddCategory(false)}>Cancel</button>
                <button type="submit">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && selectedCategory && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Expense to {selectedCategory.name}</h2>
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label>Amount (Maximum: Rs {(selectedCategory.allocation - selectedCategory.spent).toLocaleString()})</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="Enter expense amount"
                  min="0"
                  max={selectedCategory.allocation - selectedCategory.spent}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Enter expense description"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddExpense(false)}>Cancel</button>
                <button type="submit">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="budget-header">
        <div>
          <h1>Budget Management</h1>
          <p>Track and manage your monthly budget</p>
        </div>
        <div className="header-actions">
          <button className="set-budget-btn" onClick={() => setShowSetBudget(true)}>
            <FaWallet /> {budget ? 'Update Budget' : 'Set Budget'}
          </button>
          <button 
            className="add-category-btn" 
            onClick={handleAddCategoryClick}
          >
            <FaPlus /> Add Category
          </button>
        </div>
      </div>

      <div className="budget-overview">
        <div className="budget-card total">
          <div className="budget-icon">
            <FaWallet />
          </div>
          <div className="budget-info">
            <h3>Total Budget</h3>
            <p className="amount">Rs {budget?.totalBudget?.toLocaleString() || 0}</p>
            <p className="period">Monthly</p>
          </div>
        </div>

        <div className="budget-card spent">
          <div className="budget-icon">
            <FaChartPie />
          </div>
          <div className="budget-info">
            <h3>Total Spent</h3>
            <p className="amount">Rs {categories.reduce((sum, cat) => sum + cat.spent, 0).toLocaleString()}</p>
            <p className="period">This Month</p>
          </div>
        </div>

        <div className="budget-card remaining">
          <div className="budget-icon">
            <FaTags />
          </div>
          <div className="budget-info">
            <h3>Remaining</h3>
            <p className="amount">Rs {(budget?.totalBudget - categories.reduce((sum, cat) => sum + cat.spent, 0)).toLocaleString()}</p>
            <p className="period">Available</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Budget Distribution</h3>
          <div className="chart-container">
            {categories.length > 0 ? (
              <Pie
                data={{
                  labels: categories.map(cat => cat.name),
                  datasets: [{
                    data: categories.map(cat => cat.allocation),
                    backgroundColor: [
                      '#6366F1', // Indigo
                      '#10B981', // Emerald
                      '#F59E0B', // Amber
                      '#EF4444', // Red
                      '#8B5CF6', // Purple
                      '#EC4899', // Pink
                      '#14B8A6', // Teal
                      '#F97316', // Orange
                      '#06B6D4', // Cyan
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        font: {
                          size: 12,
                          family: "'Inter', sans-serif"
                        },
                        padding: 15
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.raw;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `Rs ${value.toLocaleString()} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="no-data">
                <p>Add categories to see budget distribution</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Budget vs Spending</h3>
          <div className="chart-container">
            {categories.length > 0 ? (
              <Bar
                data={{
                  labels: categories.map(cat => cat.name),
                  datasets: [
                    {
                      label: 'Budget',
                      data: categories.map(cat => cat.allocation),
                      backgroundColor: 'rgba(99, 102, 241, 0.7)',
                      borderColor: '#6366F1',
                      borderWidth: 1,
                    },
                    {
                      label: 'Spent',
                      data: categories.map(cat => cat.spent),
                      backgroundColor: 'rgba(239, 68, 68, 0.7)',
                      borderColor: '#EF4444',
                      borderWidth: 1,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        callback: (value) => `Rs ${value.toLocaleString()}`
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        font: {
                          size: 12,
                          family: "'Inter', sans-serif"
                        },
                        padding: 15
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.raw;
                          return `${context.dataset.label}: Rs ${value.toLocaleString()}`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="no-data">
                <p>Add categories to see budget comparison</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="budget-categories">
        <div className="categories-header">
          <h2>Budget Categories</h2>
          <div className="categories-legend">
            <span className="legend-item"><span className="dot safe"></span>Safe</span>
            <span className="legend-item"><span className="dot warning"></span>Warning</span>
            <span className="legend-item"><span className="dot danger"></span>Over Budget</span>
          </div>
        </div>

        <div className="categories-grid">
          {categories.map(category => {
            const progress = calculateProgress(category.spent, category.allocation);
            const progressColor = getProgressColor(progress);
            
            return (
              <div key={category._id} className="category-card">
                <div className="category-header">
                  <h3>{category.name}</h3>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteCategory(category._id)}
                  >
                    <FaTrash />
                  </button>
                </div>
                
                <div className="category-info">
                  <div className="budget-info">
                    <span className="label">Budget</span>
                    <span className="amount">Rs {category.allocation.toLocaleString()}</span>
                  </div>
                  <div className="spent-info">
                    <span className="label">Spent</span>
                    <span className="amount">Rs {category.spent.toLocaleString()}</span>
                  </div>
                </div>

                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: progressColor
                    }}
                  />
                </div>

                <div className="category-actions">
                  <button
                    className="add-expense-btn"
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowAddExpense(true);
                    }}
                  >
                    <FaPlus /> Add Expense
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetManagement;