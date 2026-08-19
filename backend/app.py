import os
import sys
import uuid
import time
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, request, g, has_request_context
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from flasgger import Swagger

from config import Config
from routes import register_routes
from utils.errors import RasoiException
from utils.response import error_response

class RequestIDFilter(logging.Filter):
    """
    Logging filter to inject request_id into log records.
    """
    def filter(self, record):
        if has_request_context():
            record.request_id = getattr(g, 'request_id', 'N/A')
        else:
            record.request_id = 'N/A'
        return True


def setup_logging(app):
    """
    Sets up application logging with request ID tracking and rotating files.
    """
    log_dir = Config.LOG_DIR
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    log_format = logging.Formatter(
        '[%(asctime)s] [%(request_id)s] %(levelname)s in %(module)s: %(message)s'
    )

    # 1. Rotating File Handler
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'app.log'),
        maxBytes=1024 * 1024 * 10,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(log_format)
    file_handler.setLevel(logging.INFO)
    file_handler.addFilter(RequestIDFilter())
    app.logger.addHandler(file_handler)

    # 2. Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_format)
    console_handler.setLevel(logging.INFO)
    console_handler.addFilter(RequestIDFilter())
    app.logger.addHandler(console_handler)

    app.logger.setLevel(logging.INFO)
    app.logger.info("Logging initialized successfully with Request ID filter.")


def register_error_handlers(app):
    """
    Register global error handlers for unified error responses.
    """
    @app.errorhandler(RasoiException)
    def handle_rasoi_exception(e):
        app.logger.warning(f"RasoiException: {e.message} (Status: {e.status_code})")
        return error_response(message=e.message, status_code=e.status_code)

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        app.logger.warning(f"HTTPException: {e.description} (Status: {e.code})")
        return error_response(message=e.description, status_code=e.code)

    @app.errorhandler(Exception)
    def handle_unexpected_exception(e):
        app.logger.exception(f"Unexpected Exception occurred: {e}")
        return error_response(
            message="An unexpected error occurred on the server.",
            status_code=500
        )


def register_request_hooks(app):
    """
    Register hooks to log request details and responses.
    Generates UUID request IDs and measures request execution time.
    """
    @app.before_request
    def before_request():
        # Generate or capture Request ID
        g.request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())
        g.start_time = time.time()
        
        # Log request receipt
        app.logger.info(f"Incoming Request: {request.method} {request.path} from {request.remote_addr}")

    @app.after_request
    def after_request(response):
        # Calculate execution duration
        if hasattr(g, 'start_time'):
            diff = time.time() - g.start_time
            execution_time_ms = int(diff * 1000)
        else:
            execution_time_ms = 0

        request_id = getattr(g, 'request_id', 'N/A')

        # Log details: HTTP Method, Route, Status Code, Request ID, Execution Time, Client IP
        app.logger.info(
            f"{request.method} {request.path} - Status:{response.status_code} - "
            f"Time:{execution_time_ms}ms - ClientIP:{request.remote_addr} - RequestID:{request_id}"
        )

        # Inject Request ID and Execution Time into response headers
        response.headers['X-Request-ID'] = request_id
        response.headers['X-Response-Time-Ms'] = str(execution_time_ms)
        return response


def setup_swagger(app):
    """
    Configures and initializes Flasgger/Swagger UI.
    """
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec_v1',
                "route": '/apispec_v1.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/docs"  # Interactive Swagger docs endpoint
    }
    
    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "Rasoi REST API",
            "description": "Production-ready Flask REST API backend for Rasoi, an AI-powered Indian home cooking assistant.",
            "contact": {
                "email": "support@rasoi.api"
            },
            "version": "1.0.0"
        },
        "basePath": "/"
    }
    
    Swagger(app, config=swagger_config, template=swagger_template)
    app.logger.info("Swagger documentation initialized at /docs")


def create_app():
    """
    Application factory pattern to configure and return the Flask app.
    """
    app = Flask(__name__)
    
    # Load settings & validate
    Config.validate()
    app.config.from_object(Config)

    # Enable Cross-Origin Resource Sharing (CORS) for frontend connectivity
    CORS(app)

    # Configure logging
    setup_logging(app)

    # Register request hooks (before/after logging)
    register_request_hooks(app)

    # Register error handlers
    register_error_handlers(app)

    # Register routes
    register_routes(app)

    # Setup Swagger UI docs
    setup_swagger(app)

    app.logger.info("Rasoi API backend is ready to accept requests.")
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)