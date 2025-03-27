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
import Explore from './pages/Explore';
import FloatingActionButton from './components/FloatingActionButton';
import NavigationBar from './components/NavigationBar';
import ChatBot from './components/ChatBot';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-[#111111] text-gray-900 dark:text-white">
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <NavigationBar />
              <div className="flex-grow container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/create-post" element={<CreatePost />} />
                  <Route path="/edit-post/:id" element={<EditPost />} />
                  <Route path="/post/:id" element={<PostDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/explore" element={<Explore />} />
                </Routes>
                <FloatingActionButton />
                <ChatBot />
              </div>
            </div>
          </AuthProvider>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App; 