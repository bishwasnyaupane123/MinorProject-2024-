import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { FaLightbulb, FaChartLine, FaArrowUp, FaArrowDown, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './AIInsights.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'http://localhost:5000/api';

const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [financialData, setFinancialData] = useState({
    income: [],
    expenses: [],
    savings: [],
    categories: {}
  });
  const [recommendations, setRecommendations] = useState({
    savings: [],
    expenses: []
  });
  const [expensePrediction, setExpensePrediction] = useState(null);
  const [historicalExpenses, setHistoricalExpenses] = useState([]);
  const [cache, setCache] = useState({});
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseInput, setExpenseInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [showSavingsPredictionModal, setShowSavingsPredictionModal] = useState(false);
  const [expenses, setExpenses] = useState({
    income: '',
    rent: '',
    utilities: '',
    groceries: '',
    transportation: '',
    entertainment: '',
    healthcare: '',
    education: '',
    miscellaneous: ''
  });
  const [predictedSaving, setPredictedSaving] = useState(null);

  // Get auth header
  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check cache first
      const cacheKey = `insights_${selectedPeriod}`;
      const cachedData = cache[cacheKey];
      if (cachedData && Date.now() - cachedData.timestamp < cacheTimeout) {
        setFinancialData(cachedData.financial);
        setRecommendations(cachedData.recommendations);
        setInsights(cachedData.insights);
        setHistoricalExpenses(cachedData.financial.expenses);
        setLoading(false);
        return;
      }

      // Check for token
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const [financialRes, recommendationsRes, insightsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/insights?period=${selectedPeriod}`, {
          headers: getAuthHeader()
        }),
        axios.get(`${API_BASE_URL}/insights/recommendations?period=${selectedPeriod}`, {
          headers: getAuthHeader()
        }),
        axios.get(`${API_BASE_URL}/insights/insights?period=${selectedPeriod}`, {
          headers: getAuthHeader()
        })
      ]);

      // Validate response data
      if (!financialRes.data || !Array.isArray(financialRes.data.income)) {
        throw new Error('Invalid financial data received');
      }

      if (!recommendationsRes.data || !Array.isArray(recommendationsRes.data.savings)) {
        throw new Error('Invalid recommendations data received');
      }

      if (!insightsRes.data || !Array.isArray(insightsRes.data)) {
        throw new Error('Invalid insights data received');
      }

      // Update state and cache
      const newData = {
        financial: financialRes.data,
        recommendations: recommendationsRes.data,
        insights: insightsRes.data,
        timestamp: Date.now()
      };

      setFinancialData(newData.financial);
      setRecommendations(newData.recommendations);
      setInsights(newData.insights);
      setHistoricalExpenses(newData.financial.expenses);
      setCache(prev => ({
        ...prev,
        [cacheKey]: newData
      }));

      // Get expense prediction if we have enough historical data
      if (newData.financial.expenses.length >= 60) {
        const last60Expenses = newData.financial.expenses.slice(-60);
        const predictionRes = await axios.post(
          `${API_BASE_URL}/predict`,
          { expenses: last60Expenses },
          { headers: getAuthHeader() }
        );
        setExpensePrediction(predictionRes.data);
      }

    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (err.response?.status === 404) {
        setError('The requested financial data is not available. Please try again later.');
      } else if (err.message === 'Network Error') {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else if (err.message.includes('Invalid')) {
        setError('Received invalid data from server. Please contact support if this persists.');
      } else {
        setError(`Failed to fetch financial insights: ${err.response?.data?.message || err.message}`);
      }
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add refresh button
  const handleRefresh = () => {
    const cacheKey = `insights_${selectedPeriod}`;
    setCache(prev => ({
      ...prev,
      [cacheKey]: null
    }));
    fetchData();
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setInputError('');
    setLoading(true);

    try {
      // Parse the CSV input into an array of numbers
      const expenses = expenseInput
        .split(',')
        .map(num => parseFloat(num.trim()))
        .filter(num => !isNaN(num));

      // Validate input length
      if (expenses.length !== 60) {
        setInputError('Please provide exactly 60 monthly expense values');
        return;
      }

      let predictionResult = null;
      // Check if all expenses are within ARIMA range
      const isArimaRange = expenses.every(exp => exp >= 40000 && exp <= 54000);

      if (isArimaRange) {
        // Use ARIMA model
        try {
          console.log('Sending ARIMA prediction request with data:', { expenses });
          const predictionRes = await axios.post(
            `${API_BASE_URL}/predict`,
            { expenses },
            { 
              headers: getAuthHeader(),
              timeout: 10000 // 10 second timeout
            }
          );
          console.log('ARIMA prediction response:', predictionRes.data);
          predictionResult = {
            ...predictionRes.data,
            method: 'ARIMA'
          };
        } catch (arimaError) {
          console.error('ARIMA prediction error:', arimaError);
          console.log('Falling back to weighted prediction method');
          predictionResult = null;
        }
      }

      // If ARIMA failed or data is out of range, use weighted prediction
      if (!predictionResult) {
        // Use weighted prediction method
        console.log('Using weighted prediction method');
        // Calculate weighted average with more weight to recent months
        const weights = expenses.map((_, index) => Math.exp(index / expenses.length));
        const weightedSum = expenses.reduce((sum, expense, index) => sum + expense * weights[index], 0);
        const totalWeights = weights.reduce((sum, weight) => sum + weight, 0);
        const weightedAverage = weightedSum / totalWeights;

        // Calculate trend using last 6 months
        const recentMonths = expenses.slice(-6);
        const trend = recentMonths.reduce((acc, curr, idx) => {
          if (idx === 0) return acc;
          return acc + (curr - recentMonths[idx - 1]);
        }, 0) / 5; // Average monthly change

        // Predict next month considering weighted average and trend
        const prediction = weightedAverage + trend;

        // Calculate confidence based on data variance
        const variance = expenses.reduce((sum, exp) => sum + Math.pow(exp - weightedAverage, 2), 0) / expenses.length;
        const standardDeviation = Math.sqrt(variance);
        const confidence = Math.max(0, Math.min(1, 1 - (standardDeviation / weightedAverage)));

        console.log('Weighted prediction result:', {
          prediction,
          confidence,
          weightedAverage,
          trend
        });

        predictionResult = {
          prediction: prediction,
          confidence: confidence,
          method: 'Weighted Prediction'
        };
      }

      setExpensePrediction(predictionResult);
      setHistoricalExpenses(expenses);
      setShowExpenseForm(false);
    } catch (err) {
      console.error('Prediction error:', err);
      setInputError(
        `Prediction failed: ${err.response?.data?.error || err.message}. ` +
        'Please check your input data and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Add handler for expense changes
  const handleExpenseChange = (field, value) => {
    setExpenses(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add prediction function
  const predictSavings = async () => {
    try {
      const totalExpenses = Object.entries(expenses)
        .filter(([field]) => field !== 'income')
        .reduce((sum, [_, value]) => sum + Number(value || 0), 0);
      
      const predictedAmount = Number(expenses.income) - totalExpenses;
      setPredictedSaving({
        amount: predictedAmount,
        confidence: 0.85
      });
    } catch (error) {
      console.error('Error predicting savings:', error);
      setError('Failed to predict savings. Please try again.');
    }
  };

  // Chart Data
  const spendingTrendData = {
    labels: financialData.labels || [],
    datasets: [
      {
        label: 'Monthly Income',
        data: financialData.income || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Monthly Expenses',
        data: financialData.expenses || [],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Update Line chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses Trend',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', sans-serif"
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
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `Rs ${value.toLocaleString()}`
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const categoryDistributionData = {
    labels: Object.keys(financialData.categories),
    datasets: [{
      data: Object.values(financialData.categories),
      backgroundColor: [
        '#6366F1',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6'
      ],
      borderWidth: 0
    }]
  };

  const savingsProjectionData = {
    labels: financialData.savings.map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() + index);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: [{
      label: 'Projected Savings',
      data: financialData.savings,
      backgroundColor: '#6366F1'
    }]
  };

  // Add new chart data for expense prediction
  const expensePredictionData = {
    labels: [...historicalExpenses.slice(-12).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (12 - index));
      return date.toLocaleString('default', { month: 'short' });
    }), 'Next Month'],
    datasets: [{
      label: 'Monthly Expenses',
      data: [...historicalExpenses.slice(-12), expensePrediction?.prediction],
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // Add modal component for savings prediction
  const renderSavingsPredictionModal = () => (
    <div className="modal-overlay">
      <div className="modal-content prediction-modal">
        <h2>Predict Next Month's Savings</h2>
        
        {predictedSaving === null ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            predictSavings();
          }}>
            {/* Income field first */}
            <div className="form-group" key="income">
              <label>INCOME</label>
              <input
                type="number"
                value={expenses.income}
                onChange={(e) => handleExpenseChange('income', e.target.value)}
                placeholder="Enter your monthly income"
                required
                min="0"
              />
            </div>

            <h3 className="expenses-section-title">Monthly Expenses</h3>
            
            {/* Expense fields in a grid layout */}
            <div className="expenses-grid">
              {Object.entries(expenses)
                .filter(([field]) => field !== 'income')
                .map(([field, value]) => (
                  <div className="form-group" key={field}>
                    <label>{field.replace('_', ' ').toUpperCase()}</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleExpenseChange(field, e.target.value)}
                      placeholder={`Enter ${field.replace('_', ' ')}`}
                      required
                      min="0"
                    />
                  </div>
              ))}
            </div>

            {/* Summary section */}
            <div className="expenses-summary">
              <div className="summary-item">
                <span>Total Income:</span>
                <span>₹{Number(expenses.income || 0).toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span>Total Expenses:</span>
                <span>₹{Object.entries(expenses)
                  .filter(([field]) => field !== 'income')
                  .reduce((sum, [_, value]) => sum + Number(value || 0), 0)
                  .toLocaleString()}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button type="submit" className="submit-btn">
                Predict Savings
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSavingsPredictionModal(false);
                  setPredictedSaving(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="prediction-result">
            <h3>Predicted Monthly Savings</h3>
            <div className="prediction-amount">₹{predictedSaving.amount.toLocaleString()}</div>
            <div className="prediction-confidence">
              Confidence Level: {(predictedSaving.confidence * 100).toFixed(1)}%
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setPredictedSaving(null)}
                className="submit-btn"
              >
                Calculate Again
              </button>
              <button
                onClick={() => {
                  setShowSavingsPredictionModal(false);
                  setPredictedSaving(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="ai-insights">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="insights-header">
        <div>
          <h1>AI Financial Insights</h1>
          <p>Smart analysis of your financial patterns</p>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            <FaSync className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <button 
            className="expense-input-btn"
            onClick={() => setShowExpenseForm(true)}
          >
            Input Expense Data
          </button>
          <button 
            className="predict-savings-btn"
            onClick={() => setShowSavingsPredictionModal(true)}
          >
            Predict Next Month's Savings
          </button>
        </div>
      </div>

      {/* Add the savings prediction modal */}
      {showSavingsPredictionModal && renderSavingsPredictionModal()}

      {/* Add Expense Input Modal */}
      {showExpenseForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Input 60-Month Expense Data</h2>
            <p className="modal-description">
              Please enter your last 60 months of expenses (between Rs 40,000 and Rs 54,000), separated by commas.
            </p>
            {inputError && <div className="input-error">{inputError}</div>}
            <form onSubmit={handleExpenseSubmit}>
              <textarea
                value={expenseInput}
                onChange={(e) => setExpenseInput(e.target.value)}
                placeholder="e.g., 45000, 46000, 47000, ..."
                rows={6}
                className="expense-input"
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowExpenseForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Get Prediction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loader-container">
            <div className="loader"></div>
            <p>Analyzing your financial data...</p>
          </div>
          
          {/* Skeleton screens for insights */}
          <div className="insights-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="insight-card skeleton">
                <div className="insight-icon skeleton-icon"></div>
                <div className="insight-content">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton screens for charts */}
          <div className="charts-container">
            {[1, 2, 3].map(i => (
              <div key={i} className="chart-card">
                <div className="skeleton-title"></div>
                <div className="chart-wrapper skeleton-chart"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="insights-grid">
            {insights.map(insight => (
              <div key={insight.id} className={`insight-card ${insight.severity}`}>
                <div className="insight-icon">
                  {insight.type === 'spending' && <FaChartLine />}
                  {insight.type === 'saving' && <FaLightbulb />}
                  {insight.type === 'budget' && <FaExclamationTriangle />}
                </div>
                <div className="insight-content">
                  <h3>{insight.title}</h3>
                  <p>{insight.description}</p>
                  <div className="insight-action">
                    <strong>Recommended Action:</strong>
                    <p>{insight.action}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Expense Prediction Card if available */}
            {expensePrediction && (
              <div className="insight-card info">
                <div className="insight-icon">
                  <FaChartLine />
                </div>
                <div className="insight-content">
                  <h3>Expense Prediction ({expensePrediction.method})</h3>
                  <p>Predicted expenses for next month: Rs {expensePrediction.prediction.toFixed(2)}</p>
                  <div className="insight-action">
                    <strong>Confidence Level:</strong>
                    <p>{(expensePrediction.confidence * 100).toFixed(1)}% confidence in prediction</p>
                    <p className="prediction-method">
                      Using {expensePrediction.method} method
                      {expensePrediction.method === 'Weighted Prediction' && 
                        ' (Data outside ARIMA range of Rs 40,000-54,000)'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="charts-container">
            <div className="chart-card">
              <h3>Income vs Expenses Trend</h3>
              <div className="chart-wrapper">
                <Line 
                  data={spendingTrendData} 
                  options={lineChartOptions}
                />
              </div>
            </div>

            <div className="chart-card">
              <h3>Expense Distribution by Category</h3>
              <div className="chart-wrapper">
                <Doughnut 
                  data={categoryDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right'
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-card">
              <h3>Projected Savings</h3>
              <div className="chart-wrapper">
                <Bar 
                  data={savingsProjectionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: value => `Rs ${value}`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Add Expense Prediction Chart if available */}
            {expensePrediction && (
              <div className="chart-card">
                <h3>Expense Prediction Trend</h3>
                <div className="chart-wrapper">
                  <Line 
                    data={expensePredictionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: value => `Rs ${value}`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="recommendations-section">
            <h2>AI Recommendations</h2>
            <div className="recommendations-grid">
              <div className="recommendation-card">
                <h3>Savings Opportunities</h3>
                <ul>
                  {recommendations.savings.map((rec, index) => (
                    <li key={index}>
                      <FaLightbulb className="recommendation-icon" />
                      <p>{rec.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="recommendation-card">
                <h3>Expense Management</h3>
                <ul>
                  {recommendations.expenses.map((rec, index) => (
                    <li key={index}>
                      <FaChartLine className="recommendation-icon" />
                      <p>{rec.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIInsights;