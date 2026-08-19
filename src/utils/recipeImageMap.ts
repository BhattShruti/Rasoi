/**
 * DEPRECATED — This file is no longer the source of truth for recipe images.
 *
 * The image catalog has been migrated to:
 *   src/utils/recipeImageCatalog.ts  ← catalog entries (the only thing to edit)
 *   src/utils/imageResolver.ts       ← smart scoring resolver
 *
 * This file is kept only to prevent TypeScript import errors if any old code
 * still references it. It is intentionally empty. Safe to delete after
 * confirming no remaining imports.
 *
 * @deprecated Use resolveRecipeImage() from imageResolver.ts instead.
 */
export const recipeImageMap: Record<string, string> = {};
