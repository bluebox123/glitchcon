import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const PostCard = ({ post }) => {
  const {
    id,
    title,
    content,
    created_at,
    likes_count = 0,
    views_count = 0,
    user = {},
    category = ''
  } = post;

  return (
    <div className="flex flex-col bg-[#111111] hover:bg-[#1a1a1a] transition-colors duration-200 p-6">
      {/* User Info and Date */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <img 
            src={user.avatar_url || '/default-avatar.png'} 
            alt={user.username}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-[15px] text-white font-medium">{user.username || 'Anonymous'}</span>
            <span className="text-sm text-gray-500">
              {format(new Date(created_at), 'MMMM d, yyyy')}
            </span>
          </div>
        </div>
        {category && (
          <span className="px-3 py-1 text-sm bg-[#1a1a1a] text-gray-400 rounded-full">
            {category}
          </span>
        )}
      </div>

      {/* Content */}
      <Link to={`/post/${id}`} className="group">
        <h2 className="text-2xl font-semibold text-white mb-3 group-hover:text-gray-300 transition-colors">
          {title}
        </h2>
        <p className="text-gray-400 text-[15px] leading-relaxed mb-6">
          {content?.substring(0, 120)}...
        </p>
      </Link>

      {/* Stats */}
      <div className="flex items-center space-x-6 text-gray-400">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm">{likes_count}</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-sm">{views_count}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard; 