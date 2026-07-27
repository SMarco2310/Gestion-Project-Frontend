import os
import re

directory = '/home/ammes/Github/Projet_stage_1/Frontend/client/app'

# We look for class="..." blocks. If they contain bg-primary AND (text-white OR neo-emboss), we replace bg-primary with btn-primary.
# We also want to replace bg-[#0B0E11] if it was incorrectly used instead of bg-primary in some places.

def process_class_attr(match):
    class_str = match.group(1)
    if 'bg-primary' in class_str or 'bg-[#0B0E11]' in class_str or 'bg-cyan-600' in class_str:
        if 'text-white' in class_str or 'neo-emboss' in class_str or 'btn-primary' not in class_str:
            # Prevent double btn-primary
            class_str = class_str.replace('btn-primary', '')
            class_str = class_str.replace('bg-primary', 'btn-primary')
            class_str = class_str.replace('bg-[#0B0E11]', 'btn-primary')
            class_str = class_str.replace('bg-cyan-600', 'btn-primary')
            
            # Clean up potential double classes (text-white, neo-emboss are in btn-primary)
            # Actually, let's keep them, Tailwind handles duplicates fine.
            return f'class="{class_str}"'
    return match.group(0)

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.vue'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find all class="..." inside the file
            new_content = re.sub(r'class="([^"]*)"', process_class_attr, content)
            
            # Also handle class='...'
            new_content = re.sub(r"class='([^']*)'", lambda m: f"class='{m.group(1).replace('bg-primary', 'btn-primary').replace('bg-[#0B0E11]', 'btn-primary')}'", new_content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
