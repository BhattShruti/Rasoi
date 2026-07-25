import streamlit as st
from gemini_client import generate_recipe

# Page configuration
st.set_page_config(
    page_title="Rasoi",
    page_icon="🍳",
    layout="wide"
)

# Title
st.title("🍳 Rasoi")
st.subheader("Your AI Cooking Assistant")

st.write("Enter your main ingredients and let Rasoi suggest the best recipes.")

st.divider()

# ---------- User Inputs ----------

ingredients = st.text_input(
    "Main Ingredients",
    placeholder="Example: paneer, capsicum, onion"
)

time = st.selectbox(
    "Maximum Cooking Time",
    [15, 20, 30, 45, 60]
)

goal = st.selectbox(
    "Cooking Goal",
    [
        "Quick Meal",
        "Healthy Meal",
        "High Protein",
        "Budget Friendly",
        "Comfort Food",
        "Fancy Meal"
    ]
)

generate = st.button("🍳 Generate Recipes")
if generate:

    user_prompt = f"""
Main Ingredients: {ingredients}
Maximum Cooking Time: {time} minutes
Goal: {goal}
"""

    response = generate_recipe(user_prompt)

    st.divider()

    for recipe in response["recipes"]:

        with st.container(border=True):

            st.subheader(recipe["recipe_name"])

            st.write(f"💡 {recipe['recommendation_reason']}")

            st.write(
                f"⏱️ {recipe['total_time_minutes']} min &nbsp;&nbsp;&nbsp; ⭐ {recipe['difficulty']}",
                unsafe_allow_html=True
            )

            if "special_equipment" in recipe:
                st.write(f"🔧 {recipe['special_equipment']}")

            st.button(
                "View Recipe",
                key=recipe["recipe_name"]
            )