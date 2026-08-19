import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RecipeCard } from '../components/RecipeCard';
import { BookOpen, Sparkles, ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';

export const Saved: React.FC = () => {
  const { favorites, allRecipes } = useApp();
  const navigate = useNavigate();

  // Retrieve saved recipes from the merged collection
  const savedRecipes = allRecipes.filter((r) => favorites.includes(r.id));

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-10 min-h-[65vh] flex flex-col justify-center text-left">
      
      {/* Title Header */}
      {savedRecipes.length > 0 && (
        <div className="border-b border-charcoal/10 pb-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-basil block">
            Personal Collection
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-charcoal mt-1">
            My Cookbook
          </h1>
          <p className="text-sm text-warmgray mt-1 font-sans">
            Your collection of curated recipes and kitchen creations.
          </p>
        </div>
      )}

      {/* Favorites Grid / Empty state */}
      {savedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {savedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        // Empty State with illustration and copywriting
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto text-center space-y-6 py-12"
        >
          {/* Custom Illustration block using SVG shapes */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-forest/5 rounded-full blur-xl scale-95" />
            <div className="relative w-24 h-24 rounded-full bg-cream border border-forest/20 flex items-center justify-center text-forest shadow-sm">
              <BookOpen className="w-10 h-10" />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-coral flex items-center justify-center text-cream border border-cream">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-forest">
              Cookbook is empty
            </span>
            <h2 className="font-serif text-2xl font-bold text-charcoal leading-tight">
              Your next favorite recipe is waiting.
            </h2>
            <p className="text-xs md:text-sm text-warmgray leading-relaxed font-sans max-w-sm mx-auto">
              Save custom-generated recipes here to build your personal cookbook and access them anytime.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-coral hover:bg-coral-hover text-cream text-xs uppercase tracking-widest font-bold rounded-xl shadow-sm transition-all select-none cursor-pointer"
            >
              <ChefHat className="w-4 h-4" />
              <span>Let's Cook Something</span>
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
};
