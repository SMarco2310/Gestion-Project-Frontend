<script setup lang="ts">

</script>

<template>
    <div>
        <!-- Top Horizontal Bar (Top of the L) -->
        <header class="fixed top-0 left-0 right-0 h-20 bg-[#1D1D1D] border-b border-gray-800 z-50 flex justify-between items-center px-8">
            <!-- Logo & Brand -->
            <div class="flex items-center gap-4">
                <NuxtLink to="/">
                    <img src="/assets/obsidian_velocity_icon_only.png" class="w-8 h-8" alt="Logo">
                </NuxtLink>
                <h1 class="text-2xl font-bold text-white tracking-tight">Project Manager</h1>
            </div>
            
            <!-- User Actions -->
            <div class="flex items-center gap-5">
                <button class="text-gray-400 hover:text-white transition-colors">
                    <Icon name="heroicons:bell" class="w-6 h-6" />
                </button>
                <div class="w-10 h-10 rounded-full ring-2 ring-gray-700 hover:ring-blue-500 overflow-hidden cursor-pointer transition-all">
                    <NuxtLink to="/profile"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" class="w-full h-full object-cover"></NuxtLink>
                </div>
            </div>
        </header>

        <!-- Left-Aligned Navigation (Stem of the L) -->
        <aside class="fixed top-20 left-0 bottom-0 w-64 bg-[#1D1D1D] border-r border-gray-800 z-40 p-4">
            <nav class="flex flex-col gap-4 pt-5">
                <NuxtLink to="/dashboard" class="px-4 py-5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-3">
                    <Icon name="heroicons:home" class="w-5 h-5" />
                    Dashboard
                </NuxtLink>
                <NuxtLink to="/projets" class="px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex items-center gap-3">
                    <Icon name="heroicons:folder" class="w-5 h-5" />
                    Projets
                </NuxtLink>
                <NuxtLink to="/tasks" class="px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex items-center gap-3">
                    <Icon name="heroicons:clipboard-document-list" class="w-5 h-5" />
                    Board
                </NuxtLink>
                <!-- <NuxtLink to="/manage_members" class="px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex items-center gap-3">
                    <Icon name="heroicons:user-group" class="w-5 h-5" />
                    Members
                </NuxtLink> -->
            </nav>
        </aside>
    </div>
</template>