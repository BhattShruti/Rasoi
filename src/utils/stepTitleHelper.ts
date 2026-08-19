/**
 * Dynamically generates a premium step title based on cooking instructions.
 */
export const generateStepTitle = (instruction: string, stepNumber: number): string => {
  const text = instruction.toLowerCase();
  
  if (stepNumber === 1) return "Prepare the Ingredients";
  
  if (text.includes('garnish') || text.includes('serve') || text.includes('turn off') || text.includes('ready')) {
    return "Finish & Garnish";
  }
  if (text.includes('simmer') || text.includes('boil') || text.includes('water') || text.includes('gravy') || text.includes('sauce') || text.includes('cook for')) {
    return "Simmer the Gravy";
  }
  if (text.includes('sauté') || text.includes('sautey') || text.includes('fry') || text.includes('heat') || text.includes('pan') || text.includes('oil') || text.includes('butter') || text.includes('sizzle')) {
    return "Sauté the Aromatics";
  }
  if (text.includes('blend') || text.includes('grind') || text.includes('puree') || text.includes('paste')) {
    return "Grind to Paste";
  }
  if (text.includes('mix') || text.includes('combine') || text.includes('stir') || text.includes('fold')) {
    return "Stir & Combine";
  }
  if (text.includes('marinate') || text.includes('rub') || text.includes('coat')) {
    return "Marinate the Base";
  }
  if (text.includes('toast') || text.includes('bake') || text.includes('roast')) {
    return "Roast & Toast";
  }
  
  // Fallback: Extract first 3-4 words and format nicely
  const cleanInstruction = instruction.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
  const words = cleanInstruction.split(/\s+/).slice(0, 4);
  if (words.length > 0) {
    const formatted = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return formatted + "...";
  }
  
  return `Step ${stepNumber}`;
};
