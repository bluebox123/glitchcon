const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabaseClient');
const authenticateToken = require('../middleware/auth');

// Get all subscriptions for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching subscriptions for user:', req.user.id);
    
    const { data: subscriptions, error } = await supabase
      .from('subscribers')
      .select(`
        creator_id,
        creators:creator_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('subscriber_id', req.user.userId);

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions`);
    
    // Handle null or empty subscriptions array
    if (!subscriptions || subscriptions.length === 0) {
      return res.json([]);
    }
    
    // Filter out any items that might have null creators
    const validSubscriptions = subscriptions
      .filter(s => s.creators)
      .map(s => s.creators);
      
    console.log('Returning subscription data:', validSubscriptions);
    res.json(validSubscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

// Get all subscribers for the current user
router.get('/subscribers', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching subscribers for user:', req.user.userId);
    
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select(`
        subscriber_id,
        subscribers:subscriber_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('creator_id', req.user.userId);

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }

    console.log(`Found ${subscribers?.length || 0} subscribers`);
    
    // Handle null or empty subscribers array
    if (!subscribers || subscribers.length === 0) {
      return res.json([]);
    }
    
    // Filter out any items that might have null subscribers
    const validSubscribers = subscribers
      .filter(s => s.subscribers)
      .map(s => s.subscribers);
      
    console.log('Returning subscriber data:', validSubscribers);
    res.json(validSubscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

// Check if the current user is subscribed to a specific creator
router.get('/:creatorId', authenticateToken, async (req, res) => {
  try {
    console.log('Checking subscription status for user:', req.user.userId, 'to creator:', req.params.creatorId);
    
    // Validate IDs format if needed
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.creatorId)) {
      console.warn('Invalid creator ID format:', req.params.creatorId);
      // Continue anyway
    }
    
    const { data: subscription, error } = await supabase
      .from('subscribers')
      .select('id')
      .eq('subscriber_id', req.user.userId)
      .eq('creator_id', req.params.creatorId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is valid for our case
      console.error('Supabase error details:', error);
      throw error;
    }

    const isSubscribed = !!subscription;
    console.log('Subscription status result:', isSubscribed);
    
    res.json({ isSubscribed });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ message: 'Error checking subscription status' });
  }
});

// Get subscriber count for a specific creator
router.get('/:creatorId/count', async (req, res) => {
  try {
    console.log('Fetching subscriber count for creator:', req.params.creatorId);
    
    // Validate creator ID format if needed
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.creatorId)) {
      console.warn('Invalid creator ID format:', req.params.creatorId);
      // Continue anyway, as it might still work with some formats
    }
    
    const { count, error } = await supabase
      .from('subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', req.params.creatorId);

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }

    console.log('Subscriber count result:', count);
    res.json(count || 0); // Return 0 if count is null
  } catch (error) {
    console.error('Error counting subscribers:', error);
    res.status(500).json({ message: 'Error counting subscribers' });
  }
});

// Subscribe to a creator
router.post('/:creatorId', authenticateToken, async (req, res) => {
  try {
    // Check if trying to subscribe to self
    if (req.params.creatorId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot subscribe to yourself' });
    }
    
    // Log the data being sent to help debug
    console.log('Subscribing with:', {
      subscriber_id: req.user.userId,
      creator_id: req.params.creatorId
    });

    const { data, error } = await supabase
      .from('subscribers')
      .insert([
        { 
          subscriber_id: req.user.userId, 
          creator_id: req.params.creatorId
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error details:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ message: 'Already subscribed to this creator' });
      }
      throw error;
    }

    console.log('Subscription successful:', data);
    res.json({ message: 'Subscribed successfully', isSubscribed: true });
  } catch (error) {
    console.error('Error subscribing to creator:', error);
    res.status(500).json({ message: 'Error subscribing to creator' });
  }
});

// Unsubscribe from a creator
router.delete('/:creatorId', authenticateToken, async (req, res) => {
  try {
    // Log the data being used for unsubscribing
    console.log('Unsubscribing with:', {
      subscriber_id: req.user.userId,
      creator_id: req.params.creatorId
    });

    const { data, error } = await supabase
      .from('subscribers')
      .delete()
      .eq('subscriber_id', req.user.userId)
      .eq('creator_id', req.params.creatorId)
      .select();

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }

    console.log('Unsubscription successful:', data);
    res.json({ message: 'Unsubscribed successfully', isSubscribed: false });
  } catch (error) {
    console.error('Error unsubscribing from creator:', error);
    res.status(500).json({ message: 'Error unsubscribing from creator' });
  }
});

module.exports = router; 