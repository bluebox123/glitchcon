# Blogging Platform

A modern, scalable blogging platform built with React, Node.js/Express, and Supabase.

## Features

- User Authentication & Profiles
- Create, Edit & Delete Blog Posts
- Commenting System
- Categories & Tags
- Like & Share Features
- Dashboard & Analytics
- Responsive UI
- Dark Mode Support

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: Supabase
- Authentication: Supabase Auth
- Styling: Tailwind CSS

## Project Structure

```
blogging-platform/
├── client/             # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── utils/
└── server/             # Node.js backend
    ├── routes/
    ├── controllers/
    └── config/
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server
   npm install
   ```

3. Set up environment variables:
   - Create `.env` files in both client and server directories
   - Add your Supabase credentials

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd client
   npm start
   ```

## Environment Variables

### Frontend (.env)
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:5000
```

### Backend (.env)
```
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
``` 