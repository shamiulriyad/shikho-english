import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold">
            📚 Grammar Learner
          </Link>

          <div className="hidden md:flex space-x-6">
            {user ? (
              <>
                <Link to="/practice" className="hover:text-blue-200 transition">
                  Practice
                </Link>
                <Link to="/quiz" className="hover:text-blue-200 transition">
                  Quiz
                </Link>
                <Link to="/progress" className="hover:text-blue-200 transition">
                  Progress
                </Link>
                <span className="text-blue-200">{user.fullName}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 transition">
                  Login
                </Link>
                <Link to="/register" className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
