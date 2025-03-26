const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

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

module.exports = router; 