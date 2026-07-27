import os
import re

directory = '/home/ammes/Github/Projet_stage_1/Frontend/client/app'

replacements = [
    (r'bg-cyan-600', r'bg-primary'),
    (r'text-cyan-600', r'text-primary'),
    (r'border-cyan-600', r'border-primary'),
    (r'ring-cyan-600', r'ring-primary'),
    (r'hover:text-cyan-600', r'hover:text-primary'),
    (r'hover:bg-cyan-600', r'hover:bg-primary-hover'),
    (r'hover:border-cyan-600', r'hover:border-primary'),
    (r'text-cyan-500', r'text-primary'),
    (r'bg-cyan-500', r'bg-primary'),
    (r'border-cyan-500', r'border-primary'),
    (r'text-cyan-400', r'text-primary'),
    (r'bg-cyan-50', r'bg-primary-subtle'),
    (r'hover:bg-cyan-50', r'hover:bg-primary-subtle'),
    (r'bg-cyan-900/30', r'bg-primary/30'),
    (r'#0891b2', r'#0B0E11'),
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.vue') or file.endswith('.ts') or file.endswith('.css'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = re.sub(old, new, new_content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
