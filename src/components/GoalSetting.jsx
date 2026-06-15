import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Line, Pie } from 'react-chartjs-2';
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
import { FaPlus, FaEdit, FaTrash, FaPiggyBank } from 'react-icons/fa';
import './GoalSetting.css';

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

// Update API base URL
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
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const GoalSetting = () => {
  const navigate = useNavigate();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    description: '',
    priority: 'medium',
    category: 'savings'
  });
  
  const [newContribution, setNewContribution] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [goals, setGoals] = useState([]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchGoals();
  }, [navigate]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/goals`, {
        headers: getAuthHeader()
      });
      setGoals(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching goals:', err);
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

  const handleAddGoal = async (e) => {
    e.preventDefault();
    console.log("Add Goal button clicked, submitting form...");
    
    try {
      if (isEditing && selectedGoal) {
        console.log("Updating existing goal...");
        const response = await axios.put(
          `${API_BASE_URL}/goals/${selectedGoal._id}`,
          {
            ...newGoal,
            targetAmount: Number(newGoal.targetAmount),
            notes: newGoal.description
          },
          { headers: getAuthHeader() }
        );
        
        console.log("Goal updated successfully:", response.data);
        setGoals(prev => prev.map(goal => 
          goal._id === selectedGoal._id ? response.data : goal
        ));
        setIsEditing(false);
        setSelectedGoal(null);
      } else {
        console.log("Creating new goal with data:", {
          ...newGoal,
          targetAmount: Number(newGoal.targetAmount),
          currentAmount: 0,
          notes: newGoal.description
        });
        
        const response = await axios.post(
          `${API_BASE_URL}/goals`,
          {
            ...newGoal,
            targetAmount: Number(newGoal.targetAmount),
            currentAmount: 0,
            notes: newGoal.description
          },
          { headers: getAuthHeader() }
        );
        
        console.log("Goal created successfully:", response.data);
        
        // Update goals state with the new goal
        const updatedGoals = [...goals, response.data];
        setGoals(updatedGoals);
      }
      
      // Close the modal and reset form
      setShowAddGoal(false);
      setNewGoal({ 
        name: '', 
        targetAmount: '', 
        deadline: '', 
        description: '', 
        priority: 'medium',
        category: 'savings'
      });
      setError(null);
      
      // Force a re-render of charts by fetching goals again
      console.log("Refreshing goals data...");
      fetchGoals();
    } catch (err) {
      console.error("Error in handleAddGoal:", err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    try {
      const newAmount = Number(newContribution.amount);
      const newTotal = selectedGoal.currentAmount + newAmount;
      
      if (newTotal > selectedGoal.targetAmount) {
        setError(`The maximum contribution allowed is Rs ${(selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString()}`);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/goals/${selectedGoal._id}/contributions`,
        {
          amount: newAmount,
          date: newContribution.date
        },
        { headers: getAuthHeader() }
      );

      setGoals(prev => prev.map(goal => 
        goal._id === selectedGoal._id ? response.data : goal
      ));
      setShowAddContribution(false);
      setNewContribution({ amount: '', date: new Date().toISOString().split('T')[0] });
      setError(null);
    } catch (err) {
      console.error('Error adding contribution:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/goals/${goalId}`,
        { headers: getAuthHeader() }
      );
      setGoals(prev => prev.filter(goal => goal._id !== goalId));
      setError(null);
    } catch (err) {
      console.error('Error deleting goal:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleEditGoal = (goal) => {
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline,
      description: goal.notes,
      priority: goal.priority,
      category: goal.category
    });
    setSelectedGoal(goal);
    setIsEditing(true);
    setShowAddGoal(true);
  };

  return (
    <div className="goal-setting">
      {error && <div className="error-message">{error}</div>}

      <div className="goal-header">
        <div className="goal-header-content">
          <h1>Financial Goals</h1>
          <p>Track your savings goals and progress</p>
        </div>
        <button
          className="add-goal-btn"
          onClick={() => setShowAddGoal(true)}
        >
          <FaPlus /> Add New Goal
        </button>
      </div>

      {/* Add/Edit Goal Modal */}
      {showAddGoal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{isEditing ? 'Edit Goal' : 'Add New Goal'}</h2>
            <form onSubmit={(e) => {
              console.log("Form submitted");
              handleAddGoal(e);
            }}>
              <div className="form-group">
                <label>Goal Name</label>
                <input 
                  type="text" 
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  placeholder="Enter goal name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Amount</label>
                <input 
                  type="number" 
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  placeholder="Enter target amount"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input 
                  type="date" 
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Enter goal description"
                  required
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    console.log("Cancel button clicked");
                    setShowAddGoal(false);
                    setNewGoal({ name: '', targetAmount: '', deadline: '', description: '', priority: 'medium', category: 'savings' });
                    setIsEditing(false);
                    setSelectedGoal(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-goal-btn"
                  onClick={(e) => {
                    // This is a backup in case the form's onSubmit doesn't trigger
                    if (e.target.type === 'submit' && e.target.form && !e.target.form.checkValidity()) {
                      // If the form is invalid, let the browser handle validation
                      return;
                    }
                    
                    // If we're here, either the form is valid or we're bypassing validation
                    // Prevent the default form submission
                    e.preventDefault();
                    console.log("Submit button clicked directly");
                    handleAddGoal(e);
                  }}
                >
                  {isEditing ? 'Update Goal' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {showAddContribution && selectedGoal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Contribution to {selectedGoal.name}</h2>
            <form onSubmit={handleAddContribution}>
              <div className="form-group">
                <label>Amount (Maximum: Rs {(selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString()})</label>
                <input 
                  type="number" 
                  value={newContribution.amount}
                  onChange={(e) => setNewContribution({...newContribution, amount: e.target.value})}
                  placeholder="Enter contribution amount"
                  max={selectedGoal.targetAmount - selectedGoal.currentAmount}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={newContribution.date}
                  onChange={(e) => setNewContribution({...newContribution, date: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddContribution(false)}>Cancel</button>
                <button type="submit">Add Contribution</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading your goals...</p>
        </div>
      ) : (
        <>
          <div className="goal-overview">
            <div className="goal-card total">
              <div className="goal-icon">
                <FaPiggyBank />
              </div>
              <div className="goal-info">
                <h3>Total Savings</h3>
                <p className="amount">
                  Rs {goals.reduce((sum, goal) => sum + goal.currentAmount, 0).toLocaleString()}
                </p>
                <span className="period">Across all goals</span>
              </div>
            </div>
          </div>

          {goals.length > 0 ? (
            <div className="charts-container">
              <div className="chart-card">
                <h3>Goals Progress</h3>
                <div className="chart-wrapper">
                  <Pie 
                    data={{
                      labels: goals.map(goal => goal.name),
                      datasets: [{
                        data: goals.map(goal => (goal.currentAmount / goal.targetAmount) * 100),
                        backgroundColor: [
                          '#00CED1',  // Bright Teal
                          '#FF6B2B',  // Vivid Orange
                          '#1E90FF',  // Electric Blue
                          '#A020F0',  // Bright Purple
                          '#FF1744',  // Cherry Red
                          '#FFD700',  // Sunshine Yellow
                          '#00CED1',  // Bright Teal (repeated)
                          '#FF6B2B',  // Vivid Orange (repeated)
                          '#1E90FF',  // Electric Blue (repeated)
                          '#A020F0',  // Bright Purple (repeated)
                          '#FF1744',  // Cherry Red (repeated)
                          '#FFD700'   // Sunshine Yellow (repeated)
                        ],
                        borderWidth: 0
                      }]
                    }}
                    options={{
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
                              return `${context.label}: ${value.toFixed(1)}%`;
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
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <h3>Savings Timeline</h3>
                <div className="chart-wrapper">
                  <Line 
                    data={{
                      labels: goals.map(goal => new Date(goal.deadline).toLocaleDateString()),
                      datasets: [{
                        label: 'Current Amount',
                        data: goals.map(goal => goal.currentAmount),
                        borderColor: '#6366F1',
                        tension: 0.4,
                        fill: false
                      }, {
                        label: 'Target Amount',
                        data: goals.map(goal => goal.targetAmount),
                        borderColor: '#10B981',
                        tension: 0.4,
                        fill: false
                      }]
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
                            color: goals.length > 0 ? undefined : '#9CA3AF',
                            callback: (value) => `Rs ${value.toLocaleString()}`
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            color: goals.length > 0 ? undefined : '#9CA3AF'
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          labels: {
                            color: goals.length > 0 ? undefined : '#9CA3AF'
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              if (goals.length === 0) {
                                return 'Add goals to see timeline';
                              }
                              return `${context.dataset.label}: Rs ${context.raw.toLocaleString()}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="charts-container">
              <div className="chart-card">
                <h3>Goals Progress</h3>
                <div className="chart-wrapper">
                  <Pie 
                    data={{
                      labels: ['No Goals'],
                      datasets: [{
                        data: [100],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 0,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: '#9CA3AF'
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: () => 'Add goals to see progress'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <h3>Savings Timeline</h3>
                <div className="chart-wrapper">
                  <Line 
                    data={{
                      labels: ['No Goals'],
                      datasets: [{
                        label: 'Current Amount',
                        data: [0],
                        borderColor: '#6366F1',
                        tension: 0.4,
                        fill: false
                      }, {
                        label: 'Target Amount',
                        data: [0],
                        borderColor: '#10B981',
                        tension: 0.4,
                        fill: false
                      }]
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
                            color: '#9CA3AF',
                            callback: (value) => `Rs ${value.toLocaleString()}`
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            color: '#9CA3AF'
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          labels: {
                            color: '#9CA3AF'
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: () => 'Add goals to see timeline'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="goals-list">
            <h2>Your Goals</h2>
            <div className="goal-items">
              {goals.map((goal) => (
                <div key={goal._id} className="goal-item">
                  <div className="goal-details">
                    <div className="goal-header-info">
                      <h4>{goal.name}</h4>
                      <span className="goal-percentage">
                        {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="goal-description">{goal.notes}</p>
                    <div className="progress-bar">
                      <div 
                        className={`progress ${
                          goal.currentAmount >= goal.targetAmount
                            ? 'success'
                            : goal.currentAmount / goal.targetAmount >= 0.7
                            ? 'warning'
                            : ''
                        }`}
                        style={{ 
                          width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <div className="goal-stats">
                      <span>Rs {goal.currentAmount.toLocaleString()} of Rs {goal.targetAmount.toLocaleString()}</span>
                      <span className="goal-deadline">Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="goal-actions">
                    <button 
                      className="add-contribution-btn"
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowAddContribution(true);
                      }}
                      disabled={goal.currentAmount >= goal.targetAmount}
                    >
                      <FaPlus /> Add Contribution
                    </button>
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditGoal(goal)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteGoal(goal._id)}
                    >
                      <FaTrash />
                    </button>
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

export default GoalSetting;