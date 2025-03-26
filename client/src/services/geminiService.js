import axios from 'axios';

// Import constants directly without importing from config.js
// to avoid potential circular dependencies
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent';

/**
 * Summarizes text content using Gemini API
 * @param {string} content - Text content to summarize
 * @param {number} maxLength - Maximum length of summary in words (approximate)
 * @returns {Promise<string>} - The generated summary
 */
export const summarizeContent = async (content, maxLength = 100) => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      throw new Error(
        'Gemini API key is not configured. Please follow these steps:\n' +
        '1. Get a Gemini API key from https://ai.google.dev/\n' +
        '2. Create a .env file in the client directory\n' + 
        '3. Add REACT_APP_GEMINI_API_KEY=YOUR_API_KEY to the .env file\n' +
        '4. Restart the application'
      );
    }
    const response = await axios.post(
      GEMINI_API_URL, // API key is now in the headers, not in the URL
      {
        contents: [
          {
            parts: [
              {
                text: `Please create a concise summary of the following blog post content. 
                The summary should be approximately ${maxLength} words.
                
                Content: ${content}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 400,
        }
      },
      { // Add headers object as third parameter
        headers: {
          'x-goog-api-key': GEMINI_API_KEY, // API key in header
          'Content-Type': 'application/json', // Important!
        },
      }
    );

    // Extract summary from the API response
    const generatedText = response.data.candidates[0].content.parts[0].text;
    return generatedText.trim();
  } catch (error) {
    console.error('Error summarizing content with Gemini:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    // Check if it's our API key configuration error
    if (error.message && error.message.includes('Gemini API key is not configured')) {
      throw error; // Rethrow our detailed error
    }
    
    // Handle API-specific errors
    if (error.response?.data?.error) {
      throw new Error(`Gemini API error: ${error.response.data.error.message}`);
    }
    
    throw new Error('Failed to generate summary. Please try again later.');
  }
}; 