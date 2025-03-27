import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Helper function to determine avatar display properties based on username
const getAvatarProperties = (username) => {
  if (!username) return { fontSize: 'text-lg', bgColor: 'bg-indigo-100', boxWidth: 'w-64' };
  
  const nameLength = username.length;
  
  // Adjust font size based on name length
  let fontSize = 'text-lg';
  if (nameLength > 10) fontSize = 'text-sm';
  else if (nameLength > 6) fontSize = 'text-base';
  else if (nameLength <= 3) fontSize = 'text-xl';
  
  // Choose background color based on first letter to make it more personalized
  const firstChar = username.charAt(0).toLowerCase();
  let bgColor = 'bg-indigo-100';
  
  if ('abcd'.includes(firstChar)) bgColor = 'bg-blue-100 text-blue-600';
  else if ('efghi'.includes(firstChar)) bgColor = 'bg-green-100 text-green-600';
  else if ('jklm'.includes(firstChar)) bgColor = 'bg-yellow-100 text-yellow-600';
  else if ('nopqr'.includes(firstChar)) bgColor = 'bg-purple-100 text-purple-600';
  else if ('stuvw'.includes(firstChar)) bgColor = 'bg-pink-100 text-pink-600';
  else bgColor = 'bg-red-100 text-red-600';
  
  // Calculate box width based on username length
  let boxWidth = 'w-64'; // Default minimum width
  if (nameLength <= 5) boxWidth = 'w-64'; // Minimum width for short names
  else if (nameLength <= 8) boxWidth = 'w-64';
  else if (nameLength <= 12) boxWidth = 'w-72'; 
  else boxWidth = 'w-80';
  
  return { fontSize, bgColor, boxWidth };
};

const AVATAR_OPTIONS = [
  { url: '/woman.png', label: 'Woman 1' },
  { url: '/woman (1).png', label: 'Woman 2' },
  { url: '/man.png', label: 'Man 1' },
  { url: '/man (1).png', label: 'Man 2' },
  { url: '/man (2).png', label: 'Man 3' },
  { url: '/human.png', label: 'Person' },
];

const Profile = () => {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  });
  const [activeTab, setActiveTab] = useState('posts');
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching profile data for user:', user.id);
        const profileResponse = await axios.get(
          `${API_BASE_URL}/api/users/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log('Profile response:', profileResponse.data);
        setProfile(profileResponse.data);
        setUserPosts(profileResponse.data.posts || []);
        setFormData({
          username: profileResponse.data.username,
          bio: profileResponse.data.bio || '',
          avatar_url: profileResponse.data.avatar_url || ''
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError(error.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchBookmarkedPosts = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bookmarked posts');
      const data = await response.json();
      setBookmarkedPosts(data);
    } catch (error) {
      console.error('Error fetching bookmarked posts:', error);
    }
  };

  const fetchSubscriptions = async () => {
    if (!user) return;
    
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('Fetching subscriptions with token:', token ? 'Token exists' : 'No token');
        console.log('Current user ID:', user.id);
        
        const response = await axios.get(`${API_BASE_URL}/api/subscribers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Subscriptions response:', response.data);
        
        if (Array.isArray(response.data)) {
          setSubscriptions(response.data);
          // Clear any previous errors
          setError('');
          break; // Success, exit the retry loop
        } else {
          console.error('Unexpected response format:', response.data);
          setSubscriptions([]);
          setError('Received unexpected data format from server');
          setTimeout(() => setError(''), 3000);
        }
      } catch (error) {
        attempts++;
        console.error(`Error fetching subscriptions (attempt ${attempts}/${maxAttempts}):`, error);
        
        // Provide more specific error information
        const errorMessage = error.response?.data?.message || 
                            'Failed to fetch subscriptions. Please try again later.';
        
        // Only set error on final attempt or if it's a 4xx error (client error)
        if (attempts >= maxAttempts || (error.response && error.response.status >= 400 && error.response.status < 500)) {
          setError(errorMessage);
          setTimeout(() => setError(''), 5000);
        }
        
        // If it's not the last attempt, add a small delay before retrying
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchSubscribers = async () => {
    if (!user) return;
    
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('Fetching subscribers with token:', token ? 'Token exists' : 'No token');
        console.log('Current user ID:', user.id);
        
        const response = await axios.get(`${API_BASE_URL}/api/subscribers/subscribers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Subscribers response:', response.data);
        
        if (Array.isArray(response.data)) {
          setSubscribers(response.data);
          // Clear any previous errors
          setError('');
          break; // Success, exit the retry loop
        } else {
          console.error('Unexpected response format:', response.data);
          setSubscribers([]);
          setError('Received unexpected data format from server');
          setTimeout(() => setError(''), 3000);
        }
      } catch (error) {
        attempts++;
        console.error(`Error fetching subscribers (attempt ${attempts}/${maxAttempts}):`, error);
        
        // Provide more specific error information
        const errorMessage = error.response?.data?.message || 
                            'Failed to fetch subscribers. Please try again later.';
        
        // Only set error on final attempt or if it's a 4xx error (client error)
        if (attempts >= maxAttempts || (error.response && error.response.status >= 400 && error.response.status < 500)) {
          setError(errorMessage);
          setTimeout(() => setError(''), 5000);
        }
        
        // If it's not the last attempt, add a small delay before retrying
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUnsubscribe = async (creatorId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Unsubscribing from creator:', creatorId);
      
      const response = await axios.delete(`${API_BASE_URL}/api/subscribers/${creatorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Unsubscribe response:', response.data);
      
      // Update the subscriptions list by removing the unsubscribed creator
      setSubscriptions(subscriptions.filter(sub => sub.id !== creatorId));
      
      // Show success message
      setError('Unsubscribed successfully');
      setTimeout(() => setError(''), 1500);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setError('Failed to unsubscribe. Please try again.');
      setTimeout(() => setError(''), 1500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'bookmarks') {
          await fetchBookmarkedPosts();
        } else if (activeTab === 'subscriptions') {
          await fetchSubscriptions();
        } else if (activeTab === 'subscribers') {
          await fetchSubscribers();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // Validate the form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username?.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (formData.bio?.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // Use userId from the URL parameter for the update
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${user.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state with the response data
      setProfile(prevProfile => ({
        ...prevProfile,
        ...response.data
      }));
      
      setIsEditing(false);
      
      // Show success message
      setError('Profile updated successfully');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(
        error.response?.data?.message || 
        'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add handleDeleteAccount function
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== profile.username) {
      setError('Please type your username correctly to confirm deletion');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      setIsDeleteLoading(true);
      await deleteAccount();
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(error.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Profile</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
              {!isEditing && (
                <button
                  onClick={() => setIsDeleting(true)}
                  className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Delete account confirmation modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Delete Account</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This action <span className="font-bold">cannot be undone</span>. All of your data will be permanently deleted.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              To confirm, please type your username: <span className="font-medium">{profile.username}</span>
            </p>
            <input 
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent mb-4"
              placeholder="Enter your username"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleting(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                disabled={isDeleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium flex items-center"
                disabled={isDeleteLoading || deleteConfirmation !== profile.username}
              >
                {isDeleteLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${validationErrors.username ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent font-normal`}
                      required
                    />
                    {validationErrors.username && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.username}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows="4"
                      className={`w-full px-4 py-2 rounded-lg border ${validationErrors.bio ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent font-normal text-base leading-relaxed`}
                    />
                    {validationErrors.bio && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.bio}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formData.bio?.length || 0}/500 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choose Avatar</label>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {AVATAR_OPTIONS.map((avatar) => (
                        <div
                          key={avatar.url}
                          onClick={() => setFormData({ ...formData, avatar_url: avatar.url })}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            formData.avatar_url === avatar.url
                              ? 'border-indigo-500 shadow-lg scale-105'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.label}
                            className="w-full h-auto"
                          />
                          {formData.avatar_url === avatar.url && (
                            <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click on an avatar to select it</p>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-20 h-20 rounded-full"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-2xl text-white font-medium">
                          {profile.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{profile.username}</h3>
                      <p className="text-gray-600 dark:text-gray-400 font-normal">{profile.email}</p>
                    </div>
                  </div>
                  {profile.bio && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Bio</h4>
                      <p className="mt-1 text-gray-600 dark:text-gray-400 font-normal leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Member Since</h4>
                    <p className="mt-1 text-gray-600 dark:text-gray-400 font-normal">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Posts and Bookmarks Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`${
                      activeTab === 'posts'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium tracking-wide text-sm`}
                  >
                    My Posts
                  </button>
                  <button
                    onClick={() => setActiveTab('bookmarks')}
                    className={`${
                      activeTab === 'bookmarks'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium tracking-wide text-sm`}
                  >
                    Bookmarks
                  </button>
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`${
                      activeTab === 'subscriptions'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium tracking-wide text-sm`}
                  >
                    Subscriptions
                  </button>
                  <button
                    onClick={() => setActiveTab('subscribers')}
                    className={`${
                      activeTab === 'subscribers'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium tracking-wide text-sm`}
                  >
                    Subscribers
                  </button>
                </nav>
              </div>
            </div>

            {activeTab === 'posts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/40 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
                  >
                    {/* Random gradient background */}
                    <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-light">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 tracking-tight line-clamp-2">
                        {post.title}
                      </h3>
                    </div>
                  </Link>
                ))}
                {userPosts.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 font-normal">No posts yet</p>
                    <Link
                      to="/create-post"
                      className="mt-4 inline-block px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
                    >
                      Create Your First Post
                    </Link>
                  </div>
                )}
              </div>
            ) : activeTab === 'bookmarks' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookmarkedPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/40 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="p-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-light">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 tracking-tight line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-3 font-normal leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  </Link>
                ))}
                {bookmarkedPosts.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 font-normal">No bookmarked posts yet</p>
                    <Link
                      to="/"
                      className="mt-4 inline-block px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
                    >
                      Browse Posts
                    </Link>
                  </div>
                )}
              </div>
            ) : activeTab === 'subscriptions' ? (
              <div className="flex flex-wrap gap-6">
                {subscriptions.map((creator) => (
                  <div
                    key={creator.id}
                    className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow ${getAvatarProperties(creator.username).boxWidth}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center min-w-0 flex-1">
                        {creator.avatar_url ? (
                          <img
                            src={creator.avatar_url}
                            alt={creator.username}
                            className="w-12 h-12 rounded-full mr-3 flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${getAvatarProperties(creator.username).bgColor}`}>
                            <span className={`font-medium ${getAvatarProperties(creator.username).fontSize}`}>
                              {creator.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-800 dark:text-gray-200 tracking-tight truncate">
                            {creator.username}
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnsubscribe(creator.id);
                        }}
                        className="px-3 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-full border border-red-200 transition-colors font-medium flex-shrink-0"
                      >
                        Unsubscribe
                      </button>
                    </div>
                  </div>
                ))}
                {subscriptions.length === 0 && (
                  <div className="col-span-3 text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 font-normal">You haven't subscribed to any creators yet</p>
                    <Link
                      to="/"
                      className="mt-4 inline-block px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
                    >
                      Discover Creators
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-6">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow ${getAvatarProperties(subscriber.username).boxWidth}`}
                  >
                    <div className="flex items-center min-w-0">
                      {subscriber.avatar_url ? (
                        <img
                          src={subscriber.avatar_url}
                          alt={subscriber.username}
                          className="w-12 h-12 rounded-full mr-3 flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${getAvatarProperties(subscriber.username).bgColor}`}>
                          <span className={`font-medium ${getAvatarProperties(subscriber.username).fontSize}`}>
                            {subscriber.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 tracking-tight truncate">
                          {subscriber.username}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
                {subscribers.length === 0 && (
                  <div className="col-span-3 text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 font-normal">You don't have any subscribers yet</p>
                    <p className="text-gray-600 dark:text-gray-400 font-normal mt-2">
                      Create engaging content to attract subscribers!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile; 