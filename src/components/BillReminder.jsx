import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './BillReminder.css';

const API_BASE_URL = 'http://localhost:5000/api';

const BillReminder = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showEditBill, setShowEditBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: '',
    category: '',
    description: '',
    isRecurring: false,
    frequency: 'monthly'
  });
  const [isEditing, setIsEditing] = useState(false);

  // Get auth header
  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  // Helper function to calculate days until due
  const calculateDaysUntilDue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  // Helper function to get bill status
  const getBillStatus = (bill) => {
    if (bill.paid) return 'paid';
    const daysUntilDue = calculateDaysUntilDue(bill.dueDate);
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 7) return 'due-soon';
    return 'pending';
  };

  // Filter bills based on search term and filter
  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.description && bill.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    const status = getBillStatus(bill);
    switch (filter) {
      case 'pending':
        return !bill.paid && status !== 'overdue';
      case 'due-soon':
        return status === 'due-soon';
      case 'overdue':
        return status === 'overdue';
      case 'paid':
        return bill.paid;
      default:
        return true;
    }
  });

  // Check for upcoming bills and show notifications
  const checkUpcomingBills = (bills) => {
    bills.forEach(bill => {
      if (!bill.paid) {
        const daysUntilDue = calculateDaysUntilDue(bill.dueDate);
        
        // Show notification for bills due in 3 days or less
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          toast.warning(
            <div>
              <strong>{bill.name}</strong> is due in {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'}!
              <br />
              Amount: Rs. {bill.amount.toLocaleString()}
              <br />
              Due Date: {new Date(bill.dueDate).toLocaleDateString()}
            </div>,
            {
              position: "top-right",
              autoClose: 7000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              toastId: `bill-${bill._id}` // Prevent duplicate toasts
            }
          );
        }
        // Show notification for overdue bills
        else if (daysUntilDue < 0) {
          toast.error(
            <div>
              <strong>{bill.name}</strong> is overdue by {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? 'day' : 'days'}!
              <br />
              Amount: Rs. {bill.amount.toLocaleString()}
              <br />
              Due Date: {new Date(bill.dueDate).toLocaleDateString()}
            </div>,
            {
              position: "top-right",
              autoClose: false,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              toastId: `bill-${bill._id}` // Prevent duplicate toasts
            }
          );
        }
      }
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchBills = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/bills`, {
          headers: getAuthHeader()
        });
        setBills(response.data);
        checkUpcomingBills(response.data); // Check for notifications after fetching bills
        setError('');
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch bills');
        }
        console.error('Error fetching bills:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();

    // Set up an interval to check bills every hour
    const intervalId = setInterval(() => {
      fetchBills();
    }, 3600000); // 1 hour in milliseconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedBill) {
        const response = await axios.put(
          `${API_BASE_URL}/bills/${selectedBill._id}`,
          {
            ...newBill,
            amount: Number(newBill.amount),
            recurring: newBill.isRecurring,
            frequency: newBill.isRecurring ? newBill.frequency : null
          },
          { headers: getAuthHeader() }
        );
        setBills(prev => prev.map(bill => 
          bill._id === selectedBill._id ? response.data : bill
        ));
        setIsEditing(false);
        setSelectedBill(null);
      } else {
        const response = await axios.post(
          `${API_BASE_URL}/bills`,
          {
            ...newBill,
            amount: Number(newBill.amount),
            status: 'pending',
            recurring: newBill.isRecurring,
            frequency: newBill.isRecurring ? newBill.frequency : null
          },
          { headers: getAuthHeader() }
        );
        setBills(prev => [...prev, response.data]);
      }
      setShowAddBill(false);
      setNewBill({
        name: '',
        amount: '',
        dueDate: '',
        category: '',
        description: '',
        isRecurring: false,
        frequency: 'monthly'
      });
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleEditBill = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_BASE_URL}/bills/${selectedBill._id}`, 
        {
          ...newBill,
          amount: parseFloat(newBill.amount)
        },
        { headers: getAuthHeader() }
      );
      setBills(bills.map(bill => 
        bill._id === selectedBill._id ? response.data : bill
      ));
      setShowEditBill(false);
      setSelectedBill(null);
      setNewBill({
        name: '',
        amount: '',
        dueDate: '',
        category: '',
        description: ''
      });
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to update bill');
      }
      console.error('Error updating bill:', err);
    }
  };

  const handleMarkAsPaid = async (billId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/bills/${billId}/pay`, 
        {},
        { headers: getAuthHeader() }
      );
      setBills(bills.map(bill => 
        bill._id === billId ? response.data : bill
      ));
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to mark bill as paid');
      }
      console.error('Error marking bill as paid:', err);
    }
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/bills/${billId}`, {
        headers: getAuthHeader()
      });
      setBills(bills.filter(bill => bill._id !== billId));
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to delete bill');
      }
      console.error('Error deleting bill:', err);
    }
  };

  return (
    <div className="bill-reminder">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading your bills...</p>
        </div>
      ) : (
        <>
          {/* Add/Edit Bill Modal */}
          {(showAddBill || showEditBill) && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>{showEditBill ? 'Edit Bill' : 'Add New Bill'}</h2>
                <form onSubmit={showEditBill ? handleEditBill : handleAddBill}>
                  <div className="form-group">
                    <label>Bill Name</label>
                    <input
                      type="text"
                      value={newBill.name}
                      onChange={(e) => setNewBill({...newBill, name: e.target.value})}
                      placeholder="Enter bill name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      value={newBill.amount}
                      onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                      placeholder="Enter bill amount"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={newBill.dueDate}
                      onChange={(e) => setNewBill({...newBill, dueDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newBill.category}
                      onChange={(e) => setNewBill({...newBill, category: e.target.value})}
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="utilities">Utilities</option>
                      <option value="rent">Rent</option>
                      <option value="insurance">Insurance</option>
                      <option value="phone">Phone</option>
                      <option value="internet">Internet</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newBill.description}
                      onChange={(e) => setNewBill({...newBill, description: e.target.value})}
                      placeholder="Enter bill description (optional)"
                    />
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={newBill.isRecurring}
                        onChange={(e) => setNewBill({...newBill, isRecurring: e.target.checked})}
                      />
                      Recurring Bill
                    </label>
                  </div>
                  {newBill.isRecurring && (
                    <div className="form-group">
                      <label>Frequency</label>
                      <select
                        value={newBill.frequency}
                        onChange={(e) => setNewBill({...newBill, frequency: e.target.value})}
                        required={newBill.isRecurring}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="semiannually">Semi-Annually</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                  )}
                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddBill(false);
                        setShowEditBill(false);
                        setNewBill({
                          name: '',
                          amount: '',
                          dueDate: '',
                          category: '',
                          description: '',
                          isRecurring: false,
                          frequency: 'monthly'
                        });
                        setIsEditing(false);
                        setSelectedBill(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit">
                      {showEditBill ? 'Update Bill' : 'Add Bill'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bill-header">
            <div>
              <h1>Bill Reminders</h1>
              <p>Track and manage your bills</p>
            </div>
            <button 
              className="add-bill-btn"
              onClick={() => setShowAddBill(true)}
            >
              <FaPlus /> Add New Bill
            </button>
          </div>

          <div className="bill-filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-buttons">
              <button 
                className={filter === 'all' ? 'active' : ''} 
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={filter === 'pending' ? 'active' : ''} 
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button 
                className={filter === 'due-soon' ? 'active' : ''} 
                onClick={() => setFilter('due-soon')}
              >
                Due Soon
              </button>
              <button 
                className={filter === 'overdue' ? 'active' : ''} 
                onClick={() => setFilter('overdue')}
              >
                Overdue
              </button>
              <button 
                className={filter === 'paid' ? 'active' : ''} 
                onClick={() => setFilter('paid')}
              >
                Paid
              </button>
            </div>
          </div>

          <div className="bills-list">
            {filteredBills.length === 0 ? (
              <div className="no-bills">
                <p>No bills found. Add a new bill to get started!</p>
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div key={bill._id} className={`bill-item ${getBillStatus(bill)}`}>
                  <div className="bill-details">
                    <h3>{bill.name}</h3>
                    <div className="bill-info">
                      <span className="amount">Rs {parseFloat(bill.amount).toFixed(2)}</span>
                      <span className="due-date">Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                      {bill.recurring && (
                        <span className="recurring">
                          <FaClock /> {bill.frequency}
                        </span>
                      )}
                    </div>
                    {bill.description && (
                      <p className="description">{bill.description}</p>
                    )}
                    <div className="category-tag">{bill.category}</div>
                  </div>
                  <div className="bill-actions">
                    {!bill.paid && (
                      <button
                        className="pay-btn"
                        onClick={() => handleMarkAsPaid(bill._id)}
                      >
                        <FaCheck /> Mark as Paid
                      </button>
                    )}
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setSelectedBill(bill);
                        setNewBill({
                          name: bill.name,
                          amount: bill.amount.toString(),
                          dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
                          category: bill.category,
                          description: bill.description || '',
                          isRecurring: bill.recurring,
                          frequency: bill.frequency
                        });
                        setShowEditBill(true);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteBill(bill._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BillReminder;