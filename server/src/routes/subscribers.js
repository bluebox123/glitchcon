const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabaseClient');
const authenticateToken = require('../middleware/auth');

// Get all subscriptions for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('Fetching subscriptions for user:', userId);
    console.log('User object:', req.user);
    
    // First get the subscription records
    const { data: subscriptions, error } = await supabase
      .from('subscribers')
      .select('creator_id')
      .eq('subscriber_id', userId);

    if (error) {
      console.error('Supabase error fetching subscriptions:', error);
      throw error;
    }

    console.log(`Found ${subscriptions?.length || 0} subscription records`);
    
    // If no subscriptions found, return empty array
    if (!subscriptions || subscriptions.length === 0) {
      return res.json([]);
    }

    // Get the creator IDs
    const creatorIds = subscriptions.map(sub => sub.creator_id);
    
    // Fetch user details for those creators
    const { data: creators, error: creatorsError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', creatorIds);
    
    if (creatorsError) {
      console.error('Supabase error fetching creator details:', creatorsError);
      throw creatorsError;
    }
    
    console.log('Returning subscription data:', creators);
    res.json(creators || []);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

// Get all subscribers for the current user
router.get('/subscribers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('Fetching subscribers for user:', userId);
    console.log('User object:', req.user);
    
    // First get the subscriber records
    const { data: subscriptions, error } = await supabase
      .from('subscribers')
      .select('subscriber_id')
      .eq('creator_id', userId);

    if (error) {
      console.error('Supabase error fetching subscriber records:', error);
      throw error;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriber records`);
    
    // If no subscribers found, return empty array
    if (!subscriptions || subscriptions.length === 0) {
      return res.json([]);
    }

    // Get the subscriber IDs
    const subscriberIds = subscriptions.map(sub => sub.subscriber_id);
    
    // Fetch user details for those subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', subscriberIds);
    
    if (subscribersError) {
      console.error('Supabase error fetching subscriber details:', subscribersError);
      throw subscribersError;
    }
    
    console.log('Returning subscriber data:', subscribers);
    res.json(subscribers || []);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

// Check if the current user is subscribed to a specific creator
router.get('/:creatorId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('Checking subscription status for user:', userId, 'to creator:', req.params.creatorId);
    console.log('User object:', req.user);
    
    // Validate IDs format if needed
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.creatorId)) {
      console.warn('Invalid creator ID format:', req.params.creatorId);
      // Continue anyway
    }
    
    const { data: subscription, error } = await supabase
      .from('subscribers')
      .select('id')
      .eq('subscriber_id', userId)
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
    const userId = req.user.userId || req.user.id;
    
    // Check if trying to subscribe to self
    if (req.params.creatorId === userId) {
      return res.status(400).json({ message: 'Cannot subscribe to yourself' });
    }
    
    // Log the data being sent to help debug
    console.log('Subscribing with:', {
      subscriber_id: userId,
      creator_id: req.params.creatorId
    });
    console.log('User object:', req.user);

    const { data, error } = await supabase
      .from('subscribers')
      .insert([
        { 
          subscriber_id: userId, 
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
    const userId = req.user.userId || req.user.id;
    
    // Log the data being used for unsubscribing
    console.log('Unsubscribing with:', {
      subscriber_id: userId,
      creator_id: req.params.creatorId
    });
    console.log('User object:', req.user);

    const { data, error } = await supabase
      .from('subscribers')
      .delete()
      .eq('subscriber_id', userId)
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