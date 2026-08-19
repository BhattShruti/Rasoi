import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, BarChart2 } from 'lucide-react';
import type { Recipe } from '../types/Recipe';
import { RecipeImage } from './RecipeImage';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';

interface RecipeCardProps {
  recipe: Recipe;
  index?: number; // Optional index tag for menu pick display
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index }) => {
  const { favorites, toggleFavorite, addToCookedHistory } = useApp();
  const isFavorite = favorites.includes(recipe.id);

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-3xl overflow-hidden border border-charcoal/5 shadow-sm hover:shadow-premium flex flex-col h-full group relative"
    >
      {/* Recipe Photo Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <RecipeImage
          imageUrl={recipe.imageUrl}
          imagePrompt={recipe.imagePrompt}
          alt={recipe.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Dynamic Number Badge on Top Left */}
        {index !== undefined && (
          <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-forest text-cream font-sans text-xs font-extrabold flex items-center justify-center shadow-md select-none z-20">
            {index}
          </div>
        )}

        {/* Favorite Button (Floating Top Right) */}
        <button
          type="button"
          onClick={() => toggleFavorite(recipe.id)}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-sm border border-charcoal/10 text-charcoal hover:text-coral active:scale-90 transition-all duration-300 z-20 cursor-pointer"
          aria-label="Add to cookbook"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'text-coral fill-coral' : 'text-charcoal/70'
            }`}
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-2 text-left">
          
          {/* Editorial Category Tag */}
          <span className="text-[9px] uppercase font-extrabold tracking-widest text-basil block">
            {recipe.cuisine} &bull; {recipe.tags[0] || 'Kitchen Choice'}
          </span>

          {/* Title */}
          <h3 className="font-serif text-lg font-black leading-snug text-charcoal group-hover:text-forest transition-colors duration-300">
            {recipe.name}
          </h3>

          {/* Short recommendation quote */}
          <p className="text-xs text-warmgray leading-relaxed line-clamp-2 font-sans font-normal">
            {recipe.headline}
          </p>

          {/* Meta stats row */}
          <div className="flex items-center gap-4 text-[11px] font-bold text-warmgray/80 pt-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-basil" />
              {totalTime} mins
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-basil" />
              {recipe.difficulty}
            </span>
          </div>
        </div>

        {/* View Recipe Button Link */}
        <div className="pt-3 border-t border-charcoal/5">
          <Link
            to={`/recipe/${recipe.id}`}
            onClick={() => addToCookedHistory(recipe.id)}
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-cream hover:bg-forest hover:text-cream text-charcoal font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 text-center select-none cursor-pointer border border-charcoal/5"
          >
            View Recipe
          </Link>
        </div>
      </div>
    </motion.article>
  );
};
