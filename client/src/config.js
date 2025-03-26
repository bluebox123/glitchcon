// API base URL configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`);

// Gemini API configuration
// Replace this with your actual API key or use environment variables
export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
export const GEMINI_API_URL = process.env.REACT_APP_GEMINI_API_URL || 
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'; 