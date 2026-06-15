import React, { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FaArrowUp, FaArrowDown, FaWallet, FaChartLine, FaCreditCard, FaPiggyBank } from 'react-icons/fa';
import { useFinance } from '../context/FinanceContext';
import "./Dashboard.css";
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { financialData, loading, error, fetchFinancialData } = useFinance();
  const [showSalaryInput, setShowSalaryInput] = useState(false);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [updateError, setUpdateError] = useState(null);
  const [budgetData, setBudgetData] = useState(null);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/budgets/categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setBudgetData(response.data);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    }
  };

  // Add salary update function
  const handleSalaryUpdate = async (e) => {
    e.preventDefault();
    setUpdateError(null);
    try {
      console.log('Updating income with amount:', parseFloat(salaryAmount));
      const response = await axios.post(`${API_BASE_URL}/users/update-salary`, {
        amount: parseFloat(salaryAmount)
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        console.log('Income update successful:', response.data);
        // Update local state and refresh data
        setSalaryAmount('');
        setShowSalaryInput(false);
        await fetchFinancialData(); // Refresh financial data
      }
    } catch (error) {
      console.error('Error updating income:', error);
      if (error.response?.status === 401) {
        setUpdateError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setUpdateError(error.response?.data?.message || 'Failed to update income. Please try again.');
      }
    }
  };

  // Salary input modal
  const renderSalaryInputModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Update Monthly Income</h2>
        <form onSubmit={handleSalaryUpdate}>
          <div className="form-group">
            <label>Monthly Income Amount</label>
            <input
              type="number"
              value={salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
              placeholder="Enter your monthly income"
              required
              min="0"
            />
            {updateError && (
              <div className="error-message">
                {updateError}
              </div>
            )}
          </div>
          <div className="button-group">
            <button type="submit" className="btn-primary">
              Update Income
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowSalaryInput(false);
                setUpdateError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Transform categories data for pie chart
  const transformCategoriesData = () => {
    if (!budgetData || budgetData.length === 0) {
      return {
        labels: [],
        data: []
      };
    }

    const sortedCategories = budgetData
      .filter(category => category.spent > 0)
      .sort((a, b) => b.spent - a.spent);

    return {
      labels: sortedCategories.map(category => category.name),
      data: sortedCategories.map(category => category.spent)
    };
  };

  const categoryData = transformCategoriesData();

  // Pie chart data
  const pieData = {
    labels: categoryData.labels,
    datasets: [{
      data: categoryData.data,
      backgroundColor: [
        '#4F46E5',  // Indigo
        '#10B981',  // Emerald
        '#F59E0B',  // Amber
        '#EF4444',  // Red
        '#8B5CF6',  // Purple
        '#EC4899',  // Pink
        '#06B6D4',  // Cyan
        '#84CC16',  // Lime
        '#6366F1',  // Indigo/Blue
        '#14B8A6',  // Teal
        '#F97316',  // Orange
        '#DC2626'   // Dark Red
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return ` Rs ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 0,
        borderRadius: 4
      }
    },
    layout: {
        padding: {
          top: 20,
        bottom: 20,
        left: 20,
        right: 20
      }
    }
  };

  const getUserName = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.firstName || 'Guest';
    } catch (error) {
      return 'Guest';
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalIncome = financialData.income ? financialData.income.reduce((a, b) => a + b, 0) : 0;
    const totalExpenses = budgetData?.reduce((sum, cat) => sum + cat.spent, 0) || 0;
    const totalBalance = totalIncome - totalExpenses;
    
    // Calculate month-over-month changes
    const previousMonthExpenses = financialData.previousMonthSpent || 0;
    const currentMonthExpenses = totalExpenses;
    const expensesChange = previousMonthExpenses ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      totalBalance,
      expensesChange
    };
  };

  const totals = calculateTotals();

  // Budget Income vs Expense Chart Data
  const budgetChartData = {
    labels: ['Budget Overview'],
    datasets: [
      {
        label: 'Total Budget',
        data: [budgetData?.reduce((sum, cat) => sum + cat.allocation, 0) || 0],
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 1
      },
      {
        label: 'Total Spent',
        data: [budgetData?.reduce((sum, cat) => sum + cat.spent, 0) || 0],
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
        borderWidth: 1
      }
    ]
  };

  const budgetChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Budget Overview',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'Rs ' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loader"></div>
        <p>Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard error">
        <p>Error loading financial data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {showSalaryInput && renderSalaryInputModal()}
      
      <div className="welcome-section">
        <h1>Welcome back, {getUserName()}! 👋</h1>
        <p>Here's your financial overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon income">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3>Monthly Income</h3>
            <p className="amount">Rs {financialData.user?.salary?.amount?.toLocaleString() || 0}</p>
            <div className="stat-actions">
              <button onClick={() => setShowSalaryInput(true)} className="update-btn">
                Update Income
              </button>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaPiggyBank />
          </div>
          <div className="stat-content">
            <h3>Total Savings</h3>
            <p className="amount">Rs {financialData.user?.savings?.amount?.toLocaleString() || 0}</p>
            <div className="trend positive">
              <FaArrowUp />
              <span>0.0% vs last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon expenses">
            <FaCreditCard />
          </div>
          <div className="stat-content">
            <h3>Monthly Expenses</h3>
            <p className="amount">Rs {totals.totalExpenses.toLocaleString()}</p>
            <div className={`trend ${totals.expensesChange <= 0 ? 'positive' : 'negative'}`}>
              {totals.expensesChange <= 0 ? <FaArrowDown /> : <FaArrowUp />}
              <span>{Math.abs(totals.expensesChange).toFixed(1)}% vs last month</span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Budget Overview</h3>
          </div>
          <div className="chart-content" style={{ height: '300px' }}>
            <Bar data={budgetChartData} options={budgetChartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-container">
            {categoryData.data.length > 0 ? (
              <Pie data={pieData} options={pieOptions} />
            ) : (
              <div className="no-data">
                <p>No expense data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;