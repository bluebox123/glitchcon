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

// Get users who liked the post
router.get('/:id/likes', async (req, res) => {
  try {
    const { data: likes, error } = await supabase
      .from('likes')
      .select('user_id')
      .eq('post_id', req.params.id);

    if (error) throw error;

    // Extract user_ids from the likes array
    const userIds = likes.map(like => like.user_id);
    res.json(userIds);
  } catch (error) {
    console.error('Error getting likes:', error);
    res.status(500).json({ message: 'Error getting likes', error: error.message });
  }
});

// Get count of likes for a post
router.get('/:id/likes/count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', req.params.id);

    if (error) throw error;

    res.json(count || 0);
  } catch (error) {
    console.error('Error getting likes count:', error);
    res.status(500).json({ message: 'Error getting likes count', error: error.message });
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // First check if the user has already liked the post
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw checkError;
    }

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', req.params.id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      
      // Get updated list of users who liked the post
      const { data: updatedLikes, error: likesError } = await supabase
        .from('likes')
        .select('user_id')
        .eq('post_id', req.params.id);

      if (likesError) throw likesError;
      
      res.json({ 
        message: 'Post unliked successfully',
        likes: updatedLikes.map(like => like.user_id)
      });
    } else {
      // Like the post
      const { error: insertError } = await supabase
        .from('likes')
        .insert([
          {
            post_id: req.params.id,
            user_id: userId
          }
        ]);

      if (insertError) throw insertError;
      
      // Get updated list of users who liked the post
      const { data: updatedLikes, error: likesError } = await supabase
        .from('likes')
        .select('user_id')
        .eq('post_id', req.params.id);

      if (likesError) throw likesError;
      
      res.json({ 
        message: 'Post liked successfully',
        likes: updatedLikes.map(like => like.user_id)
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
});

module.exports = router; 