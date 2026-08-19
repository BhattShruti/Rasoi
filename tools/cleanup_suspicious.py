import json
import os
import re

with open('tools/suspicious_files.json', 'r', encoding='utf-8') as f:
    suspicious_files = json.load(f)

# 1. Update image-attribution.json
with open('public/images/image-attribution.json', 'r', encoding='utf-8') as f:
    attribution_data = json.load(f)

for f in suspicious_files:
    if f in attribution_data:
        del attribution_data[f]

with open('public/images/image-attribution.json', 'w', encoding='utf-8') as f:
    json.dump(attribution_data, f, indent=2)

# 2. Update recipeImageCatalog.ts
with open('src/utils/recipeImageCatalog.ts', 'r', encoding='utf-8') as f:
    catalog_text = f.read()

# We need to carefully remove the JSON objects from the TypeScript array
def remove_catalog_entries(text, files_to_remove):
    # Find all { ... } blocks
    blocks = list(re.finditer(r'\{[^{}]*\}', text))
    # We iterate backwards to not mess up indices when removing
    for match in reversed(blocks):
        block_text = match.group(0)
        # Check if the block has an image in files_to_remove
        image_match = re.search(r'"image":\s*"(.*?)"', block_text)
        if image_match and image_match.group(1) in files_to_remove:
            # Remove this block and the trailing comma if present
            start = match.start()
            end = match.end()
            # Look ahead for a comma and optional whitespace
            lookahead = text[end:end+10]
            comma_match = re.match(r'\s*,\s*', lookahead)
            if comma_match:
                end += comma_match.end()
            else:
                # Maybe it was the last element, look behind for comma
                lookbehind = text[start-10:start]
                comma_match = re.search(r',\s*$', lookbehind)
                if comma_match:
                    start = start - (len(lookbehind) - comma_match.start())
                    
            text = text[:start] + text[end:]
    return text

new_catalog = remove_catalog_entries(catalog_text, set(suspicious_files))

with open('src/utils/recipeImageCatalog.ts', 'w', encoding='utf-8') as f:
    f.write(new_catalog)

# 3. Delete files from disk
for f in suspicious_files:
    filepath = os.path.join('public', 'images', 'recipes', f)
    if os.path.exists(filepath):
        os.remove(filepath)
        print(f"Deleted: {filepath}")

print(f"Cleanup complete. Removed {len(suspicious_files)} suspicious images.")
