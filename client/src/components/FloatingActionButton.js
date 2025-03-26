import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FloatingActionButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Don't show FAB on login, register, or create-post pages
  const hiddenPaths = ['/login', '/register', '/create-post'];
  if (hiddenPaths.includes(location.pathname) || !user) {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/create-post')}
      className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 dark:bg-indigo-500 rounded-full shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 flex items-center justify-center group z-50"
      aria-label="Create new post"
    >
      <svg
        className="w-8 h-8 text-white transform group-hover:scale-110 transition-transform duration-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      
      {/* Tooltip */}
      <span className="absolute right-16 bg-gray-900 dark:bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Create Post
      </span>
    </button>
  );
};

export default FloatingActionButton; 