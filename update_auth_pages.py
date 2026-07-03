import os
import glob

auth_dir = "/home/ammes/Github/Projet_stage_1/Frontend/client/app/pages/auth"
files = glob.glob(os.path.join(auth_dir, "*/index.vue"))

for file in files:
    with open(file, "r") as f:
        content = f.read()
    
    # 1. Update container padding
    content = content.replace(
        '<div class="relative min-h-[100dvh] flex items-center justify-center p-0 lg:p-4">',
        '<div class="relative min-h-[100dvh] flex items-center justify-center p-0 lg:p-8">'
    )
    content = content.replace(
        '<div class="relative min-h-[100dvh] flex items-center justify-center p-0 lg:p-4 overflow-y-auto">',
        '<div class="relative min-h-[100dvh] flex items-center justify-center p-0 lg:p-8 overflow-y-auto">'
    )
    
    # 2. Hide background image on mobile
    content = content.replace(
        'class="absolute inset-0 w-full h-full object-cover"',
        'class="absolute inset-0 w-full h-full object-cover hidden lg:block"'
    )
    content = content.replace(
        'class="absolute inset-0 w-full h-full object-cover fixed"',
        'class="absolute inset-0 w-full h-full object-cover fixed hidden lg:block"'
    )
    
    # 3. Hide gradient on mobile
    content = content.replace(
        'class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20"',
        'class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20 hidden lg:block"'
    )
    content = content.replace(
        'class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20 fixed"',
        'class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20 fixed hidden lg:block"'
    )
    
    # 4. Hide branding text on mobile
    content = content.replace(
        '<span class="text-white font-bold text-2xl tracking-wide">Gestion de Projets</span>',
        '<span class="hidden lg:block text-white font-bold text-2xl tracking-wide">Gestion de Projets</span>'
    )
    # Also remove drop-shadow on mobile for the logo so it looks clean
    content = content.replace(
        'class="w-10 h-10 object-contain drop-shadow-md"',
        'class="w-10 h-10 object-contain drop-shadow-none lg:drop-shadow-md"'
    )
    
    # 5. Adjust main container
    content = content.replace(
        'min-h-[100dvh] lg:min-h-[calc(100vh-2rem)] flex flex-col',
        'min-h-[100dvh] lg:min-h-[calc(100vh-4rem)] flex flex-col'
    )
    
    # 6. Adjust floating tile
    # For login, signup, reset-password, forget-password (they might have slight variations in the class string, like `relative` for forget-password)
    # We will just do a regex or substring replacement on the tile's classes
    import re
    # Match the whole class attribute of the floating card
    pattern = r'(<div class="[^"]*min-h-\[100dvh\] lg:min-h-\[calc\(100vh-2rem\)\] flex flex-col justify-center bg-white dark:bg-\[#1D1D1D\] rounded-none) lg:rounded-\[1\.5rem\] (lg:neo-card p-8 sm:p-12 lg:p-16 xl:p-20) lg:ml-auto border-0 (lg:border border-white/50 dark:border-white/5">)'
    replacement = r'\1 lg:rounded-2xl lg:shadow-2xl lg:neo-card p-8 pt-28 sm:p-12 lg:px-16 xl:px-20 lg:ml-auto border-0 \3'
    # Wait, the min-h-[calc(100vh-2rem)] needs to be removed for the tile!
    pattern = r'(<div class="[^"]*w-full lg:w-1/2 max-w-\[700px\] min-h-\[100dvh\] )lg:min-h-\[calc\(100vh-2rem\)\] (flex flex-col justify-center bg-white dark:bg-\[#1D1D1D\] rounded-none) lg:rounded-\[1\.5rem\] (lg:neo-card p-8 sm:p-12 lg:p-16 xl:p-20) (lg:ml-auto border-0 lg:border border-white/50 dark:border-white/5">)'
    replacement = r'\1lg:min-h-0 lg:h-auto lg:py-16 \2 lg:rounded-2xl lg:shadow-2xl lg:neo-card p-8 pt-28 sm:p-12 lg:px-16 xl:px-20 \4'
    content = re.sub(pattern, replacement, content)
    
    with open(file, "w") as f:
        f.write(content)
    
    print(f"Updated {file}")

