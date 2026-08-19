from routes.health_routes import health_bp, health
from routes.recipe_routes import recipe_bp, generate_recipe
from routes.chat_routes import chat_bp, chat_chef

def register_routes(app):
    """
    Registers blueprints for v1 API routes under the '/api/v1' prefix.
    Also registers compatibility paths under '/api' to preserve backward compatibility.
    """
    # 1. Register versioned API blueprints
    app.register_blueprint(health_bp, url_prefix='/api/v1')
    app.register_blueprint(recipe_bp, url_prefix='/api/v1')
    app.register_blueprint(chat_bp, url_prefix='/api/v1')

    # 2. Register legacy compatibility endpoints using the same route controllers
    app.add_url_rule('/api/health', view_func=health, methods=['GET'])
    app.add_url_rule('/api/recipes/generate', view_func=generate_recipe, methods=['POST'])
    app.add_url_rule('/api/chef/chat', view_func=chat_chef, methods=['POST'])
