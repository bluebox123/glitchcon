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

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        users (
          username,
          avatar_url
        )
      `)
      .eq('post_id', req.params.postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { post_id, content } = req.body;
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id,
          content,
          user_id: req.user.userId,
          created_at: new Date().toISOString()
        }
      ])
      .select(`
        *,
        users (
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update comment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    // Check if comment exists and belongs to user
    const { data: existingComment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (existingComment.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select(`
        *,
        users (
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if comment exists and belongs to user
    const { data: existingComment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (existingComment.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 