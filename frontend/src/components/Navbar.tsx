import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MOBILE_MENU_ID = 'mobile-menu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold" onClick={closeMenu}>
            📚 Shikho English
          </Link>

          <div className="hidden md:flex space-x-6">
            {user ? (
              <>
                <Link to="/analyze" className="hover:text-blue-200 transition">
                  Analyze
                </Link>
                <Link to="/history" className="hover:text-blue-200 transition">
                  History
                </Link>
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

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-controls={MOBILE_MENU_ID}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white transition"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div id={MOBILE_MENU_ID} className="md:hidden pb-4 flex flex-col space-y-1">
            {user ? (
              <>
                <span className="px-3 py-2 text-blue-200">{user.fullName}</span>
                <Link to="/analyze" onClick={closeMenu} className="px-3 py-2 rounded hover:bg-blue-700 transition">
                  Analyze
                </Link>
                <Link to="/history" onClick={closeMenu} className="px-3 py-2 rounded hover:bg-blue-700 transition">
                  History
                </Link>
                <Link to="/practice" onClick={closeMenu} className="px-3 py-2 rounded hover:bg-blue-700 transition">
                  Practice
                </Link>
                <Link to="/quiz" onClick={closeMenu} className="px-3 py-2 rounded hover:bg-blue-700 transition">
                  Quiz
                </Link>
                <Link to="/progress" onClick={closeMenu} className="px-3 py-2 rounded hover:bg-blue-700 transition">
                  Progress
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-2 bg-red-600 px-3 py-2 rounded text-left hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className="px-3 py-2 rounded hover:bg-blue-700 transition">
                  Login
                </Link>
                <Link to="/register" onClick={closeMenu} className="mt-2 bg-green-600 px-3 py-2 rounded hover:bg-green-700 transition">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
