import React from 'react';
import { CloudRain, Sun, Flame, MoveRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';

export const SeasonBanner: React.FC = () => {
  const { setCookingGoal, setCookingCuisine, generateRecipes } = useApp();

  const handleSelectSeason = (tag: string) => {
    setCookingGoal(tag);
    setCookingCuisine('');
    generateRecipes();
    
    // Scroll smoothly to results/top
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-6 no-print">
      <h2 className="font-serif text-2xl font-bold text-charcoal mb-6">
        Seasonal Inspiration
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Monsoon Specials */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={() => handleSelectSeason('Monsoon Specials')}
          className="relative bg-gradient-to-br from-[#8FA89B]/20 via-[#FDFBF7] to-[#8FA89B]/10 border border-[#8FA89B]/30 rounded-3xl p-6 flex flex-col justify-between h-56 cursor-pointer group overflow-hidden"
        >
          {/* Subtle background SVG graphics for high-end look */}
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-sage/10 select-none pointer-events-none group-hover:scale-115 transition-transform duration-500">
            <CloudRain className="w-32 h-32" />
          </div>

          <div className="space-y-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center text-sage">
              <CloudRain className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-charcoal mt-3">
              Monsoon Specials
            </h3>
            <p className="text-xs text-warmgray leading-relaxed max-w-[200px]">
              Spicy curries and warm broths to cook while listening to the rain.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-charcoal/80 group-hover:text-terracotta transition-colors relative z-10">
            <span>Explore Comfort Food</span>
            <MoveRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Summer Refreshers */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={() => handleSelectSeason('Summer Refreshers')}
          className="relative bg-gradient-to-br from-gold/10 via-[#FDFBF7] to-gold/5 border border-gold/20 rounded-3xl p-6 flex flex-col justify-between h-56 cursor-pointer group overflow-hidden"
        >
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-gold/10 select-none pointer-events-none group-hover:scale-115 transition-transform duration-500">
            <Sun className="w-32 h-32" />
          </div>

          <div className="space-y-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <Sun className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-charcoal mt-3">
              Summer Refreshers
            </h3>
            <p className="text-xs text-warmgray leading-relaxed max-w-[200px]">
              Light drinks, chilled yogurt dips, and zesty salads to stay hydrated.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-charcoal/80 group-hover:text-terracotta transition-colors relative z-10">
            <span>View Cooler Recipes</span>
            <MoveRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Winter Comfort Food */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={() => handleSelectSeason('Winter Comfort Food')}
          className="relative bg-gradient-to-br from-terracotta/10 via-[#FDFBF7] to-terracotta/5 border border-terracotta/20 rounded-3xl p-6 flex flex-col justify-between h-56 cursor-pointer group overflow-hidden"
        >
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-terracotta/10 select-none pointer-events-none group-hover:scale-115 transition-transform duration-500">
            <Flame className="w-32 h-32" />
          </div>

          <div className="space-y-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-charcoal mt-3">
              Winter Comfort Food
            </h3>
            <p className="text-xs text-warmgray leading-relaxed max-w-[200px]">
              Hearty slow-cooked lentils and rich, ghee-tempered classic meals.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-charcoal/80 group-hover:text-terracotta transition-colors relative z-10">
            <span>Browse Warm Bowls</span>
            <MoveRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

      </div>
    </section>
  );
};
