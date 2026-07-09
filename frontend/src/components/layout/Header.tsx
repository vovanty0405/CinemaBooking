import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isHome = location.pathname === '/';

  return (
    <header className={`${
      isHome 
        ? 'absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent' 
        : 'sticky top-0 z-40 bg-dark-bg/90 backdrop-blur-md border-b border-dark-input'
    } w-full transition-all duration-300`}>
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold tracking-tight text-white">
            <span className="text-brand-red">C</span>ineBooking
          </span>
        </Link>

        {/* Pill Navigation */}
        <nav className="hidden md:flex items-center bg-dark-surface/80 border border-dark-input rounded-full px-6 py-2 gap-6 shadow-lg backdrop-blur-md">
          <Link to="/" className="text-text-primary hover:text-white transition-colors text-sm font-medium">Home</Link>
          <Link to="/movies" className="text-text-primary hover:text-white transition-colors text-sm font-medium">Movies</Link>
          <Link to="/theaters" className="text-text-primary hover:text-white transition-colors text-sm font-medium">Theaters</Link>
          <Link to="/releases" className="text-text-primary hover:text-white transition-colors text-sm font-medium">Releases</Link>
          <Link to="/favorites" className="text-text-primary hover:text-white transition-colors text-sm font-medium">Favorites</Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          
          {isAuthenticated ? (
            <div className="relative group">
              <Link to="/profile" className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-teal text-white overflow-hidden shadow-md hover:scale-105 transition-transform">
                <div className="w-8 h-8 bg-dark-input rounded-full overflow-hidden border border-brand-red flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </Link>
              <div className="absolute right-0 top-full mt-2 w-40 bg-dark-surface border border-dark-input rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                <Link to="/profile" className="block px-4 py-2 text-sm text-text-primary hover:bg-dark-input hover:text-white">Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-brand-red hover:bg-dark-input">Log out</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="hidden sm:inline-flex text-sm py-1.5 h-auto">Đăng nhập</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" className="text-sm py-1.5 h-auto rounded-full px-5">Đăng ký</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
