import React, { useEffect, useState } from 'react';
import { ChefHat, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_MESSAGES = [
  'Whispering to the herbs...',
  'Checking the kitchen pantry...',
  'Stirring the tomato glaze...',
  'Basting with butter and spices...',
  'Plating the editorial showcase...'
];

export const RecipeSkeleton: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-10 w-full max-w-7xl mx-auto py-8">
      {/* Culinary Cooking Theme Indicator */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center text-forest"
        >
          <ChefHat className="w-8 h-8" />
        </motion.div>
        
        <div className="h-6 overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="font-serif text-lg italic text-warmgray flex items-center gap-1.5"
            >
              <Sparkles className="w-4.5 h-4.5 text-mango animate-pulse" />
              {LOADING_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Grid of 3 Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl overflow-hidden border border-charcoal/5 shadow-[0_4px_20px_-4px_rgba(51,51,51,0.02)] flex flex-col h-full animate-pulse"
          >
            {/* Shimmering Image */}
            <div className="relative aspect-4/3 w-full bg-charcoal/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>

            {/* Shimmering Body */}
            <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
              <div className="space-y-3">
                {/* Meta details */}
                <div className="flex gap-4">
                  <div className="h-3.5 w-16 bg-charcoal/10 rounded-full" />
                  <div className="h-3.5 w-16 bg-charcoal/10 rounded-full" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <div className="h-5 w-3/4 bg-charcoal/15 rounded-lg" />
                  <div className="h-5 w-1/2 bg-charcoal/15 rounded-lg" />
                </div>

                {/* Recommendation paragraph */}
                <div className="space-y-1.5 pt-2">
                  <div className="h-3 w-full bg-charcoal/10 rounded" />
                  <div className="h-3 w-5/6 bg-charcoal/10 rounded" />
                </div>
              </div>

              {/* Button placeholder */}
              <div className="pt-4 border-t border-charcoal/5">
                <div className="h-10 w-full bg-charcoal/5 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
