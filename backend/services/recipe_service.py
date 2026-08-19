import gemini_client

class RecipeService:
    """Service layer handling recipe generation business logic."""

    @staticmethod
    def generate_recipe(ingredients, time, goal="Comfort Food", cuisine="Indian", servings=2):
        """
        Formats user inputs and requests recipe generation from the Gemini client.
        """
        user_prompt = f"""
Main Ingredients: {ingredients}
Maximum Cooking Time: {time} minutes
Goal: {goal}
Cuisine: {cuisine}
Servings: {servings}
"""
        # Call the modified gemini_client, allowing exceptions to propagate
        return gemini_client.generate_recipe(user_prompt)

    @staticmethod
    def refine_recipe(recipe, adjustment_type):
        """
        Refines a recipe based on an adjustment type (e.g. healthier, quicker).
        """
        return gemini_client.refine_recipe(recipe, adjustment_type)
