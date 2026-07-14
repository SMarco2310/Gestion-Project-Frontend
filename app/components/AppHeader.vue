<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const {logout,user,isOwner}=useAuth()
const { activeOrganization } = useOrganizations()

const isSidebarCollapsed = useState('sidebarCollapsed', () => false)
const colorMode = useColorMode()
const toggleDarkMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

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

const orgId = computed(() => route.params.org_id || activeOrganization.value?.id)

const isActive = (path: string) => {
  if (!orgId.value) return route.path === path || route.path.startsWith(`${path}/`)
  const targetPath = path === '/dashboard' ? `/organization/${orgId.value}` : `/organization/${orgId.value}${path === '/projets' ? '/projects' : path}`
  
  if (path === '/dashboard') {
    return route.path === targetPath || route.path === `${targetPath}/`
  }
  
  return route.path === targetPath || route.path.startsWith(`${targetPath}/`)
}

const activeNavIndex = computed(() => {
  const routes = [
    '/dashboard',
    '/projets',
    '/tasks',
    '/calendar',
    '/team',
    '/notifications'
  ]
  if (isOwner.value) {
    routes.push('/settings')
  }
  return routes.findIndex(path => isActive(path))
})
const handleLogout= async () =>{
    await logout();
    navigateTo('/auth/login');
}
const isNotifOpen = ref(false)
const isProfileOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isOrgMenuExpanded = ref(false)

const handleNotificationClick = async (notif: any) => {
  if (!notif.read_at) {
    await markAsRead(notif.id)
  }
  isNotifOpen.value = false
  const targetOrgId = orgId.value || activeOrganization.value?.id;
  if (!targetOrgId) {
    navigateTo('/organizations')
    return
  }
  if (notif.data.task_id) {
    navigateTo(`/organization/${targetOrgId}/tasks`)
  } else if (notif.data.projet_id) {
    navigateTo(`/organization/${targetOrgId}/projects`)
  } else if (notif.data.team_id) {
    navigateTo(`/organization/${targetOrgId}/team`)
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

const orgMenuContainerRef = ref<HTMLElement | null>(null)

const handleGlobalClick = (e: MouseEvent) => {
  if (isOrgMenuExpanded.value && orgMenuContainerRef.value) {
    if (!orgMenuContainerRef.value.contains(e.target as Node)) {
      isOrgMenuExpanded.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})



const config = useRuntimeConfig();
const apiBase = config.public.apiBase as string;
</script>

<template>
    <div>
        <!-- Top Horizontal Bar -->
        <header class="fixed top-0 left-0 right-0 h-20 bg-canvas dark:bg-[#1D1D1D] z-40 flex justify-between md:justify-end items-center px-4 md:px-8 border-b md:border-b-0 border-form-border dark:border-gray-800 transition-all duration-300 ease-in-out" :class="isSidebarCollapsed ? 'md:left-20' : 'md:left-64'">
            <!-- Mobile Left Actions (Branding) -->
            <div class="flex md:hidden items-center gap-3">
                <NuxtLink :to="orgId ? `/organization/${orgId}` : '/'" class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-md shrink-0 overflow-hidden bg-white flex items-center justify-center border border-form-border dark:border-gray-700">
                        <template v-if="activeOrganization">
                            <img v-if="activeOrganization.logo" :src="apiBase.replace('/api', '') + '/' + activeOrganization.logo" alt="Org Logo" class="w-full h-full object-cover">
                            <img v-else :src="`https://api.dicebear.com/7.x/initials/svg?seed=${activeOrganization.name}&chars=2`" alt="Org Logo" class="w-full h-full object-cover">
                        </template>
                        <img v-else src="/assets/logo_app.svg" class="w-full h-full object-contain p-1" alt="Logo">
                    </div>
                    <h1 class="text-lg font-bold text-main dark:text-white tracking-tight leading-tight truncate max-w-[200px]">
                        {{ activeOrganization ? activeOrganization.name : 'Gestion Pro' }}
                    </h1>
                </NuxtLink>
            </div>

            <!-- Mobile Right Actions (Hamburger) -->
            <button @click="isMobileMenuOpen = true" class="md:hidden p-2 text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors">
                <Icon name="heroicons:bars-3" class="w-8 h-8" />
            </button>

            <!-- User Actions (Desktop only) -->
            <div class="hidden md:flex items-center gap-5">
                <!-- Dark Mode Toggle -->
                <button @click="toggleDarkMode" class="text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors relative focus:outline-none" :title="colorMode.value === 'dark' ? 'Mode clair' : 'Mode sombre'">
                    <Icon :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'" class="w-6 h-6" />
                </button>
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
                        <img :src="user?.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : apiBase.replace('/api', '') + user.profile_picture) : `https://api.dicebear.com/7.x/initials/svg?seed=${(user?.last_name || '').charAt(0).toUpperCase() + (user?.first_name || '').charAt(0).toUpperCase() || 'U'}&chars=2`" alt="Avatar" class="w-full h-full object-cover">
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
                'fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-[650px] bg-card dark:bg-[#1D1D1D] border-r border-form-border dark:border-gray-800 z-50 flex flex-col transition-all duration-300 ease-in-out md:translate-x-0',
                isSidebarCollapsed ? 'md:w-20' : 'md:w-64',
                isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
            ]"
        >
            <!-- Banner / Logo Area -->
            <div ref="orgMenuContainerRef" class="relative h-20 md:h-28 flex items-center justify-between gap-2 px-4 shrink-0 border-b border-form-border dark:border-gray-800 md:border-b-0">
                <div @click="isOrgMenuExpanded = !isOrgMenuExpanded" class="flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-canvas dark:hover:bg-gray-800/50 p-2 rounded-lg flex-1 transition-colors group">
                    <div class="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-white flex items-center justify-center border border-form-border dark:border-gray-700">
                        <template v-if="activeOrganization">
                            <img v-if="activeOrganization.logo" :src="activeOrganization.logo.startsWith('http') ? activeOrganization.logo : `http://localhost:8000${activeOrganization.logo}`" alt="Org Logo" class="w-full h-full object-cover">
                            <img v-else :src="`https://api.dicebear.com/7.x/initials/svg?seed=${activeOrganization.name}&chars=2`" alt="Org Logo" class="w-full h-full object-cover">
                        </template>
                        <img v-else src="/assets/logo_app.svg" class="w-8 h-8 object-contain" alt="Logo">
                    </div>
                    <div class="flex flex-col flex-1 overflow-hidden" :class="isSidebarCollapsed ? 'md:hidden' : ''">
                        <h1 class="text-sm font-bold text-main dark:text-white tracking-tight leading-tight truncate">
                            {{ activeOrganization ? activeOrganization.name : 'Gestion Pro' }}
                        </h1>
                        <span class="text-[10px] text-secondary font-medium tracking-widest uppercase mt-0.5">Organisation</span>
                    </div>
                    <Icon :name="isOrgMenuExpanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" class="w-4 h-4 text-secondary shrink-0 transition-transform group-hover:text-main dark:group-hover:text-white" :class="isSidebarCollapsed ? 'md:hidden' : ''" />
                </div>
                <!-- Mobile Close Button inside Sidebar -->
                <button @click="isMobileMenuOpen = false" class="md:hidden p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white shrink-0">
                    <Icon name="heroicons:x-mark" class="w-6 h-6" />
                </button>

                <!-- Organization Bubble Menu -->
                <div v-if="isOrgMenuExpanded" class="absolute top-4 left-2 right-2 md:left-4 md:right-auto md:w-[224px] bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in-up" style="animation-duration: 0.2s;">
                    <!-- Replicated Header inside Dropdown -->
                    <div @click="isOrgMenuExpanded = false" class="flex items-center gap-3 cursor-pointer hover:bg-canvas dark:hover:bg-gray-800/50 p-3 border-b border-form-border dark:border-gray-800 transition-colors">
                        <div class="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-white flex items-center justify-center border border-form-border dark:border-gray-700">
                            <template v-if="activeOrganization">
                                <img v-if="activeOrganization.logo" :src="activeOrganization.logo.startsWith('http') ? activeOrganization.logo : `http://localhost:8000${activeOrganization.logo}`" alt="Org Logo" class="w-full h-full object-cover">
                                <img v-else :src="`https://api.dicebear.com/7.x/initials/svg?seed=${activeOrganization.name}&chars=2`" alt="Org Logo" class="w-full h-full object-cover">
                            </template>
                            <img v-else src="/assets/logo_app.svg" class="w-8 h-8 object-contain" alt="Logo">
                        </div>
                        <div class="flex flex-col flex-1 overflow-hidden">
                            <h1 class="text-sm font-bold text-main dark:text-white tracking-tight leading-tight truncate">
                                {{ activeOrganization ? activeOrganization.name : 'Gestion Pro' }}
                            </h1>
                            <span class="text-[10px] text-secondary font-medium tracking-widest uppercase mt-0.5">Organisation actuelle</span>
                        </div>
                        <Icon name="heroicons:chevron-up" class="w-4 h-4 text-secondary shrink-0" />
                    </div>
                    
                    <div class="p-2 flex flex-col gap-1">
                        <NuxtLink :to="orgId ? `/organization/${orgId}/members` : '/organizations'" @click="isOrgMenuExpanded = false" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-canvas dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                            <Icon name="heroicons:chart-bar" class="w-4 h-4 text-secondary" />
                            Membres de l'organisation
                        </NuxtLink>
                        <NuxtLink :to="orgId ? `/organization/${orgId}/settings` : '/organizations'" @click="isOrgMenuExpanded = false" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-canvas dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                            <Icon name="heroicons:cog-8-tooth" class="w-4 h-4 text-secondary" />
                            Paramètres
                        </NuxtLink>
                    </div>

                    <div class="border-t border-form-border dark:border-gray-800 p-2 bg-canvas/30 dark:bg-black/10">
                        <NuxtLink to="/organizations" @click="isOrgMenuExpanded = false" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-canvas dark:hover:bg-gray-800 transition-colors flex items-center gap-3 text-main dark:text-gray-200">
                            <Icon name="heroicons:building-office-2" class="w-4 h-4 text-secondary" />
                            Toutes les organisations
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <nav class="relative flex flex-col gap-2 p-4 pt-6 overflow-y-auto item custom-scrollbar isolate">
                <!-- Bouncy Sliding Background -->
                <div 
                    class="absolute left-4 right-4 h-[44px] rounded-xl bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] -z-10"
                    :style="activeNavIndex >= 0 ? { transform: `translateY(${activeNavIndex * 52}px)`, opacity: 1 } : { opacity: 0 }"
                ></div>

                <NuxtLink :to="orgId ? `/organization/${orgId}` : '/'" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/dashboard') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:home" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/dashboard') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Tableau de bord</span>
                </NuxtLink>
                <NuxtLink :to="orgId ? `/organization/${orgId}/projects` : '/organizations'" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/projets') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:folder" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/projets') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Projets</span>
                </NuxtLink>
                <NuxtLink :to="orgId ? `/organization/${orgId}/tasks` : '/organizations'" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/tasks') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:clipboard-document-list" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/tasks') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Tâches</span>
                </NuxtLink>
                <NuxtLink :to="orgId ? `/organization/${orgId}/calendar` : '/organizations'" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/calendar') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:calendar-days" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/calendar') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Planning</span>
                </NuxtLink>
                <NuxtLink :to="orgId ? `/organization/${orgId}/team` : '/organizations'" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/team') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:user-group" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/team') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Équipe</span>
                </NuxtLink>
                <NuxtLink :to="orgId ? `/organization/${orgId}/notifications` : '/notifications'" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/notifications') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:bell" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/notifications') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Notifications</span>
                    <span v-if="unreadCount > 0" class="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full" :class="isSidebarCollapsed ? 'absolute top-2 right-2 md:top-1 md:right-1' : 'ml-auto'">{{ unreadCount }}</span>
                </NuxtLink>
                <NuxtLink v-if="isOwner" :to="orgId ? `/organization/${orgId}/settings` : '/organizations'" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/settings') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:cog-6-tooth" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/settings') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Paramètres</span>
                </NuxtLink>
            </nav>
            
            <!-- Bottom Actions -->
            <div class="mt-auto p-4 pb-12 md:pb-4 shrink-0 border-t border-form-border dark:border-gray-800 flex flex-col gap-4">
                
                <!-- Mobile User Actions -->
                <div class="flex md:hidden items-center justify-between px-2 py-2">
                    <!-- Profile -->
                    <NuxtLink to="/profile" @click="isMobileMenuOpen = false" class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ring-2 ring-form-border dark:ring-gray-700 overflow-hidden shrink-0">
                            <img :src="user?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.first_name ?? 'U'}&chars=1`" alt="Avatar" class="w-full h-full object-cover">
                        </div>
                    </NuxtLink>
                    <!-- Notifications -->
                    <button @click="isNotifOpen = !isNotifOpen; isMobileMenuOpen = false" class="text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors relative focus:outline-none">
                        <Icon name="heroicons:bell" class="w-7 h-7" />
                        <span v-if="unreadCount > 0" class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card dark:border-[#1D1D1D]"></span>
                    </button>
                </div>

                <NuxtLink to="/auth/login" @click="handleLogout" class="w-full px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 group">
                    <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5 transition-transform group-hover:-translate-x-1 shrink-0" />
                    <span class="tracking-wide font-medium" :class="isSidebarCollapsed ? 'md:hidden' : ''">Déconnexion</span>
                </NuxtLink>

                <button @click="isSidebarCollapsed = !isSidebarCollapsed" class="hidden md:flex p-2 mt-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors rounded-xl hover:bg-canvas dark:hover:bg-gray-800 justify-center">
                    <Icon :name="isSidebarCollapsed ? 'heroicons:chevron-double-right' : 'heroicons:chevron-double-left'" class="w-5 h-5" />
                </button>
            </div>
        </aside>
    </div>
</template>
