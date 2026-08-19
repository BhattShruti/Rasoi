from flask import Blueprint, request
from models.schemas import ChefChatSchema
from services.chat_service import ChatService
from utils.response import success_response
from utils.errors import BadRequestException

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chef/chat', methods=['POST'])
def chat_chef():
    """
    Ask Chef Rasoi a culinary question
    ---
    tags:
      - Chat
    summary: Interactive kitchen conversation with Chef Rasoi regarding a recipe
    description: Queries Gemini with a cooking question specific to the recipe context and conversation history.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - recipe
            - question
          properties:
            recipe:
              type: object
              description: The full recipe details representing the context of the kitchen query.
              required:
                - recipe_name
              properties:
                recipe_name:
                  type: string
                  example: "Paneer Capsicum Sauté"
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
            question:
              type: string
              example: "Can I replace Paneer with Tofu?"
              description: The culinary question to ask.
            chat_history:
              type: array
              description: Optional list of past messages in the conversation session.
              items:
                type: object
                required:
                  - role
                  - text
                properties:
                  role:
                    type: string
                    enum: ["user", "model", "chef"]
                    example: "user"
                  text:
                    type: string
                    example: "How do I keep paneer soft?"
    responses:
      200:
        description: Chef Rasoi's text response
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Success"
            data:
              type: object
              properties:
                response:
                  type: string
                  example: "Yes, you can substitute firm tofu for paneer. Sauté it on low heat to preserve moisture."
      400:
        description: Invalid request payload (missing fields or type mismatch)
      429:
        description: Daily API usage limits exceeded
      503:
        description: Gemini AI service temporarily overloaded or unavailable
    """
    data = request.get_json(silent=True)
    if data is None:
        raise BadRequestException("Invalid JSON or empty request body.")

    # Validate JSON payload structure and parameters
    validation_error = ChefChatSchema.validate(data)
    if validation_error:
        raise BadRequestException(validation_error)

    recipe = data.get('recipe')
    question = data.get('question')
    chat_history = data.get('chat_history')

    # Invoke chat service to query Gemini
    chef_response = ChatService.ask_chef(
        recipe=recipe,
        question=question,
        chat_history=chat_history
    )

    # Return standard JSON format
    return success_response({"response": chef_response})
