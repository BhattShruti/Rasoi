import re

with open('src/utils/recipeImageCatalog.ts', 'r', encoding='utf-8') as f:
    text = f.read()

entries = text.split('{')
for entry in entries:
    if 'paneer' in entry.lower():
        canonical_match = re.search(r'"canonical":\s*"(.*?)"', entry)
        image_match = re.search(r'"image":\s*"(.*?)"', entry)
        if canonical_match and image_match:
            print(f"{canonical_match.group(1)} -> {image_match.group(1)}")
            
            aliases_match = re.search(r'"aliases":\s*\[(.*?)\]', entry, re.DOTALL)
            if aliases_match:
                aliases = [a.strip().strip('"') for a in aliases_match.group(1).split(',')]
                print(f"  Aliases: {aliases}")
                
            keywords_match = re.search(r'"keywords":\s*\[(.*?)\]', entry, re.DOTALL)
            if keywords_match:
                keywords = [k.strip().strip('"') for k in keywords_match.group(1).split(',')]
                print(f"  Keywords: {keywords}")
                
            print("-" * 40)
