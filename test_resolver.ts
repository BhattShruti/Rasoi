import { resolveBatchRecipeImages } from './src/utils/imageResolver';

const recipes = [
  { name: 'Paneer Bhurji' },
  { name: 'Quick Tawa Paneer Masala' },
  { name: 'Paneer Capsicum Stir-Fry' }
];

console.log("Resolving...");
const results = resolveBatchRecipeImages(recipes);
console.log(results);
