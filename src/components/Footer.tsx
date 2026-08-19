import React from 'react';
import { ChefHat, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-cream border-t border-charcoal/10 py-16 px-6 md:px-12 mt-auto no-print">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
        
        {/* Editorial Brand Section */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-forest" />
            <span className="font-serif text-xl font-semibold tracking-tight text-charcoal">
              Rasoi<span className="text-coral">.</span>
            </span>
          </div>
          <p className="font-serif text-lg italic text-warmgray max-w-sm">
            "Cooking is an art, but making it approachable is our mission."
          </p>
          <p className="text-sm text-warmgray/80 max-w-sm font-sans leading-relaxed">
            Rasoi is a warm, thoughtful cooking companion designed to help beginners create delicious meals using ingredients already in their pantry.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="space-y-4">
          <h4 className="font-serif text-sm font-bold tracking-wider text-charcoal uppercase">
            Inspiration
          </h4>
          <ul className="space-y-2 text-sm text-warmgray font-sans">
            <li><a href="#" className="hover:text-forest transition-colors">Monsoon Specials</a></li>
            <li><a href="#" className="hover:text-forest transition-colors">One-Pot Meals</a></li>
            <li><a href="#" className="hover:text-forest transition-colors">High-Protein Dinners</a></li>
            <li><a href="#" className="hover:text-forest transition-colors">Kids Lunchbox Ideas</a></li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="space-y-4">
          <h4 className="font-serif text-sm font-bold tracking-wider text-charcoal uppercase">
            Rasoi Kitchen
          </h4>
          <ul className="space-y-2 text-sm text-warmgray font-sans">
            <li><a href="#" className="hover:text-forest transition-colors">About our Chef</a></li>
            <li><a href="#" className="hover:text-forest transition-colors">Kitchen Philosophy</a></li>
            <li><a href="#" className="hover:text-forest transition-colors">Contact Support</a></li>
            <li><a href="#" className="hover:text-forest transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-charcoal/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-warmgray">
        <div>
          &copy; {new Date().getFullYear()} Rasoi Kitchen. All rights reserved.
        </div>
        <div className="flex items-center gap-1 font-sans">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-coral fill-coral animate-pulse" />
          <span>for passionate home cooks.</span>
        </div>
      </div>
    </footer>
  );
};
