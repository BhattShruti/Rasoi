export interface Ingredient {
  name: string;
  amount: number | string;
  unit: string;
}

export interface CookingStep {
  stepNumber: number;
  title: string;
  instruction: string;
}

export interface Recipe {
  id: string;
  name: string;
  headline: string;
  description: string;
  imageUrl?: string;
  imagePrompt: string; // Ready for AI generation rendering
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  servings: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  chefTips: string[];
  chefNote: string;
  tags: string[];
  nutrition?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
}
