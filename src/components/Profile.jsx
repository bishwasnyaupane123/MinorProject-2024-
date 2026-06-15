import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaEnvelope, FaLock, FaBell, FaPalette, FaCog, FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Profile.css';

const Profile = () => {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: 'https://via.placeholder.com/150'
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    billReminders: true,
    darkMode: false,
    currency: 'USD',
    language: 'English'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profileData);
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setEditedProfile({
          ...editedProfile,
          avatar: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setProfileData(editedProfile);
      setIsEditing(false);
      setLoading(false);
      toast.success('Profile updated successfully!');
    }, 1000);
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    toast.success(`${setting} updated successfully!`);
  };

  return (
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="profile-avatar-container">
          <div className="profile-avatar" onClick={handleImageClick}>
            <img 
              src={previewImage || profileData.avatar} 
              alt="Profile" 
              className="avatar-image"
            />
            <div className="avatar-overlay">
              <FaCamera className="camera-icon" />
              <span>Change Photo</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <h2>{`${profileData.firstName} ${profileData.lastName}`}</h2>
          <p>{profileData.email}</p>
        </div>

        <div className="profile-nav">
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser /> Profile
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCog /> Settings
          </button>
        </div>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' ? (
          <div className="profile-details">
            <div className="section-header">
              <h2>Profile Information</h2>
              <button 
                className="edit-button"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editedProfile.firstName}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      firstName: e.target.value
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editedProfile.lastName}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      lastName: e.target.value
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      email: e.target.value
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      phone: e.target.value
                    })}
                  />
                </div>

                <button 
                  type="submit" 
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-item">
                  <label>First Name</label>
                  <p>{profileData.firstName}</p>
                </div>
                <div className="info-item">
                  <label>Last Name</label>
                  <p>{profileData.lastName}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{profileData.email}</p>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <p>{profileData.phone}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="settings-details">
            <h2>Settings</h2>

            <div className="settings-section">
              <h3><FaBell /> Notifications</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <label>Email Notifications</label>
                  <p>Receive bill reminders via email</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Push Notifications</label>
                  <p>Receive push notifications</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Bill Reminders</label>
                  <p>Get reminded before bills are due</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.billReminders}
                    onChange={(e) => handleSettingChange('billReminders', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3><FaPalette /> Preferences</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <label>Dark Mode</label>
                  <p>Switch between light and dark theme</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Currency</label>
                  <p>Select your preferred currency</p>
                </div>
                <select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  className="settings-select"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Language</label>
                  <p>Choose your preferred language</p>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="settings-select"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;