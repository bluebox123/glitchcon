import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const Profile = () => {
  const { user } = useAuth();
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
        const response = await axios.get(
          `${API_BASE_URL}/api/users/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setProfile(response.data);
        setUserPosts(response.data.posts || []);
        setFormData({
          username: response.data.username,
          bio: response.data.bio || '',
          avatar_url: response.data.avatar_url || ''
        });
      } catch (error) {
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
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching subscriptions with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get(`${API_BASE_URL}/api/subscribers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Subscriptions response:', response.data);
      
      if (Array.isArray(response.data)) {
        setSubscriptions(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setSubscriptions([]);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Failed to fetch subscriptions. Please try again later.');
      setTimeout(() => setError(''), 3000);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching subscribers with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get(`${API_BASE_URL}/api/subscribers/subscribers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Subscribers response:', response.data);
      
      if (Array.isArray(response.data)) {
        setSubscribers(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setSubscribers([]);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setError('Failed to fetch subscribers. Please try again later.');
      setTimeout(() => setError(''), 3000);
      setSubscribers([]);
    } finally {
      setLoading(false);
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
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setError('Failed to unsubscribe. Please try again.');
      setTimeout(() => setError(''), 3000);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${user.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setProfile(response.data);
      setIsEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
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
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </header>

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
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent font-normal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows="4"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent font-normal text-base leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avatar URL</label>
                    <input
                      type="url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent font-normal"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
                  >
                    Save Changes
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.map((creator) => (
                  <div
                    key={creator.id}
                    className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {creator.avatar_url ? (
                          <img
                            src={creator.avatar_url}
                            alt={creator.username}
                            className="w-12 h-12 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-xl mr-3">
                            <span className="font-medium">{creator.username.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-gray-200 tracking-tight">
                            {creator.username}
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnsubscribe(creator.id)}
                        className="px-3 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-full border border-red-200 transition-colors font-medium"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center">
                      {subscriber.avatar_url ? (
                        <img
                          src={subscriber.avatar_url}
                          alt={subscriber.username}
                          className="w-12 h-12 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-xl mr-3">
                          <span className="font-medium">{subscriber.username.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 tracking-tight">
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