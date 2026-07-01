<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const {logout,user}=useAuth()

const { 
  notifications, 
  unreadCount, 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  startPolling, 
  stopPolling 
} = useNotification()

onMounted(() => {
  fetchNotifications()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

const isActive = (path: string) => route.path.startsWith(path)

const handleLogout= async () =>{
    await logout();
    navigateTo('/auth/login');
}
const isNotifOpen = ref(false)
const isProfileOpen = ref(false)
const isMobileMenuOpen = ref(false)

const handleNotificationClick = async (notif: any) => {
  if (!notif.read_at) {
    await markAsRead(notif.id)
  }
  isNotifOpen.value = false
  if (notif.data.task_id) {
    navigateTo('/tasks')
  } else if (notif.data.projet_id) {
    navigateTo('/projets')
  }
}

const formatNotifTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
    
    if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second')
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return rtf.format(-diffInMinutes, 'minute')
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return rtf.format(-diffInHours, 'hour')
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return rtf.format(-diffInDays, 'day')
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return rtf.format(-diffInMonths, 'month')
    const diffInYears = Math.floor(diffInMonths / 12)
    return rtf.format(-diffInYears, 'year')
  } catch (e) {
    return ''
  }
}
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
                        <span v-if="unreadCount > 0" class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center border-2 border-card dark:border-[#1D1D1D]"></span>
                    </button>
                    <!-- Overlay for closing -->
                    <div v-if="isNotifOpen" @click="isNotifOpen = false" class="fixed inset-0 z-40"></div>
                    <!-- Dropdown Menu -->
                    <div v-if="isNotifOpen" class="absolute right-0 mt-2 w-80 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 flex flex-col max-h-[32rem] overflow-hidden">
                        <div class="p-3 border-b border-form-border dark:border-gray-800 flex justify-between items-center shrink-0">
                            <span class="text-sm font-bold text-main dark:text-white tracking-wide">Notifications</span>
                            <button v-if="unreadCount > 0" @click="markAllAsRead" class="text-xs font-medium text-primary dark:text-blue-400 hover:underline">
                              Tout marquer lu
                            </button>
                        </div>
                        <div class="overflow-y-auto custom-scrollbar flex-1">
                          <div v-if="notifications.length === 0" class="p-6 text-center flex flex-col items-center justify-center text-secondary dark:text-gray-500">
                              <Icon name="heroicons:bell-slash" class="w-8 h-8 mb-2 opacity-50" />
                              <span class="text-sm">Aucune notification</span>
                          </div>
                          <div v-else class="divide-y divide-form-border dark:divide-gray-800">
                              <div 
                                v-for="notif in notifications" 
                                :key="notif.id"
                                @click="handleNotificationClick(notif)"
                                class="p-4 hover:bg-canvas dark:hover:bg-gray-800/50 cursor-pointer transition-colors relative group"
                                :class="{'bg-blue-50/50 dark:bg-blue-900/10': !notif.read_at}"
                              >
                                <div v-if="!notif.read_at" class="absolute left-0 top-0 bottom-0 w-1 bg-primary dark:bg-blue-500"></div>
                                <div class="flex flex-col gap-1 pl-1">
                                  <span class="text-sm font-semibold text-main dark:text-gray-200">{{ notif.data.title }}</span>
                                  <span class="text-xs text-secondary dark:text-gray-400 line-clamp-2">{{ notif.data.message }}</span>
                                  <span class="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">{{ formatNotifTime(notif.created_at) }}</span>
                                </div>
                              </div>
                          </div>
                        </div>
                    </div>
                </div>

                <!-- Profile Dropdown -->
                <div class="relative">
                    <div @click="isProfileOpen = !isProfileOpen" class="w-10 h-10 rounded-full ring-2 ring-form-border dark:ring-gray-700 hover:ring-primary dark:hover:ring-primary overflow-hidden cursor-pointer transition-all">
                        <img :src="user?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name ?? 'U'}&chars=1`" alt="Avatar" class="w-full h-full object-cover">
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
                            <img :src="user?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name ?? 'U'}&chars=1`" alt="Avatar" class="w-full h-full object-cover">
                        </div>
                    </NuxtLink>
                    <!-- Notifications -->
                    <button @click="isNotifOpen = !isNotifOpen; isMobileMenuOpen = false" class="text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors relative focus:outline-none">
                        <Icon name="heroicons:bell" class="w-7 h-7" />
                        <span v-if="unreadCount > 0" class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card dark:border-[#1D1D1D]"></span>
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