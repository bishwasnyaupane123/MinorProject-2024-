import React, { useState } from "react";
import { FaHome, FaBullseye, FaDollarSign, FaCreditCard, FaBell, FaBrain, FaBars, FaTimes, FaPiggyBank } from "react-icons/fa";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = (path) => {
    console.log("Navigating to:", path);
    navigate(path);
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
        {!isCollapsed && <h2 className="sidebar-title">Dashboard</h2>}
      </div>

      <ul className="sidebar-menu">
        <SidebarItem 
          icon={<FaHome />} 
          text="Home" 
          isCollapsed={isCollapsed} 
          onClick={() => handleItemClick('/')}
          active={window.location.pathname === '/'}
        />
        <SidebarItem 
          icon={<FaBullseye />} 
          text="Budget Management" 
          isCollapsed={isCollapsed} 
          onClick={() => handleItemClick('/budget')}
          active={window.location.pathname === '/budget'}
        />
         <SidebarItem 
          icon={<FaPiggyBank />} 
          text="Goal Setting & Saving" 
          isCollapsed={isCollapsed} 
          onClick={() => handleItemClick('/goals')}
          active={window.location.pathname === '/goals'}
        />
        <SidebarItem 
          icon={<FaDollarSign />} 
          text="Debt Management" 
          isCollapsed={isCollapsed} 
          onClick={() => handleItemClick('/debt')}
          active={window.location.pathname === '/debt'}
        />
        <SidebarItem 
          icon={<FaCreditCard />} 
          text="Bill Reminder & Payment" 
          isCollapsed={isCollapsed} 
          onClick={() => handleItemClick('/bills')}
          active={window.location.pathname === '/bills'}
        />
        <SidebarItem 
          icon={<FaBrain />} 
          text="AI Insights & Saving" 
          isCollapsed={isCollapsed} 
          onClick={() => handleItemClick('/insights')}
          active={window.location.pathname === '/insights'}
        />
      </ul>
    </div>
  );
};

const SidebarItem = ({ icon, text, isCollapsed, onClick, active }) => (
  <li 
    className={`sidebar-item ${active ? 'active' : ''}`} 
    onClick={onClick} 
    style={{ cursor: 'pointer' }}
  >
    {icon}
    {!isCollapsed && <span>{text}</span>}
  </li>
);

export default Sidebar;