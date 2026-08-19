import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RecipeImage } from '../components/RecipeImage';
import { AskChef } from '../components/AskChef';
import {
  ArrowLeft,
  Printer,
  Share2,
  Heart,
  Clock,
  BarChart2,
  MapPin,
  Users,
  CheckSquare,
  Square,
  Sparkles,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';

// Estimated nutrition generator based on recipe keywords
const getNutritionEstimates = (title: string) => {
  const name = title.toLowerCase();
  if (name.includes('paneer')) {
    return { cal: 240, pro: '14g', fat: '16g', carb: '8g' };
  }
  if (name.includes('chicken') || name.includes('murgh')) {
    return { cal: 280, pro: '24g', fat: '12g', carb: '4g' };
  }
  if (name.includes('dal') || name.includes('lentil')) {
    return { cal: 160, pro: '9g', fat: '4g', carb: '22g' };
  }
  if (name.includes('rice') || name.includes('biryani')) {
    return { cal: 210, pro: '4g', fat: '3g', carb: '42g' };
  }
  return { cal: 150, pro: '5g', fat: '6g', carb: '18g' };
};

// Side dish pairings based on cuisine properties
const getPerfectWithList = (cuisine: string): Array<{ name: string; image: string }> => {
  const norm = cuisine.toLowerCase();
  if (norm.includes('south indian')) {
    return [
      { name: 'Idli', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=80&q=80' },
      { name: 'Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=80&q=80' },
      { name: 'Rice', image: 'https://images.unsplash.com/photo-1536304997881-a372c179924b?auto=format&fit=crop&w=80&q=80' }
    ];
  }
  if (norm.includes('north indian') || norm.includes('indian')) {
    return [
      { name: 'Jeera Rice', image: 'https://images.unsplash.com/photo-1536304997881-a372c179924b?auto=format&fit=crop&w=80&q=80' },
      { name: 'Butter Naan', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=80&q=80' },
      { name: 'Cucumber Raita', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=80&q=80' }
    ];
  }
  return [
    { name: 'Garlic Bread', image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=80&q=80' },
    { name: 'Mashed Potatoes', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=80&q=80' },
    { name: 'Green Salad', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=80&q=80' }
  ];
};

// Culinary step emoji icon mapper
const getStepIcon = (title: string, stepNumber: number) => {
  const norm = title.toLowerCase();
  if (stepNumber === 1 || norm.includes('prepare') || norm.includes('chop') || norm.includes('cut')) {
    return '🧅';
  }
  if (norm.includes('sauté') || norm.includes('fry') || norm.includes('roast') || norm.includes('heat')) {
    return '🍳';
  }
  if (norm.includes('simmer') || norm.includes('boil') || norm.includes('water') || norm.includes('gravy')) {
    return '🍲';
  }
  if (norm.includes('finish') || norm.includes('garnish') || norm.includes('serve') || norm.includes('ready')) {
    return '🥗';
  }
  return '🥄';
};

export const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { favorites, toggleFavorite, allRecipes } = useApp();
  
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [shareSuccess, setShareSuccess] = useState(false);

  // Retrieve recipe from repository
  const recipe = allRecipes.find((r) => r.id === id);

  useEffect(() => {
    setCheckedIngredients({});
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  if (!recipe) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center px-6">
        <h2 className="font-serif text-3xl font-bold text-charcoal">Recipe Not Found</h2>
        <p className="text-warmgray mt-2 mb-6">The culinary masterpiece you requested could not be located in our kitchen.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-forest text-cream rounded-xl text-sm font-medium cursor-pointer"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const isFavorite = favorites.includes(recipe.id);
  const totalTime = recipe.prepTime + recipe.cookTime;
  const nutrition = getNutritionEstimates(recipe.name);

  const toggleIngredientCheck = (name: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 md:py-12 space-y-10">
      
      {/* Top action row */}
      <div className="flex items-center justify-between border-b border-charcoal/10 pb-4 no-print">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-warmgray hover:text-forest cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Favorite */}
          <button
            type="button"
            onClick={() => toggleFavorite(recipe.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-charcoal/10 hover:border-coral bg-white text-xs font-semibold text-charcoal hover:text-coral cursor-pointer select-none transition-all duration-300"
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'text-coral fill-coral' : 'text-charcoal/70'}`} />
            <span>{isFavorite ? 'Saved' : 'Save'}</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-charcoal/10 hover:border-forest bg-white text-xs font-semibold text-charcoal hover:text-forest cursor-pointer select-none transition-all duration-300"
          >
            {shareSuccess ? (
              <>
                <Check className="w-4 h-4 text-basil" />
                <span className="text-basil">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-charcoal/70" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-charcoal/10 hover:border-forest bg-white text-xs font-semibold text-charcoal hover:text-forest cursor-pointer select-none transition-all duration-300"
          >
            <Printer className="w-4 h-4 text-charcoal/70" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* HEADER & HERO IMAGE SECTION - 2-Column layout for compact vertical space */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left bg-white border border-charcoal/5 rounded-3xl p-6 md:p-8 shadow-editorial">
        <div className="md:col-span-7 space-y-4">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-basil block">
            {recipe.cuisine} Cuisine &bull; {recipe.tags[1] || 'Editorial Choice'}
          </span>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-charcoal">
            {recipe.name}
          </h1>
          <p className="text-sm md:text-base text-warmgray font-normal leading-relaxed font-sans max-w-xl">
            {recipe.headline}
          </p>
          
          {/* Metadata stats row - compact layout */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-charcoal/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cream border border-charcoal/5 flex items-center justify-center text-forest">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-warmgray block">Total Time</span>
                <span className="text-xs font-bold text-charcoal">{totalTime} mins</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cream border border-charcoal/5 flex items-center justify-center text-forest">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-warmgray block">Difficulty</span>
                <span className="text-xs font-bold text-charcoal">{recipe.difficulty}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cream border border-charcoal/5 flex items-center justify-center text-forest">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-warmgray block">Cuisine</span>
                <span className="text-xs font-bold text-charcoal">{recipe.cuisine}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cream border border-charcoal/5 flex items-center justify-center text-forest">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-warmgray block">Servings</span>
                <span className="text-xs font-bold text-charcoal">{recipe.servings} portions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact, smaller recipe image - col-span-5 */}
        <div className="md:col-span-5 w-full h-[200px] md:h-[240px] rounded-2xl overflow-hidden shadow-premium relative">
          <RecipeImage
            imageUrl={recipe.imageUrl}
            imagePrompt={recipe.imagePrompt}
            alt={recipe.name}
            className="w-full h-full rounded-none"
          />
        </div>
      </section>

      {/* DETAILED CONTENT 3-COLUMN SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        
        {/* COLUMN 1: INGREDIENTS CHECKLIST, NUTRITION, SHOPPING (col-span-3) */}
        <div className="lg:col-span-3 space-y-6 text-left">
          {/* Ingredients Card */}
          <div className="bg-white border border-charcoal/5 rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-charcoal flex items-center gap-2 border-b border-charcoal/5 pb-2">
              Ingredients
              <span className="text-xs text-warmgray font-sans font-normal ml-auto">
                {recipe.servings} servings
              </span>
            </h2>
            
            <div className="space-y-1">
              {recipe.ingredients.map((ing, idx) => {
                const isChecked = !!checkedIngredients[ing.name];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleIngredientCheck(ing.name)}
                    className="flex items-start gap-3 py-2 cursor-pointer group select-none border-b border-charcoal/5 last:border-none transition-colors"
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-warmgray hover:text-coral focus:outline-none transition-colors"
                      aria-label={isChecked ? `Uncheck ${ing.name}` : `Check ${ing.name}`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-coral" />
                      ) : (
                        <Square className="w-4 h-4 text-warmgray/45 group-hover:text-coral" />
                      )}
                    </button>
                    <div className="text-sm leading-snug flex-grow">
                      <span className={`font-semibold transition-all ${isChecked ? 'line-through text-warmgray/50' : 'text-charcoal'}`}>
                        {ing.name}
                      </span>
                      {(ing.amount || ing.unit) && (
                        <span className={`block text-[10px] font-bold ${isChecked ? 'text-warmgray/30' : 'text-basil'} mt-0.5 uppercase tracking-wide`}>
                          {ing.amount} {ing.unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Add to Shopping List CTA */}
            <button
              type="button"
              className="w-full py-3 bg-forest hover:bg-forest-hover text-cream font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-4"
            >
              <span>Add to Shopping List</span>
            </button>
          </div>

          {/* Nutrition Card */}
          <div className="bg-white border border-charcoal/5 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-charcoal border-b border-charcoal/5 pb-2">
              Nutrition (Approx)
              <span className="text-[10px] text-warmgray font-sans block mt-0.5">Per serving</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cream border border-charcoal/5 p-3 rounded-2xl text-center">
                <span className="text-[9px] uppercase font-bold text-warmgray block">Calories</span>
                <span className="text-sm font-black text-charcoal">{nutrition.cal} kcal</span>
              </div>
              <div className="bg-cream border border-charcoal/5 p-3 rounded-2xl text-center">
                <span className="text-[9px] uppercase font-bold text-warmgray block">Protein</span>
                <span className="text-sm font-black text-charcoal">{nutrition.pro}</span>
              </div>
              <div className="bg-cream border border-charcoal/5 p-3 rounded-2xl text-center">
                <span className="text-[9px] uppercase font-bold text-warmgray block">Fat</span>
                <span className="text-sm font-black text-charcoal">{nutrition.fat}</span>
              </div>
              <div className="bg-cream border border-charcoal/5 p-3 rounded-2xl text-center">
                <span className="text-[9px] uppercase font-bold text-warmgray block">Carbs</span>
                <span className="text-sm font-black text-charcoal">{nutrition.carb}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: COOKING STEPS TIMELINE (col-span-6) */}
        <div className="lg:col-span-6 space-y-8 text-left">
          <div className="border-b border-charcoal/10 pb-3 flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Cooking Steps
            </h2>
            <span className="text-base select-none">🌱</span>
          </div>

          {/* Timeline Cards */}
          <div className="relative pl-6 md:pl-8 border-l border-forest/15 space-y-6 ml-3">
            {recipe.steps.map((step, idx) => (
              <motion.div
                key={step.stepNumber}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative"
              >
                {/* Visual Node */}
                <div className="absolute -left-[37px] md:-left-[45px] top-3.5 w-6 h-6 md:w-8 h-8 rounded-full bg-cream border-2 border-forest flex items-center justify-center font-sans text-xs md:text-sm font-extrabold text-forest shadow-sm select-none z-10">
                  {step.stepNumber}
                </div>

                {/* Step Card */}
                <div className="bg-white border border-charcoal/5 rounded-2xl p-5 md:p-6 shadow-sm hover:border-forest/20 transition-all duration-300 flex items-start gap-4 justify-between">
                  <div className="space-y-1.5 flex-grow">
                    <h3 className="font-serif text-sm font-bold text-charcoal">
                      {step.title}
                    </h3>
                    <p className="text-sm text-charcoal/90 leading-relaxed font-sans font-normal">
                      {step.instruction}
                    </p>
                  </div>
                  <div className="text-xl select-none pt-1">
                    {getStepIcon(step.title, step.stepNumber)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CHEF TIPS & NOTES BOXES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Chef Note Card */}
            <div className="bg-gradient-to-br from-cream via-white to-cream border border-mango/30 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-mango/15 select-none pointer-events-none">
                <Sparkles className="w-24 h-24" />
              </div>
              
              <div className="space-y-2 relative z-10">
                <h4 className="font-serif text-[10px] uppercase font-bold tracking-widest text-mango flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Chef's Note
                </h4>
                <p className="font-serif text-sm italic text-charcoal leading-relaxed">
                  "{recipe.chefNote}"
                </p>
              </div>
            </div>

            {/* Chef Tips Highlighted Box */}
            <div className="bg-basil/5 border border-basil/15 rounded-3xl p-6 space-y-3 shadow-sm">
              <h4 className="font-serif text-[10px] uppercase font-bold tracking-widest text-basil">
                Pro Kitchen Tips
              </h4>
              <ul className="space-y-2.5 text-xs text-charcoal/90 font-sans">
                {recipe.chefTips.map((tip, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <span className="text-coral font-bold select-none mt-0.5">•</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* COLUMN 3: ASK CHEF KABIR SIDEBAR & SIDE DISHES (col-span-3) */}
        <div className="lg:col-span-3 space-y-6 text-left">
          {/* Ask AI Chef Chat Container */}
          <div className="bg-white border border-charcoal/5 rounded-3xl p-6 shadow-sm">
            <AskChef recipeId={recipe.id} />
          </div>

          {/* Perfect With Card */}
          <div className="bg-white border border-charcoal/5 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="font-serif text-base font-bold text-charcoal border-b border-charcoal/5 pb-2">
              Perfect With
              <span className="text-[10px] text-warmgray font-sans block mt-0.5">Recommended side pairings</span>
            </h3>
            <div className="space-y-3">
              {getPerfectWithList(recipe.cuisine).map((pairing, idx) => (
                <div key={idx} className="flex items-center gap-3 border-b border-charcoal/5 last:border-none pb-2 last:pb-0">
                  <img
                    src={pairing.image}
                    alt={pairing.name}
                    className="w-10 h-10 rounded-full object-cover border border-charcoal/5"
                  />
                  <div className="text-left">
                    <span className="text-sm font-bold text-charcoal block">{pairing.name}</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-basil">Cuisine Pairing</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
