import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai.errors import APIError
import streamlit as st
from pathlib import Path
from streamlit.runtime import exists as streamlit_exists

# Import custom exceptions
from utils.errors import QuotaExceededException, GeminiApiException, RecipeParseException, TimeoutException

# Load environment variables relative to this file and allow overrides
dotenv_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=dotenv_path, override=True)

# Create Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

from prompt import SYSTEM_PROMPT


def notify_error(message):
    """
    Displays an error message in a context-aware manner.
    Uses st.error if running inside Streamlit, otherwise prints to terminal.
    """
    if streamlit_exists():
        st.error(message)
    else:
        try:
            print(f"Error: {message}")
        except UnicodeEncodeError:
            # Fallback for shells that don't support modern unicode/emoji encodings
            safe_msg = message.encode('ascii', errors='replace').decode('ascii')
            print(f"Error (safe print): {safe_msg}")


def safe_parse_json(text):
    """
    Robust JSON parser that strips markdown code blocks (e.g. ```json ... ```) 
    if the LLM wraps its output in them.
    """
    if not text:
        return None
    text_clean = text.strip()
    if text_clean.startswith("```"):
        # Strip opening code fence
        first_newline = text_clean.find("\n")
        if first_newline != -1:
            text_clean = text_clean[first_newline:].strip()
        else:
            text_clean = text_clean[3:].strip()
        # Strip trailing code fence
        if text_clean.endswith("```"):
            text_clean = text_clean[:-3].strip()
    try:
        return json.loads(text_clean)
    except json.JSONDecodeError:
        return None


def generate_recipe(user_prompt):
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                SYSTEM_PROMPT,
                f"User Request:\n{user_prompt}"
            ]
        )
        data = safe_parse_json(response.text)
        if data is None:
            notify_error("Failed to parse recipe response from the AI chef. Please try again.")
            raise RecipeParseException()
        return data

    except APIError as e:
        err_str = str(e)
        status_code = getattr(e, 'code', None) or getattr(e, 'status_code', None)
        
        if status_code == 429 or "RESOURCE_EXHAUSTED" in err_str:
            notify_error("Daily Gemini API limit reached.")
            raise QuotaExceededException()
        elif status_code == 503 or "UNAVAILABLE" in err_str or "experiencing high demand" in err_str:
            notify_error("Gemini Service Unavailable (503).")
            raise GeminiApiException("The Gemini AI service is currently experiencing high demand. Please try again later.", status_code=503)
        elif status_code == 504 or "DEADLINE_EXCEEDED" in err_str:
            notify_error("Gemini API Timeout.")
            raise TimeoutException()
        else:
            notify_error(f"Gemini API Error:\n{err_str}")
            raise GeminiApiException(f"Gemini API Error: {err_str}", status_code=status_code or 502)

    except Exception as e:
        notify_error(f"Unexpected Error:\n{e}")
        raise e


def refine_recipe(recipe, adjustment_type):
    """
    Refines a given recipe by asking Gemini to apply a specific adjustment.
    Returns the modified recipe JSON object.
    """
    prompt = f"""
    You are an experienced Indian home chef. The user wants to adjust a recipe you previously suggested.
    
    Current Recipe Details (in JSON format):
    {json.dumps(recipe)}
    
    Requested Adjustment: Make the recipe {adjustment_type.upper()}.
    
    Please modify the recipe based on this adjustment. Ensure that:
    1. You modify the ingredients and cooking instructions appropriately to meet the request.
    2. You update the `recommendation_reason` field to briefly summarize what adjustments you made (e.g. "Modified to reduce oil and dairy for a healthier version.").
    3. Keep all other keys and structure intact.
    4. The output must strictly follow the standard JSON schema:
       {{
         "recipes": [
           <single_updated_recipe_object>
         ]
       }}
    
    Return ONLY valid JSON. Do not include markdown codeblocks or explanations.
    """
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                SYSTEM_PROMPT,
                prompt
            ]
        )
        data = safe_parse_json(response.text)
        if data is None:
            notify_error("Failed to parse the refined recipe from the AI chef.")
            raise RecipeParseException()

        if isinstance(data, list) and len(data) > 0:
            data = data[0]

        if isinstance(data, dict):
            if "recipes" in data and len(data["recipes"]) > 0:
                return data["recipes"][0]
            if "recipe_name" in data:
                return data
        
        notify_error("Received an invalid response format from the AI chef. Please try again.")
        raise RecipeParseException("Received an invalid response format from the AI chef.")

    except APIError as e:
        err_str = str(e)
        status_code = getattr(e, 'code', None) or getattr(e, 'status_code', None)
        
        if status_code == 429 or "RESOURCE_EXHAUSTED" in err_str:
            raise QuotaExceededException()
        elif status_code == 503 or "UNAVAILABLE" in err_str or "experiencing high demand" in err_str:
            raise GeminiApiException("The Gemini AI service is currently experiencing high demand. Please try again later.", status_code=503)
        elif status_code == 504 or "DEADLINE_EXCEEDED" in err_str:
            raise TimeoutException()
        else:
            raise GeminiApiException(f"Gemini API Error: {err_str}", status_code=status_code or 502)
            
    except Exception as e:
        notify_error(f"Unexpected error while refining recipe: {e}")
        raise e


def ask_recipe_question(recipe, question, chat_history=None):
    """
    Queries Gemini with a cooking question specific to the current recipe context and history.
    Returns a plain text concise response.
    """
    # Format the chat history for context
    history_context = ""
    if chat_history:
        history_context = "\nPrevious Conversation History:\n"
        for msg in chat_history:
            role = "User" if msg.get("role") == "user" else "Chef Rasoi"
            text = msg.get("text", "")
            history_context += f"{role}: {text}\n"

    prompt = f"""
    You are Chef Rasoi, a helpful and patient AI Kitchen Companion.
    The user is currently preparing the following recipe:
    Recipe Name: {recipe.get('recipe_name', 'Current Recipe')}
    Ingredients: {json.dumps(recipe.get('ingredients', []))}
    Steps: {json.dumps(recipe.get('steps', []))}
    {history_context}
    User Cooking Question: "{question}"
    
    Please provide a helpful, practical, and friendly answer to this question.
    - Be brief and direct (2-3 sentences).
    - Give kitchen-tested, beginner-friendly advice.
    - Speak directly as Chef Rasoi.
    - Do NOT output JSON. Return plain text only.
    """
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                SYSTEM_PROMPT,
                prompt
            ]
        )
        if not response or not response.text:
            raise GeminiApiException("Chef Rasoi couldn't answer that question due to an empty response or safety filters. Please try asking a different question.")
        return response.text.strip()

    except APIError as e:
        err_str = str(e)
        status_code = getattr(e, 'code', None) or getattr(e, 'status_code', None)
        
        if status_code == 429 or "RESOURCE_EXHAUSTED" in err_str:
            raise QuotaExceededException()
        elif status_code == 503 or "UNAVAILABLE" in err_str or "experiencing high demand" in err_str:
            raise GeminiApiException("The Gemini AI service is currently experiencing high demand. Please try again later.", status_code=503)
        elif status_code == 504 or "DEADLINE_EXCEEDED" in err_str:
            raise TimeoutException()
        else:
            raise GeminiApiException(f"Gemini API Error: {err_str}", status_code=status_code or 502)
            
    except Exception as e:
        raise e