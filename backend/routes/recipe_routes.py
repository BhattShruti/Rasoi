from flask import Blueprint, request
from models.schemas import RecipeGenerateSchema
from services.recipe_service import RecipeService
from utils.response import success_response
from utils.errors import BadRequestException

recipe_bp = Blueprint('recipes', __name__)

@recipe_bp.route('/recipes/generate', methods=['POST'])
def generate_recipe():
    """
    Generate Indian home recipes
    ---
    tags:
      - Recipes
    summary: Generates personalized recipe suggestions based on ingredients and available time
    description: Communicates with Google Gemini AI models to formulate and suggest exactly three high-quality, practical recipes.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - ingredients
            - time
          properties:
            ingredients:
              type: string
              example: "Paneer, Tomatoes, Onion"
              description: A list of main ingredients present in the user's kitchen.
            time:
              type: integer
              example: 30
              description: Maximum cooking time available in minutes.
            goal:
              type: string
              example: "Healthy Meal"
              enum: ["Quick Meal", "Healthy Meal", "High Protein", "Budget Friendly", "Comfort Food", "Fancy Meal"]
              description: Dietary or preparation goals. Defaults to "Comfort Food".
            cuisine:
              type: string
              example: "Indian"
              description: Target cuisine. Defaults to "Indian".
            servings:
              type: integer
              example: 2
              description: Estimated number of servings. Defaults to 2.
    responses:
      200:
        description: Successfully generated recipe suggestions
        schema:
          type: object
          properties:
            recipes:
              type: array
              items:
                type: object
                properties:
                  recipe_name:
                    type: string
                    example: "Paneer Capsicum Sauté"
                  recommendation_reason:
                    type: string
                    example: "Quick stir-fry that cooks in under 15 minutes."
                  total_time_minutes:
                    type: integer
                    example: 15
                  difficulty:
                    type: string
                    example: "Beginner"
                  estimated_servings:
                    type: integer
                    example: 2
                  image_prompt:
                    type: string
                    example: "Scrambled paneer and diced green peppers seared on a skillet"
                  ingredients:
                    type: array
                    items:
                      type: object
                      properties:
                        name:
                          type: string
                          example: "Paneer"
                        quantity:
                          type: string
                          example: "200g"
                  steps:
                    type: array
                    items:
                      type: object
                      properties:
                        instruction:
                          type: string
                          example: "Chop the paneer and capsicum into small cubes."
                        tip:
                          type: string
                          example: "Keep heat low while tossing paneer to avoid rubbery texture."
      400:
        description: Invalid request payload (missing fields or type mismatch)
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Field 'time' must be a positive integer."
            request_id:
              type: string
              example: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
      429:
        description: Daily API usage limits exceeded
      503:
        description: Gemini AI service temporarily overloaded or unavailable
      504:
        description: Connection timeout when calling Gemini API
    """
    data = request.get_json(silent=True)
    if data is None:
        raise BadRequestException("Invalid JSON or empty request body.")

    # Validate JSON payload structure and parameters
    validation_error = RecipeGenerateSchema.validate(data)
    if validation_error:
        raise BadRequestException(validation_error)

    ingredients = data.get('ingredients')
    time = int(data.get('time'))
    goal = data.get('goal', 'Comfort Food')
    cuisine = data.get('cuisine', 'Indian')
    servings = int(data.get('servings', 2))

    # Call service layer to communicate with Gemini
    recipe_data = RecipeService.generate_recipe(
        ingredients=ingredients,
        time=time,
        goal=goal,
        cuisine=cuisine,
        servings=servings
    )

    return success_response(recipe_data)
