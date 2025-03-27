const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Format conversation history for context
    let context = '';
    if (history && history.length > 0) {
      context = 'Previous conversation:\n';
      history.forEach(msg => {
        context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      context += '\nCurrent message:\n';
    }

    // Combine context with current message
    const fullPrompt = context + message;

    // Generate response using Gemini
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ message: text });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
});

module.exports = router; 