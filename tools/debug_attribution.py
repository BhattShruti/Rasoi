import json

with open('public/images/image-attribution.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for key, img in data.items():
    if 'paneer' in img.get('filename', '').lower() or 'paneer' in img.get('title', '').lower():
        print(f"{img.get('filename', key)} -> Source Title: {img.get('title', 'N/A')}")
