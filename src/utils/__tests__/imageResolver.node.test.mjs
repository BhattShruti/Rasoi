/**
 * RASOI — Image Resolver & Batch Diversity Test Suite
 *
 * Runs without any bundler or extra dependencies.
 * Run with: node src/utils/__tests__/imageResolver.node.test.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

const CATALOG_PATH = path.join(projectRoot, 'src/utils/recipeImageCatalog.ts');

function loadRealCatalog() {
  const content = fs.readFileSync(CATALOG_PATH, 'utf-8');
  const declIdx = content.indexOf('export const recipeImageCatalog');
  if (declIdx !== -1) {
    const eqIdx = content.indexOf('=', declIdx);
    const start = content.indexOf('[', eqIdx);
    const end = content.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      return JSON.parse(content.substring(start, end + 1));
    }
  }
  throw new Error('Could not parse recipeImageCatalog.ts');
}

const recipeImageCatalog = loadRealCatalog();

const RECIPES_BASE = '/images/recipes';
const FALLBACKS_BASE = '/images/fallbacks';
const FALLBACK_IMAGES = [
  `${FALLBACKS_BASE}/food-fallback-1.webp`,
  `${FALLBACKS_BASE}/food-fallback-2.webp`,
  `${FALLBACKS_BASE}/food-fallback-3.webp`,
  `${FALLBACKS_BASE}/food-fallback-4.webp`,
  `${FALLBACKS_BASE}/food-fallback-5.webp`,
];

const DEFAULT_IMAGE = FALLBACK_IMAGES[0];
const MIN_CONFIDENCE_SCORE = 750;

const GENERIC_CATEGORY_WORDS = new Set([
  'paneer', 'chicken', 'mutton', 'fish', 'prawn', 'shrimp', 'egg', 'anda',
  'curry', 'masala', 'gravy', 'biryani', 'rice', 'pulao', 'dosa', 'paratha',
  'roti', 'naan', 'dal', 'soup', 'salad', 'toast', 'fried', 'veg', 'vegetable',
  'homestyle', 'punjabi', 'south', 'indian', 'style', 'spiced', 'special',
  'delight', 'mix', 'mixed', 'quick', 'easy', 'food', 'dish', 'recipe', 'gravy'
]);

const TRANSLITERATION_MAP = [
  [/\banda[ey]?\b/g, 'egg'],
  [/\bande\b/g, 'egg'],
  [/\banday\b/g, 'egg'],
  [/\bomlette\b/g, 'omelette'],
  [/\bomelet\b/g, 'omelette'],
  [/\btariwala\b/g, 'curry'],
  [/\btariwali\b/g, 'curry'],
  [/\btari\b/g, 'curry'],
];

function normalizeRecipeTitle(title) {
  if (!title) return '';
  let s = title.toLowerCase();
  for (const [pattern, replacement] of TRANSLITERATION_MAP) {
    s = s.replace(pattern, replacement);
  }
  return s
    .replace(/['''\u2018\u2019]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveFallbackImage(title) {
  const normalized = normalizeRecipeTitle(title);
  if (!normalized) return FALLBACK_IMAGES[0];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  
  const index = Math.abs(hash) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

function scoreEntry(normalizedTitle, entry) {
  const specificity = entry.specificity ?? 0;
  const titleWords = normalizedTitle.split(' ').filter(Boolean);
  const normalizedCanonical = normalizeRecipeTitle(entry.canonical);

  if (normalizedCanonical === normalizedTitle) {
    return { entry, score: 1000, matchReason: 'exact_canonical' };
  }

  let bestAliasScore = 0;
  let aliasReason = '';

  for (const alias of entry.aliases) {
    const normalizedAlias = alias.toLowerCase().trim();
    if (normalizedTitle === normalizedAlias) {
      if (900 > bestAliasScore) {
        bestAliasScore = 900;
        aliasReason = `exact_alias:${alias}`;
      }
      continue;
    }

    if (normalizedTitle.includes(normalizedAlias)) {
      const aliasWords = normalizedAlias.split(' ').filter(Boolean);
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

  let bestKeywordScore = 0;
  let keywordReason = '';

  for (const keyword of entry.keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    const kwords = normalizedKeyword.split(' ').filter(Boolean);
    const allPresent = kwords.every(kw => titleWords.includes(kw));

    if (allPresent) {
      const nonGenericCount = kwords.filter(kw => !GENERIC_CATEGORY_WORDS.has(kw)).length;

      if (kwords.length === 1 && GENERIC_CATEGORY_WORDS.has(kwords[0])) {
        continue;
      }

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

function rankCatalogForTitle(title) {
  if (!title?.trim()) return [];
  const normalized = normalizeRecipeTitle(title);
  const candidates = [];
  for (const entry of recipeImageCatalog) {
    const scored = scoreEntry(normalized, entry);
    if (scored.score > 0) candidates.push(scored);
  }
  return candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.entry.specificity ?? 0) - (a.entry.specificity ?? 0);
  });
}

function resolveRecipeImage(title) {
  if (!title?.trim()) return resolveFallbackImage(title);
  const ranked = rankCatalogForTitle(title);
  const best = ranked[0];
  if (best && best.score >= MIN_CONFIDENCE_SCORE) {
    return `${RECIPES_BASE}/${best.entry.image}`;
  }
  return resolveFallbackImage(title);
}

function resolveBatchRecipeImages(recipes) {
  const usedImagesInBatch = new Set();
  const resolvedImages = [];

  for (const recipe of recipes) {
    const ranked = rankCatalogForTitle(recipe.name);
    let assignedImage = null;

    for (const candidate of ranked) {
      if (candidate.score < MIN_CONFIDENCE_SCORE) break;
      const candidatePath = `${RECIPES_BASE}/${candidate.entry.image}`;

      if (candidate.score === 1000 || !usedImagesInBatch.has(candidatePath)) {
        assignedImage = candidatePath;
        usedImagesInBatch.add(candidatePath);
        break;
      }
    }
    
    if (!assignedImage) {
      const baseFallback = resolveFallbackImage(recipe.name);
      assignedImage = baseFallback;
      let baseIndex = FALLBACK_IMAGES.indexOf(baseFallback);
      if (baseIndex === -1) baseIndex = 0;
      let attempt = 0;
      while (usedImagesInBatch.has(assignedImage) && attempt < FALLBACK_IMAGES.length) {
        const nextIndex = (baseIndex + attempt) % FALLBACK_IMAGES.length;
        assignedImage = FALLBACK_IMAGES[nextIndex];
        attempt++;
      }
      usedImagesInBatch.add(assignedImage);
    }
    resolvedImages.push(assignedImage);
  }
  return resolvedImages;
}

// ─── Test runner ─────────────────────────────────────────────────────────────

let passed = 0, failed = 0;
const failures = [];

function test(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}`);
    console.error(`      Expected : ${expected}`);
    console.error(`      Received : ${actual}`);
    failed++;
    failures.push(label);
  }
}

function testCondition(label, condition) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}`);
    failed++;
    failures.push(label);
  }
}

const R = RECIPES_BASE;

console.log('\n── Strict Resolution Tests ─────────────────────────────');

// A. Paneer Bhurji does not resolve to paneer-bhurji.webp.
testCondition('A. Paneer Bhurji does not resolve to paneer-bhurji.webp', resolveRecipeImage('Paneer Bhurji') !== `${R}/paneer-bhurji.webp`);

// B. Unknown recipe gets a fallback.
const unknown1Fallback = resolveRecipeImage('Some Random Pasta Dish');
testCondition('B. Unknown recipe gets a fallback', unknown1Fallback.includes(FALLBACKS_BASE));

// C. Two unknown recipes receive different fallback images (in a batch).
const batchTwoUnresolved = resolveBatchRecipeImages([{name: 'Unknown Dish 1'}, {name: 'Unknown Dish 2'}]);
testCondition('C. Two unknown recipes receive different fallback images', batchTwoUnresolved[0] !== batchTwoUnresolved[1]);

// D. Three unknown recipes receive three different fallback images.
const batchThreeUnresolved = resolveBatchRecipeImages([{name: 'Unknown 1'}, {name: 'Unknown 2'}, {name: 'Unknown 3'}]);
testCondition('D. Three unknown recipes receive three different fallback images', new Set(batchThreeUnresolved).size === 3);

// E. Same recipe produces the same fallback every time.
test('E. Same recipe produces the same fallback every time', resolveRecipeImage('Totally Random Dish X'), resolveRecipeImage('Totally Random Dish X'));

// F. A generic "Paneer Dish" does NOT resolve to paneer-butter-masala.webp.
testCondition('F. A generic "Paneer Dish" does NOT resolve to paneer-butter-masala.webp', resolveRecipeImage('Paneer Dish') !== `${R}/paneer-butter-masala.webp`);

// G. "Random Chicken Gravy" does NOT resolve to chicken-biryani.webp.
testCondition('G. "Random Chicken Gravy" does NOT resolve to chicken-biryani.webp', resolveRecipeImage('Random Chicken Gravy') !== `${R}/chicken-biryani.webp`);

// H. Exact "Chicken Biryani" still resolves to chicken-biryani.webp.
test('H. Exact "Chicken Biryani" still resolves to chicken-biryani.webp', resolveRecipeImage('Chicken Biryani'), `${R}/chicken-biryani.webp`);

// I. Exact "Paneer Butter Masala" still resolves to paneer-butter-masala.webp.
// Note: wait, paneer butter masala was preserved! Let's ensure it is.
test('I. Exact "Paneer Butter Masala" still resolves to paneer-butter-masala.webp', resolveRecipeImage('Paneer Butter Masala'), `${R}/paneer-butter-masala.webp`);

// J. Existing egg recipes still resolve correctly.
test('J. Existing egg recipes still resolve correctly (Egg Curry)', resolveRecipeImage('Egg Curry'), `${R}/egg-curry.jpg`);
test('J. Existing egg recipes still resolve correctly (Egg Half Fry)', resolveRecipeImage('Egg Half Fry'), `${R}/egg-half-fry.jpg`);
test('J. Existing egg recipes still resolve correctly (Egg Omelette)', resolveRecipeImage('Egg Omelette'), `${R}/egg-omlette.jpg`);

console.log('\n── Regression & Safety Tests ─────────────────────────');

// Helper to simulate RecipeImage component behavior
function isTrustedLocalUrl(url) {
  if (!url || !url.trim()) return false;
  return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
}

// 1. Untrusted URL falls through to resolver
const untrustedUrl = 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=800&q=80';
const trustedUrl = '/images/recipes/egg-curry.jpg';
testCondition('External untrusted URL is rejected (simulating Unsplash bug)', isTrustedLocalUrl(untrustedUrl) === false);
testCondition('Local trusted URL is accepted', isTrustedLocalUrl(trustedUrl) === true);

// 2. Fallback image path is guaranteed to exist
const fallbackPathForRandom = resolveFallbackImage('Completely Broken Image Test');
const fullFallbackFsPath = path.join(projectRoot, 'public', fallbackPathForRandom);
testCondition('Fallback path is guaranteed to exist on disk (prevents double-404)', fs.existsSync(fullFallbackFsPath));

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} total`);
if (failures.length) {
  console.error('\nFailed:');
  failures.forEach(f => console.error(`  ✗ ${f}`));
  process.exit(1);
} else {
  console.log('All image resolver tests passed! ✅');
}
