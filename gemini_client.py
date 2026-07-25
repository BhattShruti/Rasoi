import os
import json
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Create Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

from prompt import SYSTEM_PROMPT


def generate_recipe(user_prompt):
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            SYSTEM_PROMPT,
            f"User Request:\n{user_prompt}"
        ]
    )

    return json.loads(response.text)