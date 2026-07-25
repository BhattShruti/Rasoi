from gemini_client import generate_recipe

print("🍳 Welcome to Rasoi!")

ingredients = input("Enter your main ingredients: ")
time = input("Enter available time (in minutes): ")
goal = input("Enter your goal (Quick Meal / Healthy Meal / High Protein / Budget Friendly / Comfort Food / Fancy Meal): ")

user_prompt = f"""
Main Ingredients: {ingredients}
Maximum Cooking Time: {time} minutes
Goal: {goal}
Cuisine: Indian
Servings: 2
"""

recipe = generate_recipe(user_prompt)

print("\n\n========== RASOI RESPONSE ==========\n")
print(recipe)