/**
 * RASOI — Image Resolver Unit Tests
 *
 * Tests the deterministic scored image resolution system.
 * Run with: npx ts-node src/utils/__tests__/imageResolver.test.ts
 *
 * Tests cover:
 *   - The exact titles from the bug report ("Quick Punjabi Tariwali Anda Curry")
 *   - All three egg recipe variants with correct priority ordering
 *   - Hindi/Hinglish transliterations
 *   - Unknown recipes → correct default fallback
 *   - Normalization edge cases
 */

// ── Inline test runner (no extra dependencies) ──────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function expect(label: string, actual: string, expected: string) {
  if (actual === expected) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}`);
    console.error(`      Expected: ${expected}`);
    console.error(`      Received: ${actual}`);
    failed++;
    failures.push(label);
  }
}

// ── Import resolver ──────────────────────────────────────────────────────────
// ts-node resolves from project root; adjust path if running from elsewhere
import { resolveRecipeImage, normalizeRecipeTitle } from '../imageResolver';

const RECIPES = '/images/recipes';
const DEFAULT  = '/images/default-food.webp';

// ════════════════════════════════════════════════════════════════════════════
// 1. NORMALIZATION TESTS
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 1. Normalization ─────────────────────────────────────────');

expect(
  'anda → egg transliteration',
  normalizeRecipeTitle('Anda Curry'),
  'egg curry'
);
expect(
  'ande → egg transliteration',
  normalizeRecipeTitle('Ande Masala'),
  'egg masala'
);
expect(
  'tariwali → curry transliteration',
  normalizeRecipeTitle('Tariwali Anda'),
  'curry egg'
);
expect(
  'omlette → omelette normalization',
  normalizeRecipeTitle('Egg Omlette'),
  'egg omelette'
);
expect(
  'omelet → omelette normalization',
  normalizeRecipeTitle('Egg Omelet'),
  'egg omelette'
);
expect(
  'Punctuation removed',
  normalizeRecipeTitle("Maa's Dal"),
  'maas dal'
);
expect(
  'Extra whitespace collapsed',
  normalizeRecipeTitle('  Egg   Curry  '),
  'egg curry'
);
expect(
  'Uppercase handled',
  normalizeRecipeTitle('EGG HALF FRY'),
  'egg half fry'
);

// ════════════════════════════════════════════════════════════════════════════
// 2. EGG CURRY TESTS (the original bug report)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 2. Egg Curry ─────────────────────────────────────────────');

expect(
  '"Quick Punjabi Tariwali Anda Curry" → egg-curry.jpg',
  resolveRecipeImage('Quick Punjabi Tariwali Anda Curry'),
  `${RECIPES}/egg-curry.jpg`
);
expect(
  '"Punjabi Anda Curry" → egg-curry.jpg',
  resolveRecipeImage('Punjabi Anda Curry'),
  `${RECIPES}/egg-curry.jpg`
);
expect(
  '"Homestyle Spiced Egg Curry" → egg-curry.jpg',
  resolveRecipeImage('Homestyle Spiced Egg Curry'),
  `${RECIPES}/egg-curry.jpg`
);
expect(
  '"Egg Curry" → egg-curry.jpg',
  resolveRecipeImage('Egg Curry'),
  `${RECIPES}/egg-curry.jpg`
);
expect(
  '"Homestyle Anda Curry" → egg-curry.jpg',
  resolveRecipeImage('Homestyle Anda Curry'),
  `${RECIPES}/egg-curry.jpg`
);
expect(
  '"Dhaba Anda Curry" → egg-curry.jpg',
  resolveRecipeImage('Dhaba Anda Curry'),
  `${RECIPES}/egg-curry.jpg`
);
expect(
  '"Egg Masala" → egg-curry.jpg',
  resolveRecipeImage('Egg Masala'),
  `${RECIPES}/egg-curry.jpg`
);
expect(
  '"Anda Masala" → egg-curry.jpg',
  resolveRecipeImage('Anda Masala'),
  `${RECIPES}/egg-curry.jpg`
);

// ════════════════════════════════════════════════════════════════════════════
// 3. EGG OMELETTE TESTS
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 3. Egg Omelette ──────────────────────────────────────────');

expect(
  '"Egg Omelette" → egg-omlette.jpg',
  resolveRecipeImage('Egg Omelette'),
  `${RECIPES}/egg-omlette.jpg`
);
expect(
  '"Egg Omlette" → egg-omlette.jpg',
  resolveRecipeImage('Egg Omlette'),
  `${RECIPES}/egg-omlette.jpg`
);
expect(
  '"Egg Omelet" → egg-omlette.jpg',
  resolveRecipeImage('Egg Omelet'),
  `${RECIPES}/egg-omlette.jpg`
);
expect(
  '"Anda Omelette" → egg-omlette.jpg',
  resolveRecipeImage('Anda Omelette'),
  `${RECIPES}/egg-omlette.jpg`
);
expect(
  '"Masala Omelette" → egg-omlette.jpg',
  resolveRecipeImage('Masala Omelette'),
  `${RECIPES}/egg-omlette.jpg`
);
expect(
  '"Masala Omlette" → egg-omlette.jpg',
  resolveRecipeImage('Masala Omlette'),
  `${RECIPES}/egg-omlette.jpg`
);

// ════════════════════════════════════════════════════════════════════════════
// 4. EGG HALF FRY TESTS
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 4. Egg Half Fry ──────────────────────────────────────────');

expect(
  '"Egg Half Fry" → egg-half-fry.jpg',
  resolveRecipeImage('Egg Half Fry'),
  `${RECIPES}/egg-half-fry.jpg`
);
expect(
  '"Anda Half Fry" → egg-half-fry.jpg',
  resolveRecipeImage('Anda Half Fry'),
  `${RECIPES}/egg-half-fry.jpg`
);
expect(
  '"Half Fry Egg" → egg-half-fry.jpg',
  resolveRecipeImage('Half Fry Egg'),
  `${RECIPES}/egg-half-fry.jpg`
);
expect(
  '"Ande Half Fry" → egg-half-fry.jpg',
  resolveRecipeImage('Ande Half Fry'),
  `${RECIPES}/egg-half-fry.jpg`
);

// ════════════════════════════════════════════════════════════════════════════
// 5. PRIORITY / SPECIFICITY ORDERING TESTS
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 5. Specificity Priority ─────────────────────────────────');

expect(
  '"Egg Omelette" must NOT resolve to egg-curry.jpg',
  resolveRecipeImage('Egg Omelette') !== `${RECIPES}/egg-curry.jpg` ? 'PASS' : 'FAIL',
  'PASS'
);
expect(
  '"Egg Half Fry" must NOT resolve to egg-curry.jpg',
  resolveRecipeImage('Egg Half Fry') !== `${RECIPES}/egg-curry.jpg` ? 'PASS' : 'FAIL',
  'PASS'
);
expect(
  '"Egg Half Fry" must NOT resolve to egg-omlette.jpg',
  resolveRecipeImage('Egg Half Fry') !== `${RECIPES}/egg-omlette.jpg` ? 'PASS' : 'FAIL',
  'PASS'
);
expect(
  '"Egg Omelette" must NOT resolve to egg-half-fry.jpg',
  resolveRecipeImage('Egg Omelette') !== `${RECIPES}/egg-half-fry.jpg` ? 'PASS' : 'FAIL',
  'PASS'
);

// ════════════════════════════════════════════════════════════════════════════
// 6. DEFAULT FALLBACK TESTS
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── 6. Default Fallback ──────────────────────────────────────');

expect(
  '"Completely Unknown Recipe Name" → default',
  resolveRecipeImage('Completely Unknown Recipe Name'),
  DEFAULT
);
expect(
  'Empty string → default',
  resolveRecipeImage(''),
  DEFAULT
);
expect(
  'Whitespace only → default',
  resolveRecipeImage('   '),
  DEFAULT
);
expect(
  '"Rajma Chawal" (no asset yet) → default',
  resolveRecipeImage('Rajma Chawal'),
  DEFAULT
);
expect(
  '"Paneer Butter Masala" (asset not on disk) → default',
  resolveRecipeImage('Paneer Butter Masala'),
  DEFAULT
);
expect(
  '"Chicken Biryani" (asset not on disk) → default',
  resolveRecipeImage('Chicken Biryani'),
  DEFAULT
);

// ════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ════════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.error('\nFailed tests:');
  failures.forEach(f => console.error(`  - ${f}`));
  throw new Error(`${failed} test(s) failed`);
} else {
  console.log('All tests passed! ✅');
}
