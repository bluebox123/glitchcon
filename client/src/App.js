import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import FloatingActionButton from './components/FloatingActionButton';
import NavigationBar from './components/NavigationBar';
import ChatBot from './components/ChatBot';

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <NavigationBar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/edit-post/:id" element={<EditPost />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
            <FloatingActionButton />
            <ChatBot />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App; 