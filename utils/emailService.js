const nodemailer = require('nodemailer');

// Create transporter with configuration
const createTransporter = async () => {
  try {
    // For production, use Gmail
    if (process.env.NODE_ENV === 'production') {
      console.log('Creating Gmail transporter with config:', {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          // Don't log the password for security
          pass: '****'
        }
      });

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('Verifying Gmail connection...');
      try {
        await transporter.verify();
        console.log('Gmail connection verified successfully');
      } catch (verifyError) {
        console.error('Gmail verification failed:', verifyError);
        throw verifyError;
      }
      return transporter;
    }
    
    // For development, use Ethereal test account
    console.log('Creating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
};

// Send bill reminder email
const sendBillReminder = async (userEmail, bills) => {
  try {
    console.log('Starting to send bill reminder email to:', userEmail);
    console.log('Number of bills:', bills.length);
    
    const transporter = await createTransporter();

    // Group bills by their status (due soon or overdue)
    const dueSoonBills = bills.filter(bill => {
      const daysUntilDue = Math.ceil((new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      const isDueSoon = !bill.paid && daysUntilDue <= 3 && daysUntilDue >= 0;
      console.log(`Bill ${bill.name}: ${daysUntilDue} days until due, isDueSoon: ${isDueSoon}`);
      return isDueSoon;
    });

    const overdueBills = bills.filter(bill => {
      const daysUntilDue = Math.ceil((new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      const isOverdue = !bill.paid && daysUntilDue < 0;
      console.log(`Bill ${bill.name}: ${daysUntilDue} days until due, isOverdue: ${isOverdue}`);
      return isOverdue;
    });

    console.log(`Found ${dueSoonBills.length} due soon bills and ${overdueBills.length} overdue bills`);

    if (dueSoonBills.length === 0 && overdueBills.length === 0) {
      console.log('No bills to send notifications for');
      return;
    }

    // Create email content
    let emailContent = '<h2>Bill Payment Reminder</h2>';

    if (dueSoonBills.length > 0) {
      emailContent += '<h3>⚠️ Bills Due Soon</h3>';
      emailContent += '<ul style="list-style: none; padding: 0;">';
      dueSoonBills.forEach(bill => {
        const daysUntilDue = Math.ceil((new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        emailContent += `
          <li style="margin-bottom: 15px; padding: 10px; border: 1px solid #ffd700; border-radius: 5px; background-color: #fff3cd;">
            <strong style="font-size: 16px;">${bill.name}</strong>
            <br>Amount: <span style="color: #856404;">Rs. ${bill.amount.toLocaleString()}</span>
            <br>Due in: <span style="color: #856404;">${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}</span>
            <br>Due Date: ${new Date(bill.dueDate).toLocaleDateString()}
          </li>
        `;
      });
      emailContent += '</ul>';
    }

    if (overdueBills.length > 0) {
      emailContent += '<h3>🚨 Overdue Bills</h3>';
      emailContent += '<ul style="list-style: none; padding: 0;">';
      overdueBills.forEach(bill => {
        const daysOverdue = Math.abs(Math.ceil((new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24)));
        emailContent += `
          <li style="margin-bottom: 15px; padding: 10px; border: 1px solid #dc3545; border-radius: 5px; background-color: #f8d7da;">
            <strong style="font-size: 16px;">${bill.name}</strong>
            <br>Amount: <span style="color: #721c24;">Rs. ${bill.amount.toLocaleString()}</span>
            <br>Overdue by: <span style="color: #721c24;">${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}</span>
            <br>Due Date: ${new Date(bill.dueDate).toLocaleDateString()}
          </li>
        `;
      });
      emailContent += '</ul>';
    }

    // Add footer
    emailContent += `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        <p>This is an automated message from your Finance Assistant.</p>
        <p>You received this email because you have enabled bill reminders in your settings.</p>
      </div>
    `;

    console.log('Preparing to send email with the following details:');
    console.log('From:', '"Finance Assistant" <finance-assistant@example.com>');
    console.log('To:', userEmail);
    console.log('Subject:', '🔔 Bill Payment Reminder');
    
    // Send email
    const info = await transporter.sendMail({
      from: '"Finance Assistant" <finance-assistant@example.com>',
      to: userEmail,
      subject: '🔔 Bill Payment Reminder',
      html: emailContent
    });

    console.log('Email sent successfully:', info.messageId);
    console.log('Full email response:', info);

    // For development, log the test email URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error('Error sending bill reminder email:', error);
    throw error;
  }
};

module.exports = {
  sendBillReminder
};
