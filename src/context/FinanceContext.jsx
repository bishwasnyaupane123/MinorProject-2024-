import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const FinanceContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const FinanceProvider = ({ children }) => {
  const [financialData, setFinancialData] = useState({
    income: [],
    expenses: [],
    savings: [],
    categories: {},
    user: {
      salary: {
        amount: 0,
        lastReset: null
      },
      savings: {
        amount: 0,
        lastUpdated: null
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      Authorization: `Bearer ${token}`
    };
  };

  const fetchFinancialData = async (period = 'month') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your financial data');
        setLoading(false);
        return;
      }

      const [insightsResponse, userFinancialResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/insights?period=${period}`, {
          headers: getAuthHeader()
        }),
        axios.get(`${API_BASE_URL}/users/financial-info`, {
          headers: getAuthHeader()
        })
      ]);

      if (!insightsResponse.data || !insightsResponse.data.categories) {
        throw new Error('Invalid financial data received');
      }

      setFinancialData({
        ...insightsResponse.data,
        user: userFinancialResponse.data.data
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setError('Session expired. Please log in again.');
      } else if (err.message === 'No authentication token found') {
        setError('Please log in to view your financial data');
      } else {
        setError('Failed to fetch financial data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchFinancialData();
    } else {
      setLoading(false);
      setError('Please log in to view your financial data');
    }
  }, []);

  return (
    <FinanceContext.Provider value={{
      financialData,
      loading,
      error,
      fetchFinancialData
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
