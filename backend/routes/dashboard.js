// routes/dashboard.js

const express = require('express');
const { Schema } = require('../models/schema'); // Assume you have a Schema model
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// Dashboard Route: Fetch all schemas for the authenticated user
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have the user ID from the auth middleware
    const schemas = await Schema.find({ userId }); // Get schemas for the logged-in user
    
    if (!schemas) {
      return res.status(404).json({ message: 'No schemas found' });
    }
    
    res.json(schemas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching schemas' });
  }
});

module.exports = router;
