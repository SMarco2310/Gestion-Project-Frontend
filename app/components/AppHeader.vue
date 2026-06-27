<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const {logout,user}=useAuth();

const isActive = (path: string) => route.path.startsWith(path)


const handleLogout= async () =>{
    await logout();
    navigateTo('/auth/login');
}
const isNotifOpen = ref(false)
const isProfileOpen = ref(false)
const isMobileMenuOpen = ref(false)
</script>

<template>
    <div>
        <!-- Top Horizontal Bar -->
        <header class="fixed top-0 md:left-80 left-0 right-0 h-20 bg-canvas dark:bg-[#1D1D1D] z-40 flex justify-between md:justify-end items-center px-4 md:px-8 border-b md:border-b-0 border-form-border dark:border-gray-800">
            <!-- Mobile Left Actions (Branding) -->
            <div class="flex md:hidden items-center gap-3">
                <NuxtLink to="/dashboard" class="flex items-center gap-2">
                    <img src="/assets/logo_app.png" class="w-8 h-8 object-contain" alt="Logo">
                    <h1 class="text-xl font-bold text-main dark:text-white tracking-tight leading-tight">
                        Gestion de Projets
                    </h1>
                </NuxtLink>
            </div>

            <!-- Mobile Right Actions (Hamburger) -->
            <button @click="isMobileMenuOpen = true" class="md:hidden p-2 text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors">
                <Icon name="heroicons:bars-3" class="w-8 h-8" />
            </button>

            <!-- User Actions (Desktop only) -->
            <div class="hidden md:flex items-center gap-5">
                <!-- Notifications Dropdown -->
                <div class="relative">
                    <button @click="isNotifOpen = !isNotifOpen" class="text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors relative focus:outline-none">
                        <Icon name="heroicons:bell" class="w-6 h-6" />
                        <!-- Optional badge indicator -->
                        <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <!-- Overlay for closing -->
                    <div v-if="isNotifOpen" @click="isNotifOpen = false" class="fixed inset-0 z-40"></div>
                    <!-- Dropdown Menu -->
                    <div v-if="isNotifOpen" class="absolute right-0 mt-2 w-64 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden">
                        <div class="p-3 border-b border-form-border dark:border-gray-800 text-sm font-semibold text-main dark:text-white">
                            Notifications
                        </div>
                        <div class="p-3 text-sm text-secondary dark:text-gray-400">
                            Aucune notification
                        </div>
                    </div>
                </div>

                <!-- Profile Dropdown -->
                <div class="relative">
                    <div @click="isProfileOpen = !isProfileOpen" class="w-10 h-10 rounded-full ring-2 ring-form-border dark:ring-gray-700 hover:ring-primary dark:hover:ring-primary overflow-hidden cursor-pointer transition-all">
                        <img :src="`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name ?? 'U'}&chars=1`" alt="Avatar" class="w-full h-full object-cover">
                    </div>
                    <!-- Overlay for closing -->
                    <div v-if="isProfileOpen" @click="isProfileOpen = false" class="fixed inset-0 z-40"></div>
                    <!-- Dropdown Menu -->
                    <div v-if="isProfileOpen" class="absolute right-0 mt-2 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden">
                        <NuxtLink to="/profile" @click="isProfileOpen = false" class="block px-4 py-3 text-sm font-medium text-secondary dark:text-gray-300 hover:bg-canvas dark:hover:bg-gray-800 hover:text-main dark:hover:text-white transition-colors">
                            Profil
                        </NuxtLink>
                        <button @click="() => { isProfileOpen = false; handleLogout() }" class="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Mobile Sidebar Backdrop -->
        <Transition
            enter-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-300"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div 
                v-if="isMobileMenuOpen" 
                @click="isMobileMenuOpen = false" 
                class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] md:hidden"
            ></div>
        </Transition>

        <!-- Left-Aligned Navigation (Stem of the L) -->
        <aside 
            :class="[
                'fixed top-0 left-0 h-[100dvh] w-[80vw] max-w-[320px] md:w-80 bg-card dark:bg-[#1D1D1D] border-r border-form-border dark:border-gray-800 z-50 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0',
                isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
            ]"
        >
            <!-- Banner / Logo Area -->
            <div class="h-20 md:h-28 flex items-center justify-between gap-4 px-6 shrink-0 border-b border-form-border dark:border-gray-800 md:border-b-0">
                <NuxtLink to="/dashboard" @click="isMobileMenuOpen = false" class="flex items-center gap-4">
                    <img src="/assets/logo_app.png" class="w-12 h-10 object-contain" alt="Logo">
                    <h1 class="text-xl font-bold text-main dark:text-white tracking-tight leading-tight">
                        Gestion de<br>Projets
                    </h1>
                </NuxtLink>
                <!-- Mobile Close Button inside Sidebar -->
                <button @click="isMobileMenuOpen = false" class="md:hidden p-2 -mr-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
                    <Icon name="heroicons:x-mark" class="w-6 h-6" />
                </button>
            </div>

            <nav class="flex flex-col gap-2 p-4 pt-6 overflow-y-auto custom-scrollbar">
                <NuxtLink to="/dashboard" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/dashboard') 
                        ? 'font-bold text-white bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] scale-[1.02] z-10' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:home" class="w-5 h-5 relative z-10 drop-shadow-md" />
                    <span class="relative z-10 tracking-wide">Tableau de bord</span>
                </NuxtLink>
                <NuxtLink to="/projets" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/projets') 
                        ? 'font-bold text-white bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] scale-[1.02] z-10' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:folder" class="w-5 h-5 relative z-10 drop-shadow-md" />
                    <span class="relative z-10 tracking-wide">Projets</span>
                </NuxtLink>
                <NuxtLink to="/tasks" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/tasks') 
                        ? 'font-bold text-white bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] scale-[1.02] z-10' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:clipboard-document-list" class="w-5 h-5 relative z-10 drop-shadow-md" />
                    <span class="relative z-10 tracking-wide">Tâches</span>
                </NuxtLink>
                <!-- <NuxtLink to="/manage_members" :class="[
                    'px-4 py-3 text-sm rounded-lg transition-all flex items-center gap-3',
                    isActive('/manage_members') 
                        ? 'font-semibold text-white bg-primary dark:bg-primary shadow-lg shadow-primary/20 dark:shadow-primary/20' 
                        : 'font-medium text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:user-group" class="w-5 h-5" />
                    Membres
                </NuxtLink> -->
            </nav>
            
            <!-- Bottom Actions -->
            <div class="mt-auto p-4 pb-12 md:pb-4 shrink-0 border-t border-form-border dark:border-gray-800 flex flex-col gap-4">
                
                <!-- Mobile User Actions -->
                <div class="flex md:hidden items-center justify-between px-2 py-2">
                    <!-- Profile -->
                    <NuxtLink to="/profile" @click="isMobileMenuOpen = false" class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ring-2 ring-form-border dark:ring-gray-700 overflow-hidden shrink-0">
                            <img :src="`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name ?? 'U'}&chars=1`" alt="Avatar" class="w-full h-full object-cover">
                        </div>
                    </NuxtLink>
                    <!-- Notifications -->
                    <button class="text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors relative focus:outline-none">
                        <Icon name="heroicons:bell" class="w-7 h-7" />
                        <span class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    </button>
                </div>

                <NuxtLink to="/auth/login" @click="handleLogout" class="w-full px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 group">
                    <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    <span class="tracking-wide font-medium">Déconnexion</span>
                </NuxtLink>
            </div>
        </aside>
    </div>
</template>

<style scoped>
/* Scrollbar styling for a cleaner look */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #52525b;
}
</style>