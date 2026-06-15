import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Configure axios with auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No authentication token found in localStorage');
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

// Get budget overview
export const getBudgetOverview = async () => {
  const response = await axios.get(`${API_BASE_URL}/budgets`, {
    headers: getAuthHeader()
  });
  return response;
};

// Set total budget
export const setTotalBudget = async (amount) => {
  const response = await axios.post(`${API_BASE_URL}/budgets`, { amount }, {
    headers: getAuthHeader()
  });
  return response;
};

// Get all categories
export const getCategories = async () => {
  const response = await axios.get(`${API_BASE_URL}/budgets/categories`, {
    headers: getAuthHeader()
  });
  return response;
};

// Add new category
export const addCategory = async (categoryData) => {
  const response = await axios.post(`${API_BASE_URL}/budgets/categories`, categoryData, {
    headers: getAuthHeader()
  });
  return response;
};

// Update category
export const updateCategory = async (categoryId, categoryData) => {
  const response = await axios.put(`${API_BASE_URL}/budgets/categories/${categoryId}`, categoryData, {
    headers: getAuthHeader()
  });
  return response;
};

// Delete category
export const deleteCategory = async (categoryId) => {
  const response = await axios.delete(`${API_BASE_URL}/budgets/categories/${categoryId}`, {
    headers: getAuthHeader()
  });
  return response;
};

// Add expense to category
export const addExpense = async (categoryId, expenseData) => {
  const response = await axios.post(
    `${API_BASE_URL}/budgets/categories/${categoryId}/expenses`,
    expenseData,
    {
      headers: getAuthHeader()
    }
  );
  return response;
};

// Get category expenses
export const getCategoryExpenses = async (categoryId) => {
  const response = await axios.get(
    `${API_BASE_URL}/budgets/categories/${categoryId}/expenses`,
    {
      headers: getAuthHeader()
    }
  );
  return response;
}; 