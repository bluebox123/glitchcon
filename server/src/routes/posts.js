const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const auth = require('../middleware/auth');

// Initialize Supabase client with error handling
let supabase;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  throw error;
}

// Get all posts
router.get('/', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
});

// Create post
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, categories, tags } = req.body;
    const userId = req.user.userId;

    const { data: post, error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          content,
          user_id: userId,
          categories: categories || [],
          tags: tags || []
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

// Update post
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, categories, tags } = req.body;
    const userId = req.user.userId;

    // Check if post exists and belongs to user
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (existingPost.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const { data: post, error } = await supabase
      .from('posts')
      .update({
        title,
        content,
        categories: categories || [],
        tags: tags || []
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if post exists and belongs to user
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (existingPost.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
});

// Like post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { error } = await supabase
      .from('likes')
      .insert([
        {
          post_id: req.params.id,
          user_id: userId
        }
      ]);

    if (error) throw error;

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post', error: error.message });
  }
});

// Unlike post
router.delete('/:id/like', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ message: 'Error unliking post', error: error.message });
  }
});

module.exports = router; 