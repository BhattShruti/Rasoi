import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bookmark, ChefHat } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const { favorites } = useApp();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-charcoal/10 px-6 py-5 md:px-12 transition-all no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-forest flex items-center justify-center text-cream shadow-sm group-hover:rotate-6 transition-all duration-300">
            <ChefHat className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-serif text-2xl font-bold tracking-tight text-charcoal block leading-none">
              Rasoi<span className="text-coral font-sans font-black">.</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-warmgray font-bold block mt-0.5">
              Your AI Home Chef
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-8">
          <Link
            to="/"
            className={`text-xs uppercase tracking-widest font-bold transition-colors hover:text-forest editorial-link ${
              isActive('/') ? 'text-forest' : 'text-warmgray'
            }`}
          >
            Home
          </Link>
          
          <Link
            to="/saved"
            className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold transition-colors hover:text-forest editorial-link ${
              isActive('/saved') ? 'text-forest' : 'text-warmgray'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Cookbook</span>
            {favorites.length > 0 && (
              <span className="inline-flex items-center justify-center bg-coral text-cream text-[9px] font-bold w-4.5 h-4.5 rounded-full scale-90 -ml-1 animate-pulse">
                {favorites.length}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
};
