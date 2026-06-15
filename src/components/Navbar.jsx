import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';

  return (
    <nav className="navbar">
      <div className="nav-left">
        <h1 className="nav-logo">AI POWERED PERSONAL FINANCE ASSISTANT</h1>
        <ul className="nav-links">
          <li>
            <Link 
              to="/" 
              className={window.location.pathname === '/' ? 'active' : ''}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/services" 
              className={window.location.pathname === '/services' ? 'active' : ''}
            >
              Services
            </Link>
          </li>
          <li>
            <Link 
              to="/about" 
              className={window.location.pathname === '/about' ? 'active' : ''}
            >
              About
            </Link>
          </li>
        </ul>
      </div>
      <div className="nav-right">
        <div className="profile-menu" onClick={() => setShowDropdown(!showDropdown)}>
          <FaUser />
          <span>{displayName}</span>
          {showDropdown && (
            <div className="dropdown-menu">
              <Link to="/profile">{<b>PROFILE</b>}</Link>
              {/* <Link to="/settings">SETTINGS</Link> */}
              <button onClick={handleLogout}>{<b>LOGOUT</b>}</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;