class RecipeGenerateSchema:
    """Validator for POST /api/recipes/generate request payload."""
    
    VALID_GOALS = {
        "Quick Meal", 
        "Healthy Meal", 
        "High Protein", 
        "Budget Friendly", 
        "Budget-Friendly", 
        "Comfort Food", 
        "Fancy Meal"
    }

    @staticmethod
    def validate(data):
        """
        Validates request data.
        Returns a string error message if invalid, or None if valid.
        """
        if not isinstance(data, dict):
            return "Payload must be a JSON object."

        # Required fields check
        if 'ingredients' not in data:
            return "Missing required field: 'ingredients'."
        if 'time' not in data:
            return "Missing required field: 'time'."

        # Validate ingredients
        ingredients = data.get('ingredients')
        if not isinstance(ingredients, str) or not ingredients.strip():
            return "Field 'ingredients' must be a non-empty string."

        # Validate time
        time_val = data.get('time')
        try:
            time_val = int(time_val)
            if time_val <= 0:
                return "Field 'time' must be a positive integer."
        except (ValueError, TypeError):
            return "Field 'time' must be a valid integer."

        # Validate optional goal
        if 'goal' in data:
            goal = data.get('goal')
            if not isinstance(goal, str) or not goal.strip():
                return "Field 'goal' must be a non-empty string."

        # Validate optional cuisine
        if 'cuisine' in data:
            cuisine = data.get('cuisine')
            if not isinstance(cuisine, str) or not cuisine.strip():
                return "Field 'cuisine' must be a non-empty string."

        # Validate optional servings
        if 'servings' in data:
            servings = data.get('servings')
            try:
                servings = int(servings)
                if servings <= 0:
                    return "Field 'servings' must be a positive integer."
            except (ValueError, TypeError):
                return "Field 'servings' must be a valid integer."

        return None


class ChefChatSchema:
    """Validator for POST /api/chef/chat request payload."""

    @staticmethod
    def validate(data):
        """
        Validates request data.
        Returns a string error message if invalid, or None if valid.
        """
        if not isinstance(data, dict):
            return "Payload must be a JSON object."

        # Required fields check
        if 'recipe' not in data:
            return "Missing required field: 'recipe'."
        if 'question' not in data:
            return "Missing required field: 'question'."

        # Validate recipe
        recipe = data.get('recipe')
        if not isinstance(recipe, dict):
            return "Field 'recipe' must be a JSON object representing the recipe context."

        # Validate question
        question = data.get('question')
        if not isinstance(question, str) or not question.strip():
            return "Field 'question' must be a non-empty string."

        # Validate optional chat_history
        if 'chat_history' in data:
            chat_history = data.get('chat_history')
            if chat_history is not None:
                if not isinstance(chat_history, list):
                    return "Field 'chat_history' must be a list."
                for idx, msg in enumerate(chat_history):
                    if not isinstance(msg, dict):
                        return f"Chat history element at index {idx} must be a JSON object."
                    if 'role' not in msg or 'text' not in msg:
                        return f"Chat history element at index {idx} must contain 'role' and 'text'."
                    if msg['role'] not in ('user', 'model', 'chef'):
                        return f"Chat history element at index {idx} has invalid role '{msg['role']}'. Must be 'user', 'model', or 'chef'."
                    if not isinstance(msg['text'], str) or not msg['text'].strip():
                        return f"Chat history element at index {idx} has invalid text (must be a non-empty string)."

        return None
