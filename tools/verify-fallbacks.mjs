import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

const IMAGE_RESOLVER_PATH = path.join(projectRoot, 'src/utils/imageResolver.ts');
const PUBLIC_DIR = path.join(projectRoot, 'public');

function verifyFallbacks() {
  console.log('[Verify] Checking fallback images referenced in imageResolver.ts...');
  
  const content = fs.readFileSync(IMAGE_RESOLVER_PATH, 'utf-8');
  
  // Extract all FALLBACK_IMAGES strings
  // We look for patterns like `${FALLBACKS_BASE}/food-fallback-1.webp`
  // Actually, let's just find anything ending in .webp inside FALLBACK_IMAGES block.
  const fallbackImagesMatch = content.match(/FALLBACK_IMAGES\s*=\s*\[([\s\S]*?)\]/);
  
  if (!fallbackImagesMatch) {
    console.error('❌ Could not find FALLBACK_IMAGES array in imageResolver.ts');
    process.exit(1);
  }
  
  const block = fallbackImagesMatch[1];
  const fileRefs = [...block.matchAll(/food-fallback-\d+\.webp/g)].map(m => m[0]);
  
  if (fileRefs.length === 0) {
    console.error('❌ No fallback image references found in the array.');
    process.exit(1);
  }

  let missing = 0;

  for (const ref of fileRefs) {
    const fullPath = path.join(PUBLIC_DIR, 'images', 'fallbacks', ref);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ MISSING FALLBACK ASSET: ${fullPath}`);
      missing++;
    } else {
      console.log(`✅ Found: ${ref}`);
    }
  }

  if (missing > 0) {
    console.error(`\n❌ BUILD FAILED: ${missing} fallback image(s) are missing from public/images/fallbacks/!`);
    console.error('We must never ship a 404 fallback. Please fix the assets before building.');
    process.exit(1);
  }

  console.log('✅ All fallback images verified successfully.\n');
}

verifyFallbacks();
