import React from 'react';
import { FaUsers, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import './About.css';

const About = () => {
  const team = [
    {
      id: 1,
      name: 'Bishwas Nyaupane',
      role: 'Financial Advisor',
      image: '/path/to/sarah.jpg',
      description: 'Expert in personal finance with 10+ years of experience.'
    },
    {
      id: 2,
      name: 'Pawan Ghimire',
      role: 'Software Engineer',
      image: '/path/to/michael.jpg',
      description: 'Specialized in financial technology and security.'
    },
    {
      id: 3,
      name: 'Kuldeep Acharya',
      role: 'Data Analyst',
      image: '/path/to/emma.jpg',
      description: 'Expert in financial data analysis and visualization.'
    },
    {
      id: 4,
      name: 'Prabhat pokhrel',
      role: 'cook',
      image: '/path/to/emma.jpg',
      description: 'Expert in masu bhat.'
    }
  ];

  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About Finance Assistance</h1>
        <p>Your trusted partner in personal financial management</p>
      </div>

      <div className="mission-section">
        <h2>Our Mission</h2>
        <p>
          We strive to empower individuals with the tools and knowledge they need
          to make informed financial decisions and achieve their financial goals.
        </p>
      </div>

      <div className="values-grid">
        <div className="value-card">
          <FaUsers className="value-icon" />
          <h3>User-Focused</h3>
          <p>We put our users first in everything we do, ensuring our tools are accessible and easy to use.</p>
        </div>
        <div className="value-card">
          <FaChartLine className="value-icon" />
          <h3>Innovation</h3>
          <p>We continuously innovate to provide cutting-edge financial management solutions.</p>
        </div>
        <div className="value-card">
          <FaShieldAlt className="value-icon" />
          <h3>Security</h3>
          <p>Your financial data security is our top priority, with bank-level encryption.</p>
        </div>
      </div>

      <div className="team-section">
        <h2>Our Team</h2>
        <div className="team-grid">
          {team.map(member => (
            <div key={member.id} className="team-card">
              <div className="member-image">
                <img src={member.image} alt={member.name} />
              </div>
              <h3>{member.name}</h3>
              <p className="member-role">{member.role}</p>
              <p className="member-description">{member.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3>10K+</h3>
          <p>Active Users</p>
        </div>
        <div className="stat-card">
          <h3>$50M+</h3>
          <p>Managed Budget</p>
        </div>
        <div className="stat-card">
          <h3>95%</h3>
          <p>User Satisfaction</p>
        </div>
      </div>

      <div className="contact-section">
        <h2>Get in Touch</h2>
        <p>Have questions? We're here to help!</p>
        <div className="contact-info">
          <p>Email:tntpawan416@gmail.com</p>
          <p>Phone: (+977) 9843021819</p>
          <p>Address:chakupat,lalitpur</p>
        </div>
      </div>
    </div>
  );
};

export default About;