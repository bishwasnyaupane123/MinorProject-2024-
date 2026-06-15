import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FaPlus, FaTrash, FaCreditCard, FaChartLine, FaMoneyBillWave, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './DebtManagement.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'http://localhost:5000/api';

const DebtManagement = () => {
  const navigate = useNavigate();
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newDebt, setNewDebt] = useState({
    name: '',
    amount: '',
    interestRate: '',
    frequency: 'monthly',
    dueDate: new Date().toISOString().split('T')[0],
    type: '',
    remainingAmount: ''
  });

  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [debts, setDebts] = useState([]);

  const resetNewDebtForm = () => {
    setNewDebt({
      name: '',
      amount: '',
      interestRate: '',
      frequency: 'monthly',
      dueDate: new Date().toISOString().split('T')[0],
      type: '',
      remainingAmount: ''
    });
  };

  // Get auth header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      navigate('/login');
      return null;
    }
    return {
      Authorization: `Bearer ${token}`
    };
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDebts();
  }, [navigate]);

  // Add new function to calculate debt priorities
  const calculateDebtPriorities = (debts) => {
    if (!debts || !Array.isArray(debts) || debts.length === 0) return [];

    // Calculate months until due date for each debt
    const calculateMonthsUntilDue = (dueDate) => {
      try {
        const today = new Date();
        const due = new Date(dueDate);
        if (isNaN(due.getTime())) return 0;
        return Math.max(0, Math.ceil((due - today) / (1000 * 60 * 60 * 24 * 30)));
      } catch (error) {
        console.error('Error calculating months until due:', error);
        return 0;
      }
    };

    // Calculate total payable amount including interest
    const calculateTotalPayable = (debt) => {
      try {
        const monthsUntilDue = calculateMonthsUntilDue(debt.dueDate);
        const monthlyInterestRate = (Number(debt.interestRate) || 0) / 12 / 100;
        const remainingAmount = Number(debt.remainingAmount) || 0;
        return remainingAmount * Math.pow(1 + monthlyInterestRate, monthsUntilDue);
      } catch (error) {
        console.error('Error calculating total payable:', error);
        return Number(debt.remainingAmount) || 0;
      }
    };

    // Calculate priority score based on multiple factors
    const calculatePriorityScore = (debt) => {
      try {
        const monthsUntilDue = calculateMonthsUntilDue(debt.dueDate);
        const totalPayable = calculateTotalPayable(debt);
        const interestWeight = 0.4;
        const timeWeight = 0.3;
        const amountWeight = 0.15;
        const totalPayableWeight = 0.15;

        // Normalize values to a 0-1 scale
        const maxInterestRate = Math.max(...debts.map(d => Number(d.interestRate) || 0), 0.01);
        const maxMonths = Math.max(...debts.map(d => calculateMonthsUntilDue(d.dueDate)), 1);
        const maxAmount = Math.max(...debts.map(d => Number(d.remainingAmount) || 0), 0.01);
        const maxTotalPayable = Math.max(...debts.map(calculateTotalPayable), 0.01);

        const interestScore = (Number(debt.interestRate) || 0) / maxInterestRate;
        const timeScore = 1 - (monthsUntilDue / maxMonths); // Shorter time = higher priority
        const amountScore = (Number(debt.remainingAmount) || 0) / maxAmount;
        const totalPayableScore = totalPayable / maxTotalPayable;

        const score = (
          interestWeight * interestScore +
          timeWeight * timeScore +
          amountWeight * amountScore +
          totalPayableWeight * totalPayableScore
        );

        return isNaN(score) ? 0 : score;
      } catch (error) {
        console.error('Error calculating priority score:', error);
        return 0;
      }
    };

    // Sort debts by priority score
    try {
      return debts.map(debt => ({
        ...debt,
        priorityScore: calculatePriorityScore(debt),
        totalPayable: calculateTotalPayable(debt),
        monthsUntilDue: calculateMonthsUntilDue(debt.dueDate)
      })).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    } catch (error) {
      console.error('Error processing debts:', error);
      return debts;
    }
  };

  // Update fetchDebts to handle auth header properly
  const fetchDebts = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      if (!headers) return;

      const response = await axios.get(`${API_BASE_URL}/debts`, { headers });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Ensure each debt has the required properties before calculation
      const validatedDebts = response.data.map(debt => ({
        ...debt,
        remainingAmount: Number(debt.remainingAmount) || 0,
        amount: Number(debt.amount) || 0,
        interestRate: Number(debt.interestRate) || 0,
        dueDate: debt.dueDate || new Date().toISOString()
      }));

      const debtsWithPriority = calculateDebtPriorities(validatedDebts);
      setDebts(debtsWithPriority);
      calculateTotals(validatedDebts);
      setError(null);



    } catch (err) {
      console.error('Error fetching debts:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch debts';
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (debtsList) => {
    if (!Array.isArray(debtsList)) {
      console.error('Invalid debts list:', debtsList);
      return;
    }
    const total = debtsList.reduce((sum, debt) => sum + (Number(debt.amount) || 0), 0);
    const paid = debtsList.reduce((sum, debt) => {
      const amount = Number(debt.amount) || 0;
      const remaining = Number(debt.remainingAmount) || 0;
      return sum + (amount - remaining);
    }, 0);
    setTotalDebt(total);
    setTotalPaid(paid);
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    try {
      // Validate numeric fields
      const amount = parseFloat(newDebt.amount);
      const interestRate = parseFloat(newDebt.interestRate); // Don't round interest rate
      
      if (isNaN(amount) || amount <= 0) {
        setError('Amount must be a positive number');
        return;
      }
      if (isNaN(interestRate) || interestRate < 0) {
        setError('Interest rate must be a non-negative number');
        return;
      }

      const debtData = {
        ...newDebt,
        amount: amount,
        interestRate: interestRate,
        remainingAmount: isEditing ? parseFloat(newDebt.remainingAmount) : amount
      };

      if (isEditing && selectedDebt) {
        const response = await axios.put(
          `${API_BASE_URL}/debts/${selectedDebt._id}`,
          debtData,
          { headers: getAuthHeader() }
        );
        
        const updatedDebts = debts.map(debt => 
          debt._id === selectedDebt._id ? response.data : debt
        );
        const debtsWithPriority = calculateDebtPriorities(updatedDebts);
        setDebts(debtsWithPriority);
        setIsEditing(false);
        setSelectedDebt(null);
      } else {
        const response = await axios.post(
          `${API_BASE_URL}/debts`,
          debtData,
          { headers: getAuthHeader() }
        );
        
        const updatedDebts = [...debts, response.data];
        const debtsWithPriority = calculateDebtPriorities(updatedDebts);
        setDebts(debtsWithPriority);
      }
      setShowAddDebt(false);
      resetNewDebtForm();
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to add debt');
      }
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/debts/${selectedDebt._id}/payments`,
        {
          amount: parseFloat(newPayment.amount),
          date: newPayment.date
        },
        { headers: getAuthHeader() }
      );

      const updatedDebts = debts.map(debt => 
        debt._id === selectedDebt._id ? response.data : debt
      );
      const debtsWithPriority = calculateDebtPriorities(updatedDebts);
      setDebts(debtsWithPriority);
      setShowAddPayment(false);
      setNewPayment({ amount: '', date: new Date().toISOString().split('T')[0] });
      calculateTotals(updatedDebts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add payment');
      console.error('Error adding payment:', err);
    }
  };

  const handleDeleteDebt = async (debtId) => {
    try {
      await axios.delete(`${API_BASE_URL}/debts/${debtId}`, {
        headers: getAuthHeader()
      });
      const filteredDebts = debts.filter(debt => debt._id !== debtId);
      const debtsWithPriority = calculateDebtPriorities(filteredDebts);
      setDebts(debtsWithPriority);
      calculateTotals(filteredDebts);
    } catch (err) {
      setError('Failed to delete debt');
      console.error('Error deleting debt:', err);
    }
  };

  const handleEditDebt = (debt) => {
    setNewDebt({
      name: debt.name,
      amount: debt.amount.toString(),
      interestRate: debt.interestRate.toString(),
      frequency: debt.frequency,
      dueDate: debt.dueDate,
      type: debt.type,
      remainingAmount: debt.remainingAmount.toString()
    });
    setSelectedDebt(debt);
    setIsEditing(true);
    setShowAddDebt(true);
  };

  const handlePayment = (debt) => {
    setSelectedDebt(debt);
    setShowAddPayment(true);
  };

  // Calculate payment based on frequency
  const calculatePayment = (debt) => {
    const periodicInterest = (debt.interestRate / 100) / (
      debt.frequency === 'monthly' ? 12 : 
      debt.frequency === 'quarterly' ? 4 : 
      debt.frequency === 'semi_annually' ? 2 : 1
    );
    
    const periods = (
      debt.frequency === 'monthly' ? 12 : 
      debt.frequency === 'quarterly' ? 4 : 
      debt.frequency === 'semi_annually' ? 2 : 1
    );
    
    const principal = debt.remainingAmount;
    
    const payment = (principal * periodicInterest * Math.pow(1 + periodicInterest, periods)) / 
                   (Math.pow(1 + periodicInterest, periods) - 1);
    
    return isNaN(payment) ? 0 : payment;
  };

  // Chart Data
  const debtDistributionData = React.useMemo(() => ({
    labels: debts?.map(debt => debt.name) || [],
    datasets: [{
      data: debts?.map(debt => Number(debt.remainingAmount) || 0) || [],
      backgroundColor: [
        '#6366F1',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6'
      ],
      borderWidth: 0,
    }]
  }), [debts]);

  const paymentProgressData = React.useMemo(() => ({
    labels: debts?.map(debt => debt.name) || [],
    datasets: [
      {
        label: 'Total Debt',
        data: debts?.map(debt => Number(debt.amount) || 0) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      },
      {
        label: 'Amount Paid',
        data: debts?.map(debt => {
          const amount = Number(debt.amount) || 0;
          const remaining = Number(debt.remainingAmount) || 0;
          return amount - remaining;
        }) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      }
    ]
  }), [debts]);

  return (
    <div className="debt-management">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading your debt information...</p>
        </div>
      ) : (
        <>
          {showAddDebt && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>{isEditing ? 'Edit Debt' : 'Add New Debt'}</h2>
                <form onSubmit={handleAddDebt}>
                  <div className="form-group">
                    <label>Debt Name</label>
                    <input
                      type="text"
                      value={newDebt.name}
                      onChange={(e) => setNewDebt({...newDebt, name: e.target.value})}
                      placeholder="Enter debt name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      value={newDebt.amount}
                      onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
                      placeholder="Enter debt amount in Rs"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Interest Rate (%)</label>
                    <input
                      type="number"
                      value={newDebt.interestRate}
                      onChange={(e) => setNewDebt({...newDebt, interestRate: e.target.value})}
                      placeholder="Enter interest rate"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={newDebt.dueDate}
                      onChange={(e) => setNewDebt({...newDebt, dueDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newDebt.type}
                      onChange={(e) => setNewDebt({...newDebt, type: e.target.value})}
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="personal_loan">Personal Loan</option>
                      <option value="car_loan">Car Loan</option>
                      <option value="mortgage">Mortgage</option>
                      <option value="student_loan">Student Loan</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payment Frequency</label>
                    <select
                      value={newDebt.frequency}
                      onChange={(e) => setNewDebt({...newDebt, frequency: e.target.value})}
                      required
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi_annually">Semi-Annually</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddDebt(false);
                        resetNewDebtForm();
                        setIsEditing(false);
                        setSelectedDebt(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit">
                      {isEditing ? 'Update Debt' : 'Add Debt'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showAddPayment && selectedDebt && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Add Payment to {selectedDebt.name}</h2>
                <form onSubmit={handleAddPayment}>
                  <div className="form-group">
                    <label>Amount (Maximum: Rs {(selectedDebt.remainingAmount).toLocaleString()})</label>
                    <input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                      placeholder="Enter payment amount in Rs"
                      min="0"
                      max={selectedDebt.remainingAmount}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={newPayment.date}
                      onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowAddPayment(false)}>Cancel</button>
                    <button type="submit">Add Payment</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="debt-header">
            <div>
              <h1>Debt Management</h1>
              <p>Track and manage your debts</p>
            </div>
            <button 
              className="add-debt-btn"
              onClick={() => setShowAddDebt(true)}
            >
              <FaPlus /> Add New Debt
            </button>
          </div>

          <div className="debt-overview">
            <div className="debt-card total">
              <div className="debt-icon">
                <FaCreditCard />
              </div>
              <div className="debt-info">
                <h3>Total Debt</h3>
                <p className="amount">Rs {totalDebt?.toFixed(2) || '0.00'}</p>
                <span className="period">All accounts</span>
              </div>
            </div>

            <div className="debt-card paid">
              <div className="debt-icon">
                <FaMoneyBillWave />
              </div>
              <div className="debt-info">
                <h3>Total Paid</h3>
                <p className="amount">Rs {totalPaid?.toFixed(2) || '0.00'}</p>
                <span className="period">{totalDebt ? ((totalPaid/totalDebt) * 100).toFixed(1) : '0'}% of total debt</span>
              </div>
            </div>

            <div className="debt-card remaining">
              <div className="debt-icon">
                <FaChartLine />
              </div>
              <div className="debt-info">
                <h3>Remaining Debt</h3>
                <p className="amount">Rs {((totalDebt || 0) - (totalPaid || 0)).toFixed(2)}</p>
                <span className="period">To be paid</span>
              </div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-card">
              <h3>Debt Distribution</h3>
              <div className="chart-wrapper">
                <Doughnut 
                  data={debtDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Rs ${context.formattedValue}`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-card">
              <h3>Payment Progress</h3>
              <div className="chart-wrapper">
                <Line 
                  data={paymentProgressData}
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
                          callback: function(value) {
                            return 'Rs ' + value.toLocaleString();
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: Rs ${context.formattedValue}`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="debts-list">
            <h2>Your Debts</h2>
            <div className="debt-items">
              {debts.map((debt) => (
                <div key={debt._id} className="debt-item">
                  <div className="debt-header">
                    <h3>{debt.name}</h3>
                    <div className="debt-priority">
                      Priority Score: {(debt.priorityScore || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="debt-details">
                      <div>
                      <strong>Remaining Amount:</strong> Rs {(debt.remainingAmount || 0).toFixed(2)}
                      </div>
                      <div>
                      <strong>Interest Rate:</strong> {debt.interestRate}%
                      </div>
                      <div>
                      <strong>Due Date:</strong> {new Date(debt.dueDate).toLocaleDateString()}
                      </div>
                      <div>
                      <strong>Time Left:</strong> {debt.monthsUntilDue || 0} months
                    </div>
                    <div>
                      <strong>Total Payable:</strong> Rs {(debt.totalPayable || 0).toFixed(2)}
                    </div>
                    <div className="debt-actions">
                      <button onClick={() => handleEditDebt(debt)}>Edit</button>
                      <button onClick={() => handleDeleteDebt(debt._id)}>Delete</button>
                      <button onClick={() => handlePayment(debt)}>Make Payment</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DebtManagement;