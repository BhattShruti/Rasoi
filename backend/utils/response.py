from flask import jsonify, g, has_request_context

def success_response(data, status_code=200):
    """
    Standardized success response helper.
    Returns the JSON representation of the provided data structure.
    """
    return jsonify(data), status_code


def error_response(message, status_code=400, errors=None):
    """
    Standardized error response helper.
    Returns a unified JSON structure for error payloads, including the request ID if available.
    """
    response = {
        "success": False,
        "message": message
    }
    if errors is not None:
        response["errors"] = errors

    # Inject Request ID for easier correlation of client-side errors with server logs
    if has_request_context() and hasattr(g, 'request_id'):
        response["request_id"] = g.request_id

    return jsonify(response), status_code
