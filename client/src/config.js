// API base URL configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'
  : `http://${window.location.hostname}:5000`; 