/**
 * RASOI — Smart Recipe Image Resolver with Confidence Threshold & Batch Diversity
 *
 * Strict Resolution Hierarchy:
 *   1. Exact Canonical Title Match                → Score 1000
 *   2. Exact Alias Match                          → Score 900
 *   3. Multi-word Phrase Match (2+ words)         → Score 800 + (phrase word count × 20)
 *   4. Distinctive Multi-Keyword Sequence         → Score 600 + (matching words × 30) + specificity
 *   5. Low Confidence (< 750)                     → Fallback to /images/default-food.webp
 *
 * Single generic category words ("paneer", "chicken", "egg", "curry", "rice", "dal",
 * "masala", "dosa", "paratha") MUST NEVER score above threshold on their own.
 */

import { recipeImageCatalog, type CatalogEntry } from './recipeImageCatalog';

const RECIPES_BASE = '/images/recipes';
const FALLBACKS_BASE = '/images/fallbacks';
export const DEFAULT_IMAGE = `${FALLBACKS_BASE}/food-fallback-1.webp`; // Legacy default

const FALLBACK_IMAGES = [
  `${FALLBACKS_BASE}/food-fallback-1.webp`,
  `${FALLBACKS_BASE}/food-fallback-2.webp`,
  `${FALLBACKS_BASE}/food-fallback-3.webp`,
  `${FALLBACKS_BASE}/food-fallback-4.webp`,
  `${FALLBACKS_BASE}/food-fallback-5.webp`,
];

/** Minimum confidence score required to display a food photograph over the default fallback */
export const MIN_CONFIDENCE_SCORE = 750;

/** 
 * Deterministically select a fallback image based on the recipe title 
 */
export function resolveFallbackImage(title: string): string {
  const normalized = normalizeRecipeTitle(title);
  if (!normalized) return FALLBACK_IMAGES[0];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

/** Single generic category words that cannot uniquely identify a recipe on their own */
const GENERIC_CATEGORY_WORDS = new Set([
  'paneer', 'chicken', 'mutton', 'fish', 'prawn', 'shrimp', 'egg', 'anda',
  'curry', 'masala', 'gravy', 'biryani', 'rice', 'pulao', 'dosa', 'paratha',
  'roti', 'naan', 'dal', 'soup', 'salad', 'toast', 'fried', 'veg', 'vegetable',
  'homestyle', 'punjabi', 'south', 'indian', 'style', 'spiced', 'special',
  'delight', 'mix', 'mixed', 'quick', 'easy', 'food', 'dish', 'recipe', 'gravy'
]);

const TRANSLITERATION_MAP: [RegExp, string][] = [
  [/\banda[ey]?\b/g, 'egg'],
  [/\bande\b/g, 'egg'],
  [/\banday\b/g, 'egg'],
  [/\bomlette\b/g, 'omelette'],
  [/\bomelet\b/g, 'omelette'],
  [/\btariwala\b/g, 'curry'],
  [/\btariwali\b/g, 'curry'],
  [/\btari\b/g, 'curry'],
];

export function normalizeRecipeTitle(title: string): string {
  if (!title) return '';

  let s = title.toLowerCase();

  for (const [pattern, replacement] of TRANSLITERATION_MAP) {
    s = s.replace(pattern, replacement);
  }

  return s
    .replace(/[''\u2018\u2019]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ScoredCandidate {
  entry: CatalogEntry;
  score: number;
  matchReason: string;
}

/**
 * Scores a catalog entry against a normalized recipe title.
 */
export function scoreEntry(normalizedTitle: string, entry: CatalogEntry): ScoredCandidate {
  const specificity = entry.specificity ?? 0;
  const titleWords = normalizedTitle.split(' ').filter(Boolean);
  const normalizedCanonical = normalizeRecipeTitle(entry.canonical);

  // 1. Exact Canonical Title Match
  if (normalizedCanonical === normalizedTitle) {
    return { entry, score: 1000, matchReason: 'exact_canonical' };
  }

  // 2 & 3. Alias Matching
  let bestAliasScore = 0;
  let aliasReason = '';

  for (const alias of entry.aliases) {
    const normalizedAlias = alias.toLowerCase().trim();

    // Exact full alias match
    if (normalizedTitle === normalizedAlias) {
      if (900 > bestAliasScore) {
        bestAliasScore = 900;
        aliasReason = `exact_alias:${alias}`;
      }
      continue;
    }

    // Phrase match within title
    if (normalizedTitle.includes(normalizedAlias)) {
      const aliasWords = normalizedAlias.split(' ').filter(Boolean);
      // Only multi-word phrases (2+ words) qualify for high-confidence phrase match
      if (aliasWords.length >= 2) {
        const phraseScore = 800 + aliasWords.length * 20 + specificity * 0.5;
        if (phraseScore > bestAliasScore) {
          bestAliasScore = phraseScore;
          aliasReason = `multiword_phrase:${alias}`;
        }
      }
    }
  }

  if (bestAliasScore > 0) {
    return { entry, score: Math.round(bestAliasScore), matchReason: aliasReason };
  }

  // 4. Keyword Sequence Matching (Requires distinctive words)
  let bestKeywordScore = 0;
  let keywordReason = '';

  for (const keyword of entry.keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    const kwords = normalizedKeyword.split(' ').filter(Boolean);

    // Check if all words in the keyword sequence appear in the title
    const allPresent = kwords.every(kw => titleWords.includes(kw));

    if (allPresent) {
      // Count how many non-generic distinctive words are matched
      const nonGenericCount = kwords.filter(kw => !GENERIC_CATEGORY_WORDS.has(kw)).length;

      // Single generic keyword on its own is NOT sufficient
      if (kwords.length === 1 && GENERIC_CATEGORY_WORDS.has(kwords[0])) {
        continue;
      }

      // Must have at least 1 non-generic word or 2+ combined words
      if (nonGenericCount >= 1 || kwords.length >= 2) {
        const score = 600 + kwords.length * 30 + nonGenericCount * 40 + specificity;
        if (score > bestKeywordScore) {
          bestKeywordScore = score;
          keywordReason = `distinctive_keyword:${keyword}`;
        }
      }
    }
  }

  if (bestKeywordScore > 0) {
    return { entry, score: Math.round(bestKeywordScore), matchReason: keywordReason };
  }

  return { entry, score: 0, matchReason: 'none' };
}

/**
 * Ranks all catalog entries for a given recipe title.
 */
export function rankCatalogForTitle(title: string): ScoredCandidate[] {
  if (!title?.trim()) return [];

  const normalized = normalizeRecipeTitle(title);
  const candidates: ScoredCandidate[] = [];

  for (const entry of recipeImageCatalog) {
    const scored = scoreEntry(normalized, entry);
    if (scored.score > 0) {
      candidates.push(scored);
    }
  }

  return candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.entry.specificity ?? 0) - (a.entry.specificity ?? 0);
  });
}

/**
 * Resolves a single recipe title to an image path.
 * Returns default fallback image if top match score < MIN_CONFIDENCE_SCORE (750).
 */
export function resolveRecipeImage(title: string): string {
  if (!title?.trim()) return resolveFallbackImage(title);

  const ranked = rankCatalogForTitle(title);
  const best = ranked[0];

  if (best && best.score >= MIN_CONFIDENCE_SCORE) {
    if (import.meta.env?.DEV) {
      console.info(`[Rasoi Image Debug] "${title}" -> ${best.entry.image} (Score: ${best.score}, Reason: ${best.matchReason})`);
    }
    return `${RECIPES_BASE}/${best.entry.image}`;
  }

  const fallback = resolveFallbackImage(title);
  if (import.meta.env?.DEV) {
    console.info(`[Rasoi Image Debug] "${title}" -> FALLBACK ${fallback} (Top score: ${best?.score ?? 0} < ${MIN_CONFIDENCE_SCORE})`);
  }

  return fallback;
}

/**
 * Per-Response Batch Image Diversity & Allocation Engine.
 *
 * Resolves an array of recipe objects (e.g. 3 recipes in one Gemini response)
 * so that no two recipes receive the same image asset within the batch unless
 * they represent the exact same dish (score 1000).
 *
 * @param recipes Array of recipe objects containing at minimum { name: string }
 * @returns Array of resolved image URLs corresponding to each input recipe
 */
export function resolveBatchRecipeImages(
  recipes: Array<{ name: string }>
): string[] {
  const usedImagesInBatch = new Set<string>();
  const resolvedImages: string[] = [];

  for (const recipe of recipes) {
    const ranked = rankCatalogForTitle(recipe.name);

    let assignedImage: string | null = null;

    // 1. Try to allocate a specific recipe image
    for (const candidate of ranked) {
      if (candidate.score < MIN_CONFIDENCE_SCORE) {
        break; // Stop if candidate is below confidence threshold
      }

      const candidatePath = `${RECIPES_BASE}/${candidate.entry.image}`;

      // Allow reuse ONLY if exact canonical match (score 1000)
      if (candidate.score === 1000 || !usedImagesInBatch.has(candidatePath)) {
        assignedImage = candidatePath;
        usedImagesInBatch.add(candidatePath);
        
        if (import.meta.env?.DEV) {
          console.info(`[Rasoi Batch Debug] "${recipe.name}" -> ${candidatePath} (Score: ${candidate.score}, Reason: ${candidate.matchReason})`);
        }
        break;
      } else {
        if (import.meta.env?.DEV) {
          console.info(`[Rasoi Batch Debug] "${recipe.name}" skipped ${candidatePath} (Already used in batch)`);
        }
      }
    }

    // 2. If no specific image resolved, assign a fallback image
    if (!assignedImage) {
      const baseFallback = resolveFallbackImage(recipe.name);
      assignedImage = baseFallback;
      
      // Batch Diversity for Fallbacks: find an unused fallback if possible
      let baseIndex = FALLBACK_IMAGES.indexOf(baseFallback);
      if (baseIndex === -1) baseIndex = 0;
      
      let attempt = 0;
      while (usedImagesInBatch.has(assignedImage) && attempt < FALLBACK_IMAGES.length) {
        const nextIndex = (baseIndex + attempt) % FALLBACK_IMAGES.length;
        assignedImage = FALLBACK_IMAGES[nextIndex];
        attempt++;
      }

      usedImagesInBatch.add(assignedImage);

      if (import.meta.env?.DEV) {
        const best = ranked[0];
        console.info(`[Rasoi Batch Debug] "${recipe.name}" -> FALLBACK ${assignedImage} (Top score: ${best?.score ?? 0} < ${MIN_CONFIDENCE_SCORE})`);
      }
    }

    resolvedImages.push(assignedImage);
  }

  return resolvedImages;
}

export function getDefaultFoodImage(): string {
  return FALLBACK_IMAGES[0];
}

export function isTrustedLocalUrl(url: string | undefined | null): boolean {
  if (!url || !url.trim()) return false;
  return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
}

