class RasoiException(Exception):
    """Base exception class for the Rasoi API."""
    def __init__(self, message, status_code=500, payload=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['success'] = False
        rv['message'] = self.message
        return rv


class BadRequestException(RasoiException):
    """Exception raised for invalid client input or missing fields (400)."""
    def __init__(self, message="Bad Request", payload=None):
        super().__init__(message, 400, payload)


class QuotaExceededException(RasoiException):
    """Exception raised when the Gemini API quota limit is reached (429)."""
    def __init__(self, message="Daily Gemini API limit reached. Please try again later.", payload=None):
        super().__init__(message, 429, payload)


class GeminiApiException(RasoiException):
    """Exception raised for generic Gemini client/API failures (502)."""
    def __init__(self, message="Gemini API encountered an error.", payload=None):
        super().__init__(message, 502, payload)


class RecipeParseException(RasoiException):
    """Exception raised when the chef response JSON is invalid or fails parsing (422)."""
    def __init__(self, message="Failed to parse recipe response from the AI chef. Please try again.", payload=None):
        super().__init__(message, 422, payload)


class TimeoutException(RasoiException):
    """Exception raised when the Gemini API call times out (504)."""
    def __init__(self, message="Connection to Gemini API timed out.", payload=None):
        super().__init__(message, 504, payload)
