# Patrika - Modern Blogging Platform

A modern, feature-rich blogging platform built with React, Node.js/Express, and Supabase. Patrika provides a seamless experience for content creators and readers alike.

## Features

- **User Authentication & Profiles**
  - Secure login and registration
  - Customizable user profiles
  - Avatar support with default options

- **Content Management**
  - Create, edit & delete blog posts
  - Rich text editor for post creation
  - Categories and tags for better organization
  - AI-powered content summarization

- **Social Features**
  - Like and bookmark posts
  - Comment system with real-time updates
  - Subscribe to authors
  - Share posts with others

- **User Experience**
  - Responsive design for all devices
  - Dark/Light mode support
  - Real-time search functionality
  - Floating action button for quick post creation
  - Interactive UI with smooth transitions

- **Additional Features**
  - View count tracking
  - Post analytics
  - User subscriptions
  - AI-powered content summarization
  - Chatbot assistance

## Tech Stack

- **Frontend**
  - React.js
  - React Router for navigation
  - Context API for state management
  - Tailwind CSS for styling
  - Axios for API requests

- **Backend**
  - Node.js with Express
  - Supabase for database and authentication
  - JWT for secure authentication
  - Multer for file uploads

- **Database**
  - Supabase PostgreSQL
  - Real-time subscriptions
  - Row Level Security

## Project Structure

```
patrika/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # Context providers
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
└── server/               # Node.js backend
    ├── routes/          # API routes
    ├── controllers/     # Route controllers
    ├── middleware/      # Custom middleware
    └── config/         # Configuration files
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/patrika.git
   cd patrika
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server
   npm install
   ```

3. **Set up environment variables**
   - Create `.env` files in both client and server directories
   - Add your Supabase credentials and other required variables

4. **Start the development servers**
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
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env)
```
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Supabase for providing the backend infrastructure
- React and Node.js communities for their excellent tools and libraries
- All contributors who have helped shape this project 
