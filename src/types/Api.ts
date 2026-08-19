export interface GenerateRecipeRequest {
  ingredients: string;
  time: number;
  goal: string;
  cuisine: string;
  servings: number;
}

export interface ApiIngredient {
  name: string;
  quantity: string;
  measurement_hint?: string;
}

export interface ApiCookingStep {
  instruction: string;
  tip?: string;
}

export interface ApiRecipe {
  recipe_name: string;
  recommendation_reason: string;
  total_time_minutes: number;
  difficulty: string;
  estimated_servings: number;
  image_prompt: string;
  ingredients: ApiIngredient[];
  steps: ApiCookingStep[];
}

export interface GenerateRecipeResponse {
  recipes: ApiRecipe[];
}

export interface ChatRequestRecipe {
  recipe_name: string;
  ingredients: { name: string; quantity: string }[];
  steps: { instruction: string }[];
}

export interface ChatRequest {
  recipe: ChatRequestRecipe;
  question: string;
  chat_history?: { role: 'user' | 'model' | 'chef'; text: string }[];
}

export interface ChatResponse {
  response: string;
}
