const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        avatar_url,
        bio,
        created_at,
        posts (
          id,
          title,
          created_at
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, bio, avatar_url } = req.body;
    const { data: user, error } = await supabase
      .from('users')
      .update({
        username,
        bio,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/:userId/avatar', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: user, error } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user avatar:', error);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ avatar_url: user.avatar_url });
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    res.status(500).json({ message: 'Server error' });
  }
}); 

// Get user's posts
router.get('/:id/posts', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (
          username,
          avatar_url
        )
      `)
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's liked posts
router.get('/:id/likes', authenticateToken, async (req, res) => {
  try {
    const { data: likedPosts, error } = await supabase
      .from('likes')
      .select(`
        posts (
          *,
          users (
            username,
            avatar_url
          )
        )
      `)
      .eq('user_id', req.params.id);

    if (error) throw error;
    res.json(likedPosts.map(like => like.posts));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's comments
router.get('/:id/comments', async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        posts (
          id,
          title
        ),
        users (
          username,
          avatar_url
        )
      `)
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    // Get user info from supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, created_at, bio')
      .eq('id', req.params.userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Error fetching user' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, content, created_at, tags, categories')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching user posts:', postsError);
      return res.status(500).json({ message: 'Error fetching user posts' });
    }

    // Return combined user and posts info
    res.json({
      ...user,
      posts: posts || []
    });
  } catch (error) {
    console.error('Error in get user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user account
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user.userId || req.user.id;
    
    // Verify user is updating their own account
    if (userId !== loggedInUserId) {
      return res.status(403).json({ message: 'You can only update your own account' });
    }
    
    const { username, bio, avatar_url } = req.body;
    
    // Validate input
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    // Check if username is already taken (if changing username)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking username:', checkError);
      throw checkError;
    }
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }
    
    // Update user in database
    const { data, error } = await supabase
      .from('users')
      .update({
        username,
        bio: bio || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete user account
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user.userId || req.user.id;
    
    // Verify user is deleting their own account
    if (userId !== loggedInUserId) {
      return res.status(403).json({ message: 'You can only delete your own account' });
    }
    
    console.log(`Deleting user account: ${userId}`);
    
    // Begin a transaction (we'll use multiple related operations)
    // 1. Delete user's posts
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .eq('user_id', userId);
      
    if (postsError) {
      console.error('Error deleting posts:', postsError);
      throw postsError;
    }
    
    // 2. Delete user's likes
    const { error: likesError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId);
      
    if (likesError) {
      console.error('Error deleting likes:', likesError);
      throw likesError;
    }
    
    // 3. Delete user's comments
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('user_id', userId);
      
    if (commentsError) {
      console.error('Error deleting comments:', commentsError);
      throw commentsError;
    }
    
    // 4. Delete user's bookmarks
    const { error: bookmarksError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId);
      
    if (bookmarksError) {
      console.error('Error deleting bookmarks:', bookmarksError);
      throw bookmarksError;
    }
    
    // 5. Delete user's subscriptions and subscribers
    const { error: subscribersError } = await supabase
      .from('subscribers')
      .delete()
      .or(`subscriber_id.eq.${userId},creator_id.eq.${userId}`);
      
    if (subscribersError) {
      console.error('Error deleting subscribers:', subscribersError);
      throw subscribersError;
    }
    
    // 6. Delete the user from the users table
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (userError) {
      console.error('Error deleting user:', userError);
      throw userError;
    }
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

module.exports = router; 