import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from '@react-oauth/google';
import axios from "axios";
import './LoginForm.css';
import { toast } from "react-toastify";
import { FcGoogle } from 'react-icons/fc';

const API_BASE_URL = 'http://localhost:5000/api';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Get user info from Google
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );

        // Send the Google user info to your backend
        const backendResponse = await axios.post(`${API_BASE_URL}/users/google-auth`, {
          email: userInfo.data.email,
          firstName: userInfo.data.given_name,
          lastName: userInfo.data.family_name,
          picture: userInfo.data.picture,
        });

        // Store the JWT token and user info
        localStorage.setItem('token', backendResponse.data.token);
        localStorage.setItem('user', JSON.stringify(backendResponse.data.user));
        localStorage.setItem('currentUser', backendResponse.data.user.firstName);

        toast.success('Successfully logged in with Google!');
        navigate('/');
      } catch (error) {
        const message = error.response?.data?.message || 'Google login failed. Please try again.';
        toast.error(message);
        setErrors({ general: message });
      }
    },
    onError: () => {
      toast.error('Google login failed. Please try again.');
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, formData);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('currentUser', response.data.user.firstName);
        
        toast.success('Successfully logged in!');
        navigate('/');
      } catch (error) {
        const message = error.response?.data?.message || 'Login failed. Please try again.';
        toast.error(message);
        setErrors({ general: message });
      }
    }
  };

  return (
    <div className="login-container">
      <div className="wrapper">
        <h1>Hello Again!</h1>
        <p>Welcome back you've <br /> been missed!</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input 
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div className="input-group">
            <input 
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          {errors.general && <div className="error-message">{errors.general}</div>}
          <p className="recover">
            <a href="#" onClick={(e) => {
              e.preventDefault();
              // Add password recovery logic here
            }}>Recover Password</a>
          </p>
          <button type="submit">Sign in</button>
        </form>
        <p className="or">----- or continue with -----</p>
        <div className="social-login">
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="google-login-btn"
          >
            <FcGoogle size={20} />
            <span>Continue with Google</span>
          </button>
        </div>
        <div className="not-member">
          Not a member? <a href="#" onClick={(e) => {
            e.preventDefault();
            navigate('/register');
          }}>Register Now</a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;