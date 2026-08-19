import { useApp } from '../context/AppContext';
import { recipeService } from '../services/api';
import type { Recipe } from '../types/Recipe';
import type { ApiRecipe } from '../types/Api';
import { generateStepTitle } from '../utils/stepTitleHelper';
import { resolveBatchRecipeImages } from '../utils/imageResolver';

// Helper to transform Gemini backend format to frontend standard Recipe type
export const mapApiRecipeToRecipe = (api: ApiRecipe, requestGoal: string, requestCuisine: string): Recipe => {
  const id = api.recipe_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const prepTime = Math.max(5, Math.round(api.total_time_minutes * 0.3));
  const cookTime = Math.max(1, api.total_time_minutes - prepTime);

  let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';
  const apiDiff = api.difficulty.toLowerCase();
  if (apiDiff.includes('hard') || apiDiff.includes('advanced') || apiDiff.includes('difficult')) {
    difficulty = 'Hard';
  } else if (apiDiff.includes('medium') || apiDiff.includes('intermediate') || apiDiff.includes('moderate')) {
    difficulty = 'Medium';
  }

  const chefTips = api.steps
    .filter(s => s.tip)
    .map(s => s.tip as string);
  
  if (chefTips.length === 0) {
    chefTips.push('Garnish with fresh coriander leaves for an extra pop of color and flavor.');
  }

  return {
    id,
    name: api.recipe_name,
    headline: api.recommendation_reason,
    description: api.recommendation_reason,
    imageUrl: '', // Will be assigned via batch resolver
    imagePrompt: api.image_prompt,
    prepTime,
    cookTime,
    difficulty,
    cuisine: requestCuisine || 'Indian',
    servings: api.estimated_servings,
    ingredients: api.ingredients.map(ing => ({
      name: ing.name,
      amount: ing.quantity,
      unit: ing.measurement_hint || '',
    })),
    steps: api.steps.map((step, idx) => ({
      stepNumber: idx + 1,
      title: generateStepTitle(step.instruction, idx + 1),
      instruction: step.instruction,
    })),
    chefTips,
    chefNote: api.recommendation_reason,
    tags: [requestGoal, requestCuisine, difficulty].filter(Boolean),
  };
};

export const useRecipes = () => {
  const {
    generatedRecipes,
    setGeneratedRecipes,
    isGenerating,
    setIsGenerating,
    generationError,
    setGenerationError,
    cookingTime,
    cookingGoal,
    cookingCuisine,
    servings,
    ingredientsList,
    saveRecipesToHistory,
  } = useApp();

  const generate = async () => {
    if (ingredientsList.length === 0) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const response = await recipeService.generate({
        ingredients: ingredientsList.join(', '),
        time: cookingTime,
        goal: cookingGoal,
        cuisine: cookingCuisine || 'Indian',
        servings,
      });
      
      const batchImageUrls = resolveBatchRecipeImages(
        response.recipes.map(r => ({ name: r.recipe_name }))
      );

      const mappedRecipes = response.recipes.map((apiRecipe, idx) => {
        const recipe = mapApiRecipeToRecipe(apiRecipe, cookingGoal, cookingCuisine);
        recipe.imageUrl = batchImageUrls[idx];
        return recipe;
      });

      // Save generated recipes to global context and LocalStorage history
      setGeneratedRecipes(mappedRecipes);
      saveRecipesToHistory(mappedRecipes);
    } catch (err: any) {
      setGenerationError(err);
      setGeneratedRecipes([]);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    recipes: generatedRecipes,
    isGenerating,
    error: generationError,
    generate,
    clearError: () => setGenerationError(null),
  };
};
