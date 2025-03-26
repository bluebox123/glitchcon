const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabaseClient');
const authenticateToken = require('../middleware/auth');

// Get all bookmarks for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select(`
        post_id,
        posts (
          id,
          title,
          content,
          created_at,
          user_id,
          tags,
          categories
        )
      `)
      .eq('user_id', req.user.userId);

    if (error) throw error;

    res.json(bookmarks.map(b => b.posts));
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Error fetching bookmarks' });
  }
});

// Check if a post is bookmarked by the current user
router.get('/:postId', authenticateToken, async (req, res) => {
  try {
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', req.user.userId)
      .eq('post_id', req.params.postId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    res.status(500).json({ message: 'Error checking bookmark status' });
  }
});

// Toggle bookmark (add/remove)
router.post('/:postId', authenticateToken, async (req, res) => {
  try {
    // First check if bookmark exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', req.user.userId)
      .eq('post_id', req.params.postId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingBookmark) {
      // If bookmark exists, remove it
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', req.user.userId)
        .eq('post_id', req.params.postId);

      if (deleteError) throw deleteError;
      return res.json({ message: 'Bookmark removed successfully', isBookmarked: false });
    } else {
      // If bookmark doesn't exist, add it
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert([
          { 
            user_id: req.user.userId, 
            post_id: req.params.postId
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          return res.status(400).json({ message: 'Post already bookmarked' });
        }
        throw insertError;
      }

      return res.json({ message: 'Post bookmarked successfully', isBookmarked: true });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Error toggling bookmark' });
  }
});

// Remove a bookmark
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', req.user.userId)
      .eq('post_id', req.params.postId);

    if (error) throw error;

    return res.json({ message: 'Bookmark removed successfully', isBookmarked: false });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Error removing bookmark' });
  }
});

module.exports = router; 