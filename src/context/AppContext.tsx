import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Recipe } from '../types/Recipe';
import type { ChatMessage } from '../types/Chat';
import { mockRecipes } from '../data/mockRecipes';
import { ApiError } from '../services/api';

interface AppContextType {
  favorites: string[];
  toggleFavorite: (recipeId: string) => void;
  cookedHistory: string[];
  addToCookedHistory: (recipeId: string) => void;
  ingredientsInput: string;
  setIngredientsInput: (val: string) => void;
  ingredientsList: string[];
  addIngredient: (ingredient: string) => void;
  removeIngredient: (ingredient: string) => void;
  cookingTime: number;
  setCookingTime: (time: number) => void;
  cookingGoal: string;
  setCookingGoal: (goal: string) => void;
  cookingCuisine: string;
  setCookingCuisine: (cuisine: string) => void;
  servings: number;
  setServings: (num: number) => void;
  
  // Generation state
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  generatedRecipes: Recipe[];
  setGeneratedRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  generateRecipes: () => void;
  resetGeneration: () => void;
  generationError: ApiError | null;
  setGenerationError: (err: ApiError | null) => void;
  triggerGenerateSignal: boolean;
  setTriggerGenerateSignal: (val: boolean) => void;
  
  // Recipe History (stores generated recipes)
  recipeHistory: Recipe[];
  saveRecipesToHistory: (recipes: Recipe[]) => void;
  allRecipes: Recipe[];

  // Chat state
  chatHistory: Record<string, ChatMessage[]>;
  setChatHistory: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  sendChefMessage: (recipeId: string, message: string) => void;
  isChefTyping: boolean;
  setIsChefTyping: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sync favorites with LocalStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem('rasoi_favorites');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('rasoi_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (recipeId: string) => {
    setFavorites((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    );
  };

  // Cooked history - pre-populate with 3 items for realism if empty
  const [cookedHistory, setCookedHistory] = useState<string[]>(() => {
    const stored = localStorage.getItem('rasoi_cooked_history');
    return stored ? JSON.parse(stored) : ['paneer-butter-masala', 'kerala-prawn-curry', 'avocado-toast'];
  });

  const addToCookedHistory = (recipeId: string) => {
    setCookedHistory((prev) => {
      const updated = [recipeId, ...prev.filter((id) => id !== recipeId)].slice(0, 8);
      localStorage.setItem('rasoi_cooked_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Search parameters state
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [cookingTime, setCookingTime] = useState<number>(30);
  const [cookingGoal, setCookingGoal] = useState<string>('Quick Meals');
  const [cookingCuisine, setCookingCuisine] = useState<string>('');
  const [servings, setServings] = useState<number>(2);

  // Custom generated recipes history state
  const [recipeHistory, setRecipeHistory] = useState<Recipe[]>(() => {
    const stored = localStorage.getItem('rasoi_recipe_history');
    if (stored) {
      const parsed: Recipe[] = JSON.parse(stored);
      // Migration: strip non-local imageUrls so they fall through to the resolver
      let needsMigration = false;
      const migrated = parsed.map(r => {
        if (r.imageUrl && r.imageUrl.trim() && !r.imageUrl.startsWith('/') && !r.imageUrl.startsWith('./') && !r.imageUrl.startsWith('../')) {
          needsMigration = true;
          return { ...r, imageUrl: '' };
        }
        return r;
      });
      if (needsMigration) {
        localStorage.setItem('rasoi_recipe_history', JSON.stringify(migrated));
      }
      return migrated;
    }
    return [];
  });

  const saveRecipesToHistory = (newRecipes: Recipe[]) => {
    setRecipeHistory((prev) => {
      // Avoid adding duplicate recipes by ID
      const filteredPrev = prev.filter(pr => !newRecipes.some(nr => nr.id === pr.id));
      const updated = [...newRecipes, ...filteredPrev];
      localStorage.setItem('rasoi_recipe_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Merged global list of all recipes (statically mocked + dynamically generated)
  // Casting mock recipes for compiler safety
  const allRecipes = [...(mockRecipes as unknown as Recipe[]), ...recipeHistory];

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [generationError, setGenerationError] = useState<ApiError | null>(null);

  const addIngredient = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !ingredientsList.includes(trimmed)) {
      setIngredientsList((prev) => [...prev, trimmed]);
    }
  };

  const removeIngredient = (name: string) => {
    setIngredientsList((prev) => prev.filter((item) => item !== name));
  };

  const [triggerGenerateSignal, setTriggerGenerateSignal] = useState(false);
  const generateRecipes = () => {
    setTriggerGenerateSignal(true);
  };

  const resetGeneration = () => {
    setGeneratedRecipes([]);
    setIsGenerating(false);
    setGenerationError(null);
  };

  // Sync chatHistory with LocalStorage
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>(() => {
    const stored = localStorage.getItem('rasoi_chat_history');
    if (stored) return JSON.parse(stored);
    
    return {
      'paneer-butter-masala': [
        {
          id: 'welcome',
          sender: 'chef',
          text: "Warm greetings! I am your companion Chef Kabir. I can help you adjust spice levels, substitute ingredients, or scale this velvety Paneer Butter Masala. What's on your mind?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      'kerala-prawn-curry': [
        {
          id: 'welcome',
          sender: 'chef',
          text: "Welcome! Malabar cooking is all about matching the coconut milk with the spice. Ask me about adjusting heat or using frozen shrimp.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      'avocado-toast': [
        {
          id: 'welcome',
          sender: 'chef',
          text: "Hello! A perfect poached egg requires fresh ingredients. Ask me about sourdough substitutions or poaching hacks.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('rasoi_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const [isChefTyping, setIsChefTyping] = useState(false);

  // Keep fallback compatibility for legacy components
  const sendChefMessage = (_recipeId: string, _text: string) => {
    // Components should migrate to useChat hook, but custom implementation keeps it safe
  };

  return (
    <AppContext.Provider
      value={{
        favorites,
        toggleFavorite,
        cookedHistory,
        addToCookedHistory,
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
        
        isGenerating,
        setIsGenerating,
        generatedRecipes,
        setGeneratedRecipes,
        generateRecipes,
        resetGeneration,
        generationError,
        setGenerationError,
        triggerGenerateSignal,
        setTriggerGenerateSignal,
        
        recipeHistory,
        saveRecipesToHistory,
        allRecipes,
        
        chatHistory,
        setChatHistory,
        sendChefMessage,
        isChefTyping,
        setIsChefTyping
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
