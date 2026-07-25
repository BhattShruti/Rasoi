import streamlit as st
from gemini_client import generate_recipe

# -----------------------------
# Page Config
# -----------------------------
st.set_page_config(
    page_title="Rasoi",
    page_icon="🍳",
    layout="wide"
)

# -----------------------------
# Session State
# -----------------------------
if "recipes" not in st.session_state:
    st.session_state.recipes = None

if "expanded_recipe" not in st.session_state:
    st.session_state.expanded_recipe = None

# -----------------------------
# Header
# -----------------------------
st.title("🍳 Rasoi")
st.subheader("Your AI Cooking Assistant")

st.write(
    "Enter your main ingredients and let Rasoi suggest practical recipes."
)

st.divider()

# -----------------------------
# User Inputs
# -----------------------------
ingredients = st.text_input(
    "Main Ingredients",
    placeholder="Example: paneer, onion, capsicum"
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
        "Fancy Meal",
    ],
)

generate = st.button("🍳 Generate Recipes", use_container_width=True)

# -----------------------------
# Generate Recipes
# -----------------------------
if generate:

    user_prompt = f"""
Main Ingredients: {ingredients}
Maximum Cooking Time: {time} minutes
Goal: {goal}
"""

    response = generate_recipe(user_prompt)

    st.session_state.recipes = response["recipes"]
    st.session_state.expanded_recipe = None

# -----------------------------
# Display Recipes
# -----------------------------
if st.session_state.recipes:

    st.divider()

    for recipe in st.session_state.recipes:

        with st.container(border=True):

            st.subheader(recipe["recipe_name"])

            st.write(f"💡 {recipe['recommendation_reason']}")

            col1, col2 = st.columns(2)

            with col1:
                st.write(f"⏱️ **{recipe['total_time_minutes']} min**")

            with col2:
                st.write(f"⭐ **{recipe['difficulty']}**")

            if recipe.get("special_equipment"):
                st.write(f"🔧 **{recipe['special_equipment']}**")

            is_open = (
                st.session_state.expanded_recipe
                == recipe["recipe_name"]
            )

            if not is_open:

                if st.button(
                    "View Recipe",
                    key=f"view_{recipe['recipe_name']}",
                    use_container_width=True,
                ):
                    st.session_state.expanded_recipe = recipe["recipe_name"]
                    st.rerun()

            else:

                if st.button(
                    "Hide Recipe",
                    key=f"hide_{recipe['recipe_name']}",
                    use_container_width=True,
                ):
                    st.session_state.expanded_recipe = None
                    st.rerun()

                st.markdown("---")

                st.markdown("## 🛒 Ingredients")

                for ingredient in recipe["ingredients"]:

                    line = (
                        f"• {ingredient['quantity']} {ingredient['name'].lower()}"
                    )

                    if ingredient.get("measurement_hint"):
                        line += (
                            f" ({ingredient['measurement_hint']})"
                        )

                    st.write(line)

                st.markdown("---")

                st.markdown("## 👨‍🍳 Cooking Steps")

                for index, step in enumerate(
                    recipe["steps"],
                    start=1,
                ):

                    st.write(
                        f"**Step {index}.** {step['instruction']}"
                    )

                    if step.get("tip"):
                        st.info(f"💡 {step['tip']}")

                st.markdown("---")

                st.write(
                    f"🍽️ **Estimated Servings:** {recipe['estimated_servings']}"
                )

                st.markdown("---")

                st.markdown("### 🚀 Quick Actions")

                action_cols = st.columns(4)

                with action_cols[0]:
                    st.button(
                        "🥗 Healthier",
                        key=f"healthier_{recipe['recipe_name']}"
                    )

                with action_cols[1]:
                    st.button(
                        "⚡ Quicker",
                        key=f"quicker_{recipe['recipe_name']}"
                    )

                with action_cols[2]:
                    st.button(
                        "💰 Cheaper",
                        key=f"cheaper_{recipe['recipe_name']}"
                    )

                with action_cols[3]:
                    st.button(
                        "🔄 Substitutes",
                        key=f"substitute_{recipe['recipe_name']}"
                    )

                st.markdown("### 💬 Ask Another Question")

                st.text_input(
                    "Ask anything about this recipe",
                    key=f"question_{recipe['recipe_name']}",
                    placeholder="Example: Can I make this without onion?"
                )