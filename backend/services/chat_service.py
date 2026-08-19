import gemini_client

class ChatService:
    """Service layer handling Chef Rasoi interactive chat questions."""

    @staticmethod
    def ask_chef(recipe, question, chat_history=None):
        """
        Queries Gemini via gemini_client with the recipe context and user question.
        """
        return gemini_client.ask_recipe_question(recipe, question, chat_history)
