// Get user avatar URL
router.get('/:userId/avatar', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await pool.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ avatar_url: user.rows[0].avatar_url });
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    res.status(500).json({ message: 'Server error' });
  }
}); 