import React from 'react';
import { FaChartLine, FaBell, FaPiggyBank, FaLock, FaRobot, FaChartPie } from 'react-icons/fa';
import './Service.css';

const Service = () => {
  const services = [
    {
      id: 1,
      icon: <FaChartLine />,
      title: 'Budget Management',
      description: 'Set and track your budgets across different categories. Get real-time updates on your spending patterns and receive alerts when approaching limits.',
      features: [
        'Custom budget categories',
        'Spending analytics',
        'Budget alerts',
        'Monthly reports'
      ]
    },
    {
      id: 2,
      icon: <FaBell />,
      title: 'Bill Reminders',
      description: 'Never miss a payment with our smart bill reminder system. Schedule payments and get notified before due dates.',
      features: [
        'Payment scheduling',
        'Due date reminders',
        'Payment history',
        'Recurring bills'
      ]
    },
    {
      id: 3,
      icon: <FaPiggyBank />,
      title: 'Goal Setting',
      description: 'Set financial goals and track your progress. Whether it is saving for a vacation or buying a house, we help you stay on track.',
      features: [
        'Goal tracking',
        'Progress visualization',
        'Milestone alerts',
        'Achievement rewards'
      ]
    },
    {
      id: 4,
      icon: <FaLock />,
      title: 'Debt Management',
      description: 'Take control of your debts with our comprehensive debt management tools. Track multiple debts and plan your payoff strategy.',
      features: [
        'Debt tracking',
        'Payment planning',
        'Interest calculations',
        'Payoff strategies'
      ]
    },
    {
      id: 5,
      icon: <FaRobot />,
      title: 'AI Insights',
      description: 'Get personalized financial insights powered by AI. Understand your spending patterns and receive tailored recommendations.',
      features: [
        'Spending analysis',
        'Custom recommendations',
        'Trend detection',
        'Smart alerts'
      ]
    },
    {
      id: 6,
      icon: <FaChartPie />,
      title: 'Financial Reports',
      description: 'Access detailed financial reports and visualizations. Understand your financial health with comprehensive analytics.',
      features: [
        'Monthly summaries',
        'Custom reports',
        'Data visualization',
        'Export options'
      ]
    }
  ];

  return (
    <div className="service-page">
      <div className="service-header">
        <h1>Our Services</h1>
        <p>Comprehensive financial management tools to help you achieve your goals</p>
      </div>

      <div className="services-grid">
        {services.map(service => (
          <div key={service.id} className="service-card">
            <div className="service-icon">
              {service.icon}
            </div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <div className="features-list">
              <h4>Key Features:</h4>
              <ul>
                {service.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="cta-section">
        <h2>Ready to Take Control of Your Finances?</h2>
        <p>Start using our tools today and make smarter financial decisions.</p>
        <button className="cta-button">Get Started Now</button>
      </div>
    </div>
  );
};

export default Service;