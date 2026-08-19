import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useRecipes } from '../hooks/useRecipes';
import { SuggestionChip } from '../components/SuggestionChip';
import { SeasonBanner } from '../components/SeasonBanner';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeSkeleton } from '../components/RecipeSkeleton';
import { RecipeImage } from '../components/RecipeImage';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, Users, Flame, MapPin, Plus, X, RotateCcw, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTION_CHIPS = [
  { label: 'High Protein', type: 'goal' },
  { label: 'Quick Meals', type: 'goal' },
  { label: 'Kids Lunch', type: 'goal' },
  { label: 'Budget Meals', type: 'goal' },
  { label: 'South Indian', type: 'cuisine' },
  { label: 'North Indian', type: 'cuisine' },
  { label: 'One Pot Meals', type: 'goal' },
  { label: 'Street Food', type: 'cuisine' },
  { label: 'Healthy Dinner', type: 'goal' }
];

export const Home: React.FC = () => {
  const {
    ingredientsInput,
    setIngredientsInput,
    ingredientsList,
    addIngredient,
    removeIngredient,
    cookingTime,
    setCookingTime,
    cookingGoal,
    setCookingGoal,
    cookingCuisine,
    setCookingCuisine,
    servings,
    setServings,
    resetGeneration,
    cookedHistory,
    favorites,
    toggleFavorite,
    addToCookedHistory,
    allRecipes
  } = useApp();

  const { recipes, isGenerating, error, generate, clearError } = useRecipes();

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (ingredientsInput.trim()) {
        addIngredient(ingredientsInput.trim());
        setIngredientsInput('');
      }
    }
  };

  const handleAddClick = () => {
    if (ingredientsInput.trim()) {
      addIngredient(ingredientsInput.trim());
      setIngredientsInput('');
    }
  };

  const handleChipClick = (chip: { label: string; type: string }) => {
    if (chip.type === 'goal') {
      setCookingGoal(chip.label);
    } else {
      setCookingCuisine(chip.label);
    }
  };

  const { triggerGenerateSignal, setTriggerGenerateSignal } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredientsList.length > 0 && !isGenerating) {
      generate();
    }
  };

  useEffect(() => {
    if (triggerGenerateSignal) {
      setTriggerGenerateSignal(false);
      if (ingredientsList.length === 0) {
        addIngredient("Paneer");
        addIngredient("Tomatoes");
        addIngredient("Onion");
      }
      setTimeout(() => {
        generate();
      }, 50);
    }
  }, [triggerGenerateSignal]);

  useEffect(() => {
    if (isGenerating || recipes.length > 0 || error) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isGenerating, recipes, error]);

  // Retrieve recently cooked recipes from merged repository
  const recentlyCookedRecipes = cookedHistory
    .map((id) => allRecipes.find((r) => r.id === id))
    .filter((r): r is typeof allRecipes[0] => !!r);

  return (
    <div className="space-y-24 pb-24">
      
      {/* HERO SECTION - Premium Asymmetrical Two-Column Layout */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-12 md:pt-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative overflow-hidden">
        
        {/* Floating background decorative organic patterns */}
        <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 text-forest/5 select-none pointer-events-none">
          <svg width="200" height="200" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10 80 C 40 40, 60 40, 90 20 C 60 50, 40 50, 10 80 Z" />
          </svg>
        </div>

        {/* Left Column: Branding Copy, Search Panel Input, & Chips */}
        <div className="lg:col-span-7 text-left space-y-8 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/5 border border-forest/10">
              <Sparkles className="w-3.5 h-3.5 text-mango" />
              <span className="text-[10px] uppercase tracking-widest text-forest font-extrabold">
                Your AI Kitchen Assistant
              </span>
            </div>
            
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-charcoal leading-[1.08] lg:-mr-12"
            >
              Cook smart,<br />
              Eat better, <span className="text-forest italic font-serif font-normal">Live happier <span className="text-coral select-none font-sans font-bold">💚</span></span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-sm md:text-base text-warmgray leading-relaxed font-sans font-normal pt-2 max-w-lg"
            >
              Tell us what ingredients you have and we'll suggest delicious, personalized home-cooked meals tailored to your kitchen.
            </motion.p>
          </div>

          {/* Form Card wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="bg-white border border-charcoal/5 rounded-3xl p-6 md:p-8 shadow-premium text-left relative overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              
              {/* Ingredients tag box */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase font-bold text-charcoal tracking-widest block">
                  What ingredients do you have?
                </label>
                
                <div className="flex flex-wrap items-center gap-2 bg-cream border border-charcoal/5 rounded-2xl p-3 min-h-16 focus-within:border-forest focus-within:bg-white transition-all duration-300">
                  <AnimatePresence>
                    {ingredientsList.map((ingredient) => (
                      <motion.span
                        key={ingredient}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex items-center gap-1.5 bg-white border border-charcoal/10 rounded-xl px-3 py-1 text-xs font-semibold text-charcoal shadow-sm"
                      >
                        {ingredient}
                        <button
                          type="button"
                          onClick={() => removeIngredient(ingredient)}
                          className="text-warmgray hover:text-coral transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  
                  <div className="flex-grow flex items-center min-w-[160px]">
                    <input
                      type="text"
                      value={ingredientsInput}
                      onChange={(e) => setIngredientsInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={ingredientsList.length === 0 ? "E.g. chicken, tomato, rice..." : "Add more..."}
                      className="w-full bg-transparent border-none outline-none text-xs font-semibold p-1 text-charcoal placeholder:text-warmgray/50"
                    />
                    {ingredientsInput.trim() && (
                      <button
                        type="button"
                        onClick={handleAddClick}
                        className="p-1 text-forest hover:bg-cream rounded-md cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Cooking Time */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-charcoal tracking-widest block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-basil" /> Cooking Time
                  </label>
                  <select
                    value={cookingTime}
                    onChange={(e) => setCookingTime(Number(e.target.value))}
                    className="w-full bg-cream border border-charcoal/5 rounded-xl px-3 py-3 text-xs font-semibold text-charcoal outline-none focus:border-forest transition-colors cursor-pointer"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60+ Minutes</option>
                  </select>
                </div>

                {/* Servings */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-charcoal tracking-widest block flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-basil" /> Servings
                  </label>
                  <select
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="w-full bg-cream border border-charcoal/5 rounded-xl px-3 py-3 text-xs font-semibold text-charcoal outline-none focus:border-forest transition-colors cursor-pointer"
                  >
                    <option value={1}>1 Serving</option>
                    <option value={2}>2 Servings</option>
                    <option value={3}>3 Servings</option>
                    <option value={4}>4 Servings</option>
                    <option value={6}>6+ Servings</option>
                  </select>
                </div>

                {/* Dining Goal */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-charcoal tracking-widest block flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-basil" /> Goal
                  </label>
                  <select
                    value={cookingGoal}
                    onChange={(e) => setCookingGoal(e.target.value)}
                    className="w-full bg-cream border border-charcoal/5 rounded-xl px-3 py-3 text-xs font-semibold text-charcoal outline-none focus:border-forest transition-colors cursor-pointer"
                  >
                    <option value="Quick Meals">Quick Meals</option>
                    <option value="High Protein">High Protein</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Kids Lunch">Kids Lunchbox</option>
                    <option value="Budget Meals">Budget Meals</option>
                    <option value="One Pot Meals">One Pot Meals</option>
                    <option value="Healthy Dinner">Healthy Dinner</option>
                  </select>
                </div>
              </div>

              {/* Cuisine field */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-charcoal tracking-widest block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-basil" /> Target Cuisine (Optional)
                </label>
                <select
                  value={cookingCuisine}
                  onChange={(e) => setCookingCuisine(e.target.value)}
                  className="w-full bg-cream border border-charcoal/5 rounded-xl px-3 py-3 text-xs font-semibold text-charcoal outline-none focus:border-forest transition-colors cursor-pointer"
                >
                  <option value="">Any Cuisine</option>
                  <option value="North Indian">North Indian</option>
                  <option value="South Indian">South Indian</option>
                  <option value="Continental">Continental</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Fusion">Fusion</option>
                  <option value="Street Food">Street Food</option>
                </select>
              </div>

              {/* Submit CTA button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || ingredientsList.length === 0}
                  className="w-full py-4 px-6 bg-coral hover:bg-coral-hover disabled:bg-coral/40 disabled:cursor-not-allowed text-cream font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-editorial flex items-center justify-center gap-2 cursor-pointer select-none active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-mango animate-pulse" />
                  <span>{isGenerating ? 'Curating Recipes...' : 'Find Recipes'}</span>
                </button>
              </div>
            </form>
          </motion.div>

          {/* SUGGESTION CHIPS DISPLAY */}
          <div className="space-y-3 pt-4 border-t border-charcoal/5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-warmgray block">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_CHIPS.map((chip, idx) => {
                const isSelected = chip.type === 'goal' ? cookingGoal === chip.label : cookingCuisine === chip.label;
                return (
                  <SuggestionChip
                    key={idx}
                    label={chip.label}
                    isSelected={isSelected}
                    onClick={() => handleChipClick(chip)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Premium Food Photography Plate & floating SVGs */}
        <div className="lg:col-span-5 text-center flex items-center justify-center relative select-none pointer-events-none md:col-span-6">
          <div className="relative">
            {/* Main dish circular photo */}
            <div className="w-72 h-72 md:w-[360px] md:h-[360px] rounded-full overflow-hidden border-[10px] border-white shadow-premium relative z-10">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                alt="Premium Indian Home Food"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Leaf background decoration (top right) */}
            <div className="absolute -top-12 -right-8 z-0 text-basil opacity-30 rotate-45 transform">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M2 22C2 22 6 14 14 12C14 12 18 8 20 4C20 4 16 6 12 6C10 14 2 22 2 22Z" fill="currentColor"/>
              </svg>
            </div>
            
            {/* Tomato/Chili background decoration (bottom left) */}
            <div className="absolute -bottom-8 -left-12 z-20 w-24 h-24 drop-shadow-md bg-white p-3 rounded-full flex items-center justify-center border border-charcoal/5 animate-bounce" style={{ animationDuration: '4s' }}>
              <img
                src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=150&q=80"
                alt="Tomato detail"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            
            {/* Decorative leaf (top left) */}
            <div className="absolute -top-6 -left-6 z-20 text-basil opacity-20 rotate-12 transform">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 12 6 8 12 8C12 8 18 12 22 12C22 6.48 17.52 2 12 2Z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS DISPLAY CONTAINER - Editorial Layout */}
      <div ref={resultsRef} className="scroll-mt-24 max-w-7xl mx-auto px-6 md:px-12">
        <AnimatePresence mode="wait">
          
          {/* 1. Loading experience */}
          {isGenerating && (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <RecipeSkeleton />
            </motion.div>
          )}

          {/* 2. Error handling presentation */}
          {error && (
            <motion.div
              key="error-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8 text-center space-y-4 max-w-xl mx-auto shadow-sm text-left"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
                <X className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-center">
                <h3 className="font-serif text-lg font-bold text-red-900">
                  Kitchen Service Interruption
                </h3>
                <p className="text-sm text-red-700 leading-relaxed font-sans font-normal max-w-md mx-auto">
                  {error.message || 'Apologies, we encountered an issue communicating with the AI chef. Please try again.'}
                </p>
                {error.requestId && (
                  <span className="text-[10px] text-red-500 font-mono block mt-2 tracking-wide">
                    Trace ID: {error.requestId}
                  </span>
                )}
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={generate}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm select-none"
                >
                  Retry Request
                </button>
                <button
                  type="button"
                  onClick={clearError}
                  className="px-5 py-2.5 border border-red-300 hover:bg-red-100 text-red-700 text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer select-none"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}

          {/* 3. Successful recipes load */}
          {!isGenerating && !error && recipes.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              <div className="flex items-end justify-between border-b border-[#7A7570]/15 pb-4">
                <div className="text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-terracotta">
                    Your Curated Menu
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-charcoal">
                    Chef's Recommendations
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetGeneration}
                  className="flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-hover transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start Over</span>
                </button>
              </div>

              {/* Editorial grid */}
              <div className="space-y-8">
                
                {/* Large horizontal primary chef's pick */}
                {recipes[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-[#7A7570]/10 shadow-editorial overflow-hidden grid grid-cols-1 md:grid-cols-12 group hover:shadow-premium transition-all duration-500"
                  >
                    {/* Image block (Left) */}
                    <div className="relative md:col-span-6 lg:col-span-7 h-64 md:h-auto min-h-[300px]">
                      <RecipeImage
                        imageUrl={recipes[0].imageUrl}
                        imagePrompt={recipes[0].imagePrompt}
                        alt={recipes[0].name}
                        className="w-full h-full rounded-none"
                      />
                      <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-forest text-cream font-sans text-xs font-extrabold flex items-center justify-center shadow-md select-none z-20">
                        1
                      </div>
                      
                      {/* Favorite button */}
                      <button
                        type="button"
                        onClick={() => toggleFavorite(recipes[0].id)}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center border border-charcoal/10 text-charcoal hover:text-coral active:scale-90 transition-all duration-300 z-20 cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 transition-colors ${favorites.includes(recipes[0].id) ? 'text-coral fill-coral' : 'text-charcoal/70'}`} />
                      </button>
                    </div>

                    {/* Details block (Right) */}
                    <div className="p-8 md:col-span-6 lg:col-span-5 flex flex-col justify-between text-left space-y-6">
                      <div className="space-y-4">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gold block">
                          {recipes[0].cuisine} &bull; {recipes[0].tags[0]}
                        </span>
                        <h3 className="font-serif text-2xl md:text-3xl font-bold text-charcoal leading-tight">
                          {recipes[0].name}
                        </h3>
                        <p className="text-sm text-warmgray leading-relaxed font-sans font-normal">
                          {recipes[0].description}
                        </p>
                        
                        {/* Meta stats row */}
                        <div className="flex items-center gap-6 text-xs font-semibold text-warmgray/80 pt-2 border-t border-[#7A7570]/5">
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-sage" />
                            {recipes[0].prepTime + recipes[0].cookTime} mins
                          </span>
                          <span className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-sage" />
                            {recipes[0].difficulty}
                          </span>
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-sage" />
                            {recipes[0].servings} servings
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/recipe/${recipes[0].id}`}
                        onClick={() => addToCookedHistory(recipes[0].id)}
                        className="inline-flex items-center justify-center px-6 py-3.5 bg-coral hover:bg-coral-hover text-cream font-bold text-xs uppercase tracking-widest rounded-xl transition-all select-none text-center shadow-sm cursor-pointer"
                      >
                        Start Cooking Recipe
                      </Link>
                    </div>
                  </motion.div>
                )}

                {/* Remaining 2 recipes side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {recipes.slice(1, 3).map((recipe, idx) => (
                    <RecipeCard key={recipe.id} recipe={recipe} index={idx + 2} />
                  ))}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RECENTLY COOKED */}
      {recentlyCookedRecipes.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 no-print">
          <div className="border-b border-[#7A7570]/10 pb-4 mb-8 text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-warmgray">
              Welcome back to your kitchen
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mt-1">
              Recently Cooked
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyCookedRecipes.map((recipe) => (
              <RecipeCard key={`cooked-${recipe.id}`} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* SEASONAL INSPIRATION */}
      <SeasonBanner />

    </div>
  );
};
