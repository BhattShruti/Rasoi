export interface Ingredient {
  name: string;
  amount: number | string;
  unit: string;
}

export interface CookingStep {
  stepNumber: number;
  title: string;
  instruction: string;
}

export interface Recipe {
  id: string;
  name: string;
  headline: string;
  description: string;
  imageUrl: string;
  imagePrompt: string; // Future-ready for AI generation
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  servings: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  chefTips: string[];
  chefNote: string;
  tags: string[];
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
}

export const mockRecipes: Recipe[] = [
  {
    id: 'paneer-butter-masala',
    name: 'Velvety Paneer Butter Masala',
    headline: 'A premium, restaurant-style curry with pillowy paneer cubes cooked in a rich, buttery tomato-cashew sauce.',
    description: 'An elegant Indian staple that balances sweet, tangy, and mildly spiced flavors. Perfect for a cozy weekend dinner with garlic naan or steamed basmati rice.',
    imageUrl: '',
    imagePrompt: 'Overhead flatlay shot of a classic Indian Paneer Butter Masala curry served in a traditional copper bowl, garnished with fresh cream and chopped cilantro, warm editorial lighting, high resolution, recipe book style.',
    prepTime: 15,
    cookTime: 25,
    difficulty: 'Medium',
    cuisine: 'North Indian',
    servings: 4,
    ingredients: [
      { name: 'Paneer (Cottage Cheese), cubed', amount: 400, unit: 'g' },
      { name: 'Ripe Red Tomatoes, chopped', amount: 4, unit: 'medium' },
      { name: 'Red Onion, sliced', amount: 1, unit: 'large' },
      { name: 'Cashew Nuts', amount: 10, unit: 'pcs' },
      { name: 'Ginger-Garlic Paste', amount: 1, unit: 'tbsp' },
      { name: 'Unsalted Butter', amount: 3, unit: 'tbsp' },
      { name: 'Heavy Cream', amount: 2, unit: 'tbsp' },
      { name: 'Kashmiri Red Chili Powder', amount: 1.5, unit: 'tsp' },
      { name: 'Garam Masala', amount: 0.5, unit: 'tsp' },
      { name: 'Kasuri Methi (Dried Fenugreek Leaves)', amount: 1, unit: 'tsp' },
      { name: 'Green Cardamom Pods', amount: 3, unit: 'pcs' },
      { name: 'Salt', amount: 'to taste', unit: '' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Prepare the Base Paste',
        instruction: 'In a pan, heat 1 tablespoon of butter. Sautécardamoms, sliced onions, ginger-garlic paste, and cashews for 3 minutes until soft. Add the tomatoes, Kashmiri red chili powder, and a splash of water. Cover and simmer for 10 minutes until the tomatoes collapse.'
      },
      {
        stepNumber: 2,
        title: 'Blend the Tomato Blend',
        instruction: 'Let the tomato mixture cool completely, then blend it into a silky, smooth paste. Run it through a fine-mesh sieve if you want a true restaurant-grade velvet consistency.'
      },
      {
        stepNumber: 3,
        title: 'Build the Gravy',
        instruction: 'Melt the remaining butter in the same pan. Add the sieved tomato gravy. Simmer on low heat for 5 minutes until oil droplets start to appear on the edges.'
      },
      {
        stepNumber: 4,
        title: 'Assemble and Garnish',
        instruction: 'Gently fold in the paneer cubes (soak them in warm water beforehand for extra softness). Season with salt and garam masala. Crinkle kasuri methi between your palms and stir it in. Finish by swirling in heavy cream, cook for 2 more minutes, and remove from heat.'
      }
    ],
    chefTips: [
      'To make your paneer incredibly tender, soak the cubed paneer in warm water for 10 minutes before adding it to the hot gravy.',
      'Always rub Kasuri Methi between your palms before adding to release its aromatic oils.'
    ],
    chefNote: 'This curry is dear to my heart. The key to the iconic orange tint is using high-quality Kashmiri red chili powder—it provides a vibrant sunset color with very mild, approachable heat.',
    tags: ['North Indian', 'Winter Comfort Food', 'Festival Specials'],
    nutrition: {
      calories: 380,
      protein: '14g',
      carbs: '12g',
      fat: '31g'
    }
  },
  {
    id: 'kerala-prawn-curry',
    name: 'Fragrant Malabar Prawn Curry',
    headline: 'Succulent shrimp simmered in a warm, golden coconut milk base infused with ginger, curry leaves, and spicy green chilies.',
    description: 'A coastal masterpiece from Kerala. The combination of sweet coconut cream, sour tamarind, and spicy chilies creates a beautifully balanced sauce.',
    imageUrl: '',
    imagePrompt: 'Close up of a traditional Southern Indian prawn curry with coconut milk, decorated with curry leaves and mustard seeds, glowing terracotta dish, high-end food magazine photography.',
    prepTime: 20,
    cookTime: 15,
    difficulty: 'Medium',
    cuisine: 'South Indian',
    servings: 3,
    ingredients: [
      { name: 'Fresh Prawns, peeled and deveined', amount: 500, unit: 'g' },
      { name: 'Coconut Milk (Thick)', amount: 200, unit: 'ml' },
      { name: 'Shallots, finely sliced', amount: 8, unit: 'pcs' },
      { name: 'Ginger, julienned', amount: 1, unit: 'inch' },
      { name: 'Green Chilies, slit lengthwise', amount: 2, unit: 'pcs' },
      { name: 'Mustard Seeds', amount: 1, unit: 'tsp' },
      { name: 'Fenugreek Seeds (Methi)', amount: 0.25, unit: 'tsp' },
      { name: 'Turmeric Powder', amount: 0.5, unit: 'tsp' },
      { name: 'Tamarind Paste', amount: 1.5, unit: 'tbsp' },
      { name: 'Curry Leaves', amount: 2, unit: 'sprigs' },
      { name: 'Coconut Oil', amount: 2, unit: 'tbsp' },
      { name: 'Salt', amount: 'to taste', unit: '' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Marinate the Seafood',
        instruction: 'Rub the prawns with turmeric powder and a pinch of salt. Let them rest for 15 minutes while preparing the rest of your ingredients.'
      },
      {
        stepNumber: 2,
        title: 'Temper the Aromatics',
        instruction: 'Heat coconut oil in a deep pan or clay pot. Add mustard seeds. Once they splutter, add the fenugreek seeds, shallots, ginger, green chilies, and one sprig of curry leaves. Sauté until the shallots turn translucent.'
      },
      {
        stepNumber: 3,
        title: 'Simmer with Tamarind',
        instruction: 'Dilute the tamarind paste in 1 cup of warm water and pour it into the pot. Let the mixture boil for 5 minutes to cook out the raw tamarind taste.'
      },
      {
        stepNumber: 4,
        title: 'Cook Prawns & Add Coconut Cream',
        instruction: 'Add the marinated prawns to the boiling liquid and cook for 3 to 4 minutes until they turn pink and curl. Turn the heat down to low, pour in the thick coconut milk, and let it simmer gently for 2 minutes (do not boil, or the coconut milk will curdle). Garnish with the remaining fresh curry leaves.'
      }
    ],
    chefTips: [
      'Authentic Kerala cooking relies on pure cold-pressed coconut oil. Refined oils will not yield the same coastal depth.',
      'Never boil coconut milk after adding it to the sauce; low heat keeps it stable and rich.'
    ],
    chefNote: 'Growing up near the coast, monsoon meant rainy days and warm bowls of hot rice swimming in malabar shrimp curry. The tamarind brings a subtle tang that cuts beautifully through the sweet coconut milk.',
    tags: ['South Indian', 'Monsoon Specials', 'One Pot Meals', 'High Protein'],
    nutrition: {
      calories: 290,
      protein: '24g',
      carbs: '8g',
      fat: '18g'
    }
  },
  {
    id: 'avocado-toast',
    name: 'Sourdough Avocado Toast with Poached Egg',
    headline: 'Artisanal sourdough toasted to a crisp, topped with buttery mashed avocado, microgreens, and a perfectly runny poached egg.',
    description: 'A light, modern classic perfect for breakfast, brunch, or a quick dinner. The contrasting textures of crispy bread and velvety avocado create a luxurious mouthfeel.',
    imageUrl: '',
    imagePrompt: 'Minimalist editorial food photo of a single slice of sourdough avocado toast topped with a poached egg showing a runny yolk, sprinkled with red pepper flakes and black sesame seeds on a white ceramic plate, side view, natural light.',
    prepTime: 10,
    cookTime: 5,
    difficulty: 'Easy',
    cuisine: 'Continental',
    servings: 1,
    ingredients: [
      { name: 'Thick Slice of Sourdough Bread', amount: 1, unit: 'slice' },
      { name: 'Ripe Hass Avocado', amount: 1, unit: 'pc' },
      { name: 'Fresh Egg', amount: 1, unit: 'pc' },
      { name: 'Lemon Juice', amount: 1, unit: 'tsp' },
      { name: 'Extra Virgin Olive Oil', amount: 1, unit: 'tsp' },
      { name: 'Red Chili Flakes', amount: 0.5, unit: 'tsp' },
      { name: 'Sea Salt & Fresh Black Pepper', amount: 'to taste', unit: '' },
      { name: 'Microgreens or Sprouts (Optional)', amount: 'for garnish', unit: '' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Toast the Bread',
        instruction: 'Drizzle the sourdough slice with olive oil and toast it in a pan or toaster until golden brown and crispy on both sides.'
      },
      {
        stepNumber: 2,
        title: 'Mash the Avocado Base',
        instruction: 'Cut open the avocado, scoop the flesh into a bowl, and add lemon juice, a pinch of sea salt, and black pepper. Mash with a fork, leaving some texture for contrast.'
      },
      {
        stepNumber: 3,
        title: 'Poach the Perfect Egg',
        instruction: 'Bring a pot of water to a gentle simmer. Add a splash of vinegar. Whirl the water to create a gentle vortex and slide in the egg (cracked into a small cup first). Poach for exactly 3 minutes, then remove with a slotted spoon and drain.'
      },
      {
        stepNumber: 4,
        title: 'Assemble',
        instruction: 'Spread the mashed avocado generously over the warm toasted sourdough. Top with the poached egg, chili flakes, microgreens, and a final sprinkle of coarse sea salt.'
      }
    ],
    chefTips: [
      'Adding a teaspoon of white vinegar to the poaching water helps the egg white coagulate faster, keeping it compact.',
      'Slightly warm avocados mash more easily. If yours is a bit cold, let it sit on the counter for 10 minutes.'
    ],
    chefNote: 'Simplicity is key here. Make sure your sourdough is robust enough to hold the weight of the avocado, and buy sea salt flakes like Maldon for that crispy salt crunch at the end.',
    tags: ['High Protein', 'Quick Meals', 'Healthy Dinner', 'Summer Refreshers'],
    nutrition: {
      calories: 340,
      protein: '13g',
      carbs: '22g',
      fat: '21g'
    }
  },
  {
    id: 'garlic-herb-roasted-chicken',
    name: 'One-Pot Garlic Herb Roasted Chicken',
    headline: 'Tender chicken thighs roasted alongside baby potatoes and asparagus, basted in rosemary-thyme butter and lemon.',
    description: 'A comforting, rustic meal that practically cooks itself. The chicken skin turns shatteringly crisp while keeping the inside beautifully juicy.',
    imageUrl: '',
    imagePrompt: 'Gourmet roasted chicken thighs in a cast-iron skillet, surrounded by golden baby potatoes and green asparagus, seasoned with rosemary sprigs and charred lemon halves, warm and rustic presentation.',
    prepTime: 15,
    cookTime: 40,
    difficulty: 'Easy',
    cuisine: 'Mediterranean',
    servings: 2,
    ingredients: [
      { name: 'Chicken Thighs (Bone-in, skin-on)', amount: 4, unit: 'pcs' },
      { name: 'Baby Potatoes, halved', amount: 250, unit: 'g' },
      { name: 'Asparagus Spears, trimmed', amount: 150, unit: 'g' },
      { name: 'Garlic Cloves, crushed', amount: 6, unit: 'pcs' },
      { name: 'Fresh Rosemary & Thyme', amount: 3, unit: 'sprigs' },
      { name: 'Olive Oil', amount: 2, unit: 'tbsp' },
      { name: 'Butter, melted', amount: 1.5, unit: 'tbsp' },
      { name: 'Lemon juice and zest', amount: 1, unit: 'lemon' },
      { name: 'Salt and Black Pepper', amount: 'to taste', unit: '' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Marinate & Prep',
        instruction: 'Pat the chicken dry with paper towels (crucial for crispy skin). Toss chicken and baby potatoes in a large bowl with olive oil, crushed garlic, chopped rosemary, thyme, lemon zest, salt, and pepper.'
      },
      {
        stepNumber: 2,
        title: 'Arrange in Skillet',
        instruction: 'Place the chicken skin-side up and baby potatoes in a single layer in a preheated cast-iron skillet or baking dish.'
      },
      {
        stepNumber: 3,
        title: 'First Bake',
        instruction: 'Roast in a preheated oven at 200°C (400°F) for 25 minutes. Drizzle the melted butter and lemon juice over the chicken to baste it.'
      },
      {
        stepNumber: 4,
        title: 'Add Asparagus & Crisp',
        instruction: 'Add the asparagus spears around the chicken. Bake for another 15 minutes until the chicken reaches an internal temperature of 75°C (165°F) and the skin is golden and crispy. Let rest 5 minutes before serving.'
      }
    ],
    chefTips: [
      'To get the crispiest skin, leave the chicken thighs uncovered in the fridge for a few hours before cooking to dry out the skin.',
      'Do not crowd the pan; spacing the ingredients allows them to roast rather than steam.'
    ],
    chefNote: 'One-pot meals are the ultimate luxury. They require minimal cleanup but yield deep, integrated flavors. The garlic cloves roast in the chicken fat and become sweet, spreadable treats.',
    tags: ['One Pot Meals', 'High Protein', 'Healthy Dinner', 'Winter Comfort Food'],
    nutrition: {
      calories: 520,
      protein: '36g',
      carbs: '18g',
      fat: '34g'
    }
  },
  {
    id: 'homestyle-spinach-dal',
    name: 'Comforting Spinach & Lentil Dal',
    headline: 'Yellow split lentils slow-cooked with fresh baby spinach, finished with a sizzling spiced garlic ghee tempering (tadka).',
    description: 'The ultimate Indian soul food. Warm, nutritious, and deeply satisfying. This dal combines healthy proteins with iron-rich spinach for an easy weekday bowl.',
    imageUrl: '',
    imagePrompt: 'A rustic bowl of yellow lentil dal with spinach, topped with a splash of sizzling red oil and fried garlic chips, served next to flatbread on a rustic wooden table, cozy lighting.',
    prepTime: 10,
    cookTime: 20,
    difficulty: 'Easy',
    cuisine: 'North Indian',
    servings: 3,
    ingredients: [
      { name: 'Toor Dal (Yellow Split Pigeon Peas)', amount: 1, unit: 'cup' },
      { name: 'Fresh Spinach, washed and chopped', amount: 2, unit: 'cups' },
      { name: 'Tomato, finely chopped', amount: 1, unit: 'medium' },
      { name: 'Turmeric Powder', amount: 0.5, unit: 'tsp' },
      { name: 'Ghee (or Coconut Oil for vegan)', amount: 2, unit: 'tbsp' },
      { name: 'Cumin Seeds (Jeera)', amount: 1, unit: 'tsp' },
      { name: 'Garlic, finely chopped', amount: 4, unit: 'cloves' },
      { name: 'Dried Red Chili', amount: 1, unit: 'pc' },
      { name: 'Asafoetida (Hing)', amount: 'a pinch', unit: '' },
      { name: 'Salt', amount: 'to taste', unit: '' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pressure Cook the lentils',
        instruction: 'Wash the dal thoroughly. Cook with 3 cups of water, turmeric powder, and salt in a pressure cooker or heavy-bottomed pot until the lentils are completely soft and mushy.'
      },
      {
        stepNumber: 2,
        title: 'Fold in the Greens',
        instruction: 'Stir the chopped tomatoes and fresh spinach into the hot cooked lentils. Simmer for 5 minutes until the spinach wilts and integrates into the dal.'
      },
      {
        stepNumber: 3,
        title: 'Prepare the Tempering (Tadka)',
        instruction: 'In a small pan, heat ghee. Add cumin seeds. Once they crackle, add chopped garlic, dried red chili, and hing. Fry until the garlic turns golden brown and aromatic.'
      },
      {
        stepNumber: 4,
        title: 'Combine & Serve',
        instruction: 'Pour the sizzling hot tempering directly over the simmered dal. Cover immediately with a lid to trap the smoke and flavors. Stir before serving hot with steamed rice.'
      }
    ],
    chefTips: [
      'Covering the pot immediately after adding the tadka traps the rich garlic and cumin smoke, infusing it deep into the dal.',
      'Squeeze half a fresh lemon just before serving to brighten up the earthy lentils.'
    ],
    chefNote: 'Dal is the foundation of Indian home cooking. Every family has their own version. This spinach dal is my favorite because it feels like a warm hug after a long day.',
    tags: ['Budget Meals', 'Kids Lunch', 'Healthy Dinner', 'One Pot Meals'],
    nutrition: {
      calories: 210,
      protein: '11g',
      carbs: '28g',
      fat: '6g'
    }
  },
  {
    id: 'saffron-mango-lassi',
    name: 'Saffron & Cardamom Mango Lassi',
    headline: 'A thick, creamy traditional yogurt shake blended with sweet Alphonso mangoes, fragrant green cardamom, and saffron strands.',
    description: 'A cooling, luxurious drink designed to beat the summer heat. The floral saffron notes contrast beautifully with the rich yogurt and sweet mango pulp.',
    imageUrl: '',
    imagePrompt: 'Two elegant glasses of thick yellow mango lassi garnished with saffron strands, chopped pistachios, and a touch of silver leaf, set against a warm sandy stucco background, soft shadows.',
    prepTime: 5,
    cookTime: 0,
    difficulty: 'Easy',
    cuisine: 'North Indian',
    servings: 2,
    ingredients: [
      { name: 'Sweet Mango Pulp (preferably Alphonso)', amount: 1, unit: 'cup' },
      { name: 'Thick Whole Milk Yogurt (Curd)', amount: 1, unit: 'cup' },
      { name: 'Chilled Milk or Water', amount: 0.5, unit: 'cup' },
      { name: 'Honey or Sugar', amount: 2, unit: 'tbsp' },
      { name: 'Green Cardamom Powder', amount: 0.25, unit: 'tsp' },
      { name: 'Saffron Strands, soaked in 1 tbsp warm milk', amount: 6, unit: 'pcs' },
      { name: 'Crushed Pistachios (for garnish)', amount: 1, unit: 'tsp' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Bloom the Saffron',
        instruction: 'Soak the saffron strands in 1 tablespoon of warm milk for 10 minutes to extract their vibrant golden color and rich aroma.'
      },
      {
        stepNumber: 2,
        title: 'Blend the Ingredients',
        instruction: 'Add the mango pulp, cold yogurt, sugar, cardamom powder, chilled milk, and the bloomed saffron milk to a high-speed blender.'
      },
      {
        stepNumber: 3,
        title: 'Achieve Velvet Smoothness',
        instruction: 'Blend on high speed for 1-2 minutes until thick, frothy, and completely smooth.'
      },
      {
        stepNumber: 4,
        title: 'Serve Chilled',
        instruction: 'Pour into tall glasses. Garnish with a sprinkle of crushed pistachios and a couple of saffron threads. Serve chilled.'
      }
    ],
    chefTips: [
      'Alphonso mangoes yield the most luxurious, fiber-free texture. If using fresh fibrous mangoes, pass the pulp through a sieve first.',
      'Add a couple of ice cubes during blending for a thicker, frostier milkshake consistency.'
    ],
    chefNote: 'Mango Lassi is a celebration of summer. The addition of saffron elevates this drink from a simple street snack to a royal dessert fit for a feast.',
    tags: ['Summer Refreshers', 'Street Food', 'Kids Lunch'],
    nutrition: {
      calories: 190,
      protein: '6g',
      carbs: '32g',
      fat: '4g'
    }
  }
];
