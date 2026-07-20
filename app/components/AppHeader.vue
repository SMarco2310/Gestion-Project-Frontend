<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const {logout,user,isOwner}=useAuth()
const { activeOrganization, organizations, getOrganizations } = useOrganizations()
const { activeWorkspace, workspaces, getWorkspaces, setActiveWorkspace } = useWorkspaces()

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

const orgId = computed(() => route.params.org_id || activeOrganization.value?.id)
const workspaceId = computed(() => route.params.workspace_id || activeWorkspace.value?.id)

const sortedWorkspaces = computed(() => {
  if (!workspaces.value) return []
  return [...workspaces.value].sort((a, b) => {
    if (a.id === workspaceId.value) return -1
    if (b.id === workspaceId.value) return 1
    return 0
  })
})

const sortedOrganizations = computed(() => {
  if (!organizations.value) return []
  return [...organizations.value].sort((a, b) => {
    if (a.id == orgId.value) return -1
    if (b.id == orgId.value) return 1
    return 0
  })
})

onMounted(async () => {
  fetchNotifications()
  startPolling()
  await getOrganizations()
  if (orgId.value) {
    await getWorkspaces(orgId.value as string)
  }
})

watch(orgId, async (newOrgId) => {
  if (newOrgId) {
    await getWorkspaces(newOrgId as string)
  } else {
    workspaces.value = []
  }
})

onUnmounted(() => {
  stopPolling()
})

const isActive = (path: string) => {
  if (path === '/notifications' && orgId.value) {
    const targetPath = `/organization/${orgId.value}/notifications`
    return route.path === targetPath || route.path.startsWith(`${targetPath}/`)
  }
  if (!orgId.value || !workspaceId.value) return route.path === path || route.path.startsWith(`${path}/`)
  const targetPath = path === '/dashboard' ? `/organization/${orgId.value}/workspace/${workspaceId.value}` : `/organization/${orgId.value}/workspace/${workspaceId.value}${path === '/projets' ? '/projects' : path}`
  
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

const switchOrganization = async (newOrgId: string | number) => {
  isOrgMenuExpanded.value = false;
  try {
    const res = await $api<any>(`/workspaces?organization_id=${newOrgId}`);
    const orgWorkspaces = res.data?.data || res.data || [];
    
    if (orgWorkspaces.length > 0) {
      navigateTo(`/organization/${newOrgId}/workspace/${orgWorkspaces[0].id}`);
    } else {
      navigateTo(`/organization/${newOrgId}`);
    }
  } catch (error) {
    navigateTo(`/organization/${newOrgId}`);
  }
}

const handleNotificationClick = async (notif: any) => {
  if (!notif.read_at) {
    await markAsRead(notif.id)
  }
  isNotifOpen.value = false
  const targetOrgId = orgId.value || activeOrganization.value?.id;
  const targetWsId = notif.data?.workspace_id || workspaceId.value || activeWorkspace.value?.id;
  
  if (!targetOrgId) {
    navigateTo('/organizations')
    return
  }
  if (notif.data.task_id && targetWsId) {
    navigateTo(`/organization/${targetOrgId}/workspace/${targetWsId}/tasks/${notif.data.task_id}`)
  } else if (notif.data.projet_id && targetWsId) {
    navigateTo(`/organization/${targetOrgId}/workspace/${targetWsId}/projects/${notif.data.projet_id}`)
  } else if (notif.data.team_id && targetWsId) {
    navigateTo(`/organization/${targetOrgId}/workspace/${targetWsId}/team`)
  } else {
    navigateTo(`/organization/${targetOrgId}/notifications/${notif.id}`)
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




const getIconColor = (name: string) => {
  if (!name) return '#0891b2';
  const colors = ['#0891b2', '#8B5CF6', '#F97316', '#3B82F6', '#10B981', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '...'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

const config = useRuntimeConfig();
const apiBase = config.public.apiBase as string;
const { $api } = useNuxtApp()

const isCreateWorkspaceModalOpen = useState('isCreateWorkspaceModalOpen', () => false)
const isSubmittingWorkspace = ref(false)
const newWorkspaceForm = ref({ name: '', description: '' })
const createWorkspaceError = ref('')

const handleCreateWorkspace = async () => {
  if (!newWorkspaceForm.value.name.trim()) return

  isSubmittingWorkspace.value = true
  createWorkspaceError.value = ''
  
  try {
    const res = await $api<any>('/workspaces', {
        method: 'POST',
        body: {
            name: newWorkspaceForm.value.name,
            description: newWorkspaceForm.value.description,
            organization_id: orgId.value
        }
    })
    const newWorkspace = res.workspace || res.data?.workspace || res.data
    // Update local state by re-fetching workspaces
    if (orgId.value) {
      await getWorkspaces(orgId.value as string)
    }
    isCreateWorkspaceModalOpen.value = false
    navigateTo(`/organization/${orgId.value}/workspace/${newWorkspace.id}`)
  } catch (err: any) {
    createWorkspaceError.value = err.data?.message || 'Erreur lors de la création'
  } finally {
    isSubmittingWorkspace.value = false
  }
}
</script>

<template>
    <div>
        <!-- Top Horizontal Bar -->
        <header class="fixed top-0 left-0 right-0 h-20 bg-canvas dark:bg-[#1D1D1D] z-40 flex justify-between md:justify-end items-center px-4 md:px-8 border-b md:border-b-0 border-form-border dark:border-gray-800 transition-all duration-300 ease-in-out" :class="isSidebarCollapsed ? 'md:left-20' : 'md:left-64'">
            <!-- Mobile Left Actions (Hamburger) -->
            <button @click="isMobileMenuOpen = true" class="md:hidden p-2 -ml-2 text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors">
                <Icon name="heroicons:bars-3" class="w-7 h-7" />
            </button>

            <!-- Mobile Center Actions (Branding) -->
            <div class="flex md:hidden absolute left-1/2 -translate-x-1/2 items-center gap-2">
                <NuxtLink :to="(orgId && workspaceId) ? `/organization/${orgId}/workspace/${workspaceId}` : (orgId ? `/organization/${orgId}` : '/')" class="flex items-center justify-center">
                    <div class="w-8 h-8 rounded-md shrink-0 overflow-hidden flex items-center justify-center border border-form-border dark:border-gray-700 font-bold bg-white">
                        <template v-if="activeOrganization">
                            <img v-if="activeOrganization.logo" :src="activeOrganization.logo.startsWith('http') ? activeOrganization.logo : apiBase.replace('/api', '') + activeOrganization.logo" alt="Org Logo" class="w-full h-full object-cover">
                            <img v-else src="/assets/logo_app.svg" class="w-full h-full object-contain p-1 bg-white" alt="Org Logo">
                        </template>
                        <img v-else src="/assets/logo_app.svg" class="w-full h-full object-contain p-1" alt="Logo">
                    </div>
                </NuxtLink>
            </div>

            <!-- User Actions (Desktop & Mobile) -->
            <div class="flex items-center gap-4 md:gap-5">
                <!-- Removed Dark Mode Toggle from here -->
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
                                <div v-if="!notif.read_at" class="absolute left-0 top-0 bottom-0 w-1 bg-primary dark:bg-primary"></div>
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
                    <div v-if="isProfileOpen" class="absolute right-0 mt-2 w-72 bg-[#ffffff] dark:bg-[#1D1D1D] rounded-[24px] shadow-xl border border-gray-200 dark:border-gray-800 z-50 flex flex-col overflow-hidden animate-fade-in-up" style="animation-duration: 0.2s;">
                        
                        <!-- Top Profile Section -->
                        <div class="flex items-center gap-4 p-5 pb-4">
                            <div class="w-14 h-14 rounded-full ring-2 ring-primary/50 overflow-hidden shrink-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-primary font-bold text-xl shadow-sm">
                                <img v-if="user?.profile_picture" :src="user.profile_picture.startsWith('http') ? user.profile_picture : apiBase.replace('/api', '') + user.profile_picture" alt="Avatar" class="w-full h-full object-cover">
                                <span v-else>{{ (user?.last_name || 'U').charAt(0).toUpperCase() + (user?.first_name || '').charAt(0).toUpperCase() }}</span>
                            </div>
                            <div class="flex flex-col overflow-hidden">
                                <span class="font-bold text-main dark:text-white text-[15px] truncate">{{ user?.last_name }} {{ user?.first_name }}</span>
                                <span class="text-[13px] text-secondary dark:text-gray-400 truncate mt-0.5">{{ user?.email }}</span>
                            </div>
                        </div>

                        <div class="h-px bg-gray-200 dark:bg-gray-800 mx-auto w-[calc(100%-40px)]"></div>

                        <!-- Menu Items -->
                        <div class="p-3 flex flex-col gap-1">
                            <NuxtLink to="/profile" @click="isProfileOpen = false" class="px-3 py-2.5 text-[15px] rounded-xl hover:bg-gray-200/40 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-secondary dark:text-gray-300">
                                <Icon name="heroicons:user-outline" class="w-5 h-5 shrink-0 opacity-70" />
                                Voir le profil
                            </NuxtLink>
                            
                            <div class="px-3 py-2.5 text-[15px] rounded-xl flex items-center justify-between text-secondary dark:text-gray-300">
                                <div class="flex items-center gap-3">
                                    <div class="w-5 h-5 shrink-0"></div> <!-- Spacer for alignment -->
                                    Thème
                                </div>
                                <button @click="toggleDarkMode" class="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors">
                                    <Icon :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'" class="w-4 h-4 opacity-70" />
                                    <span class="text-[13px] font-medium">{{ colorMode.value === 'dark' ? 'Sombre' : 'Clair' }}</span>
                                </button>
                            </div>
                        </div>

                        <div class="h-px bg-gray-200 dark:bg-gray-800 mx-auto w-[calc(100%-40px)]"></div>

                        <!-- Logout -->
                        <div class="p-3">
                            <button @click="() => { isProfileOpen = false; handleLogout() }" class="w-full text-left px-3 py-2.5 text-[15px] font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-red-500">
                                <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5 shrink-0" />
                                Déconnexion
                            </button>
                        </div>
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
                isSidebarCollapsed ? 'md:w-20' : 'md:w-80',
                isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
            ]"
        >
            <!-- Banner / Logo Area -->
            <div ref="orgMenuContainerRef" class="relative h-20 md:h-28 flex items-center justify-between gap-2 px-4 shrink-0 border-b border-form-border dark:border-gray-800 md:border-b-0">
                <div @click="isOrgMenuExpanded = !isOrgMenuExpanded" class="flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-canvas dark:hover:bg-gray-800/50 p-2 rounded-lg flex-1 transition-colors group">
                    <div class="w-10 h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border border-form-border dark:border-gray-700 font-bold text-lg bg-white">
                        <template v-if="activeOrganization">
                            <img v-if="activeOrganization.logo" :src="activeOrganization.logo.startsWith('http') ? activeOrganization.logo : `http://localhost:8000${activeOrganization.logo}`" alt="Org Logo" class="w-full h-full object-cover">
                            <img v-else src="/assets/logo_app.svg" class="w-full h-full object-contain p-1 bg-white" alt="Org Logo">
                        </template>
                        <img v-else src="/assets/logo_app.svg" class="w-8 h-8 object-contain" alt="Logo">
                    </div>
                    <div class="flex flex-col flex-1 overflow-hidden" :class="isSidebarCollapsed ? 'md:hidden' : ''">
                        <h1 class="text-sm font-bold text-main dark:text-white tracking-tight leading-tight truncate">
                            {{ activeOrganization ? activeOrganization.name : 'Gestion Pro' }}
                        </h1>
                        <span class="text-[10px] text-secondary font-medium tracking-widest uppercase mt-0.5" v-if="activeWorkspace">
                            {{ activeWorkspace.name }}
                        </span>
                        <span class="text-[10px] text-secondary font-medium tracking-widest uppercase mt-0.5" v-else>Organisation</span>
                    </div>
                    <Icon :name="isOrgMenuExpanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" class="w-4 h-4 text-secondary shrink-0 transition-transform group-hover:text-main dark:group-hover:text-white" :class="isSidebarCollapsed ? 'md:hidden' : ''" />
                </div>
                <!-- Mobile Close Button inside Sidebar -->
                <button @click="isMobileMenuOpen = false" class="md:hidden p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white shrink-0">
                    <Icon name="heroicons:x-mark" class="w-6 h-6" />
                </button>

                <!-- Organization Bubble Menu -->
                <div v-if="isOrgMenuExpanded" class="absolute top-[85px] md:top-[105px] left-2 right-2 md:left-3 md:right-auto md:w-[290px] bg-[#ffffff] dark:bg-[#1C2128] border border-gray-200 dark:border-gray-800 rounded-[24px] shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in-up" style="animation-duration: 0.2s;">
                    
                    <div class="p-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
                        <div class="px-2 py-1 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2 mt-1">Vos Workspaces</div>
                        
                        <NuxtLink 
                            v-for="ws in sortedWorkspaces" :key="ws.id" 
                            :to="`/organization/${orgId}/workspace/${ws.id}`" 
                            @click="isOrgMenuExpanded = false"
                            class="px-2 py-2.5 rounded-xl transition-colors flex items-center justify-between group"
                            :class="ws.id === workspaceId ? 'bg-gray-200/60 dark:bg-[#2A2A2D]' : 'hover:bg-gray-200/40 dark:hover:bg-white/5'"
                        >
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-[12px] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0" :style="{ backgroundColor: ws.color || getIconColor(ws.name) }">
                                    {{ ws.name.charAt(0).toUpperCase() }}
                                </div>
                                <div class="flex flex-col overflow-hidden">
                                    <span class="text-sm font-bold text-main dark:text-gray-200 truncate">{{ ws.name }}</span>
                                </div>
                            </div>
                            <Icon v-if="ws.id === workspaceId" name="heroicons:check" class="w-5 h-5 text-[#0891b2] shrink-0" />
                        </NuxtLink>
                        
                        <div class="mt-2 flex flex-col gap-1">
                            <button @click="() => { isOrgMenuExpanded = false; newWorkspaceForm = {name: '', description: ''}; createWorkspaceError = ''; isCreateWorkspaceModalOpen = true; }" class="w-full text-left px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-200/40 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-[#0891b2]">
                                <Icon name="heroicons:plus" class="w-5 h-5 shrink-0" />
                                Créer un workspace
                            </button>
                            <NuxtLink :to="orgId ? `/organization/${orgId}/workspaces` : '/organizations'" @click="isOrgMenuExpanded = false" class="px-3 py-2 text-sm font-medium rounded-xl hover:bg-gray-200/40 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-secondary dark:text-gray-400">
                                <Icon name="heroicons:cog-8-tooth" class="w-5 h-5 shrink-0" />
                                Gérer les workspaces
                            </NuxtLink>
                        </div>
                    </div>

                    <div class="h-px bg-gray-200 dark:bg-gray-800 mx-auto w-[calc(100%-32px)]"></div>

                    <div class="p-3 max-h-[40vh] overflow-y-auto custom-scrollbar mb-1">
                        <div class="px-2 py-1 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2 mt-1">Vos Organisations</div>
                        
                        <a 
                            href="#"
                            v-for="org in sortedOrganizations" :key="org.id" 
                            @click.prevent="switchOrganization(org.id)"
                            class="px-2 py-2.5 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                            :class="org.id == orgId ? 'bg-gray-200/60 dark:bg-[#2A2A2D]' : 'hover:bg-gray-200/40 dark:hover:bg-white/5'"
                        >
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-[12px] border border-gray-100 dark:border-transparent flex items-center justify-center font-bold text-lg shadow-sm shrink-0 overflow-hidden bg-white">
                                    <img v-if="org.logo" :src="org.logo.startsWith('http') ? org.logo : `http://localhost:8000${org.logo}`" alt="Org Logo" class="w-full h-full object-cover">
                                    <img v-else src="/assets/logo_app.svg" class="w-full h-full object-contain p-1 bg-white" alt="Org Logo">
                                </div>
                                <div class="flex flex-col overflow-hidden">
                                    <span class="text-sm font-bold text-main dark:text-gray-200 truncate max-w-[150px]">{{ org.name }}</span>
                                </div>
                            </div>
                            <Icon v-if="org.id == orgId" name="heroicons:check" class="w-5 h-5 text-[#0891b2] shrink-0" />
                        </a>

                        <div class="mt-2 flex flex-col gap-1">
                            <NuxtLink :to="orgId ? `/organization/${orgId}/settings` : '/organizations'" @click="isOrgMenuExpanded = false" class="px-3 py-2 text-sm font-medium rounded-xl hover:bg-gray-200/40 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-secondary dark:text-gray-400">
                                <Icon name="heroicons:cog-8-tooth" class="w-5 h-5 shrink-0" />
                                Paramètres de l'organisation
                            </NuxtLink>
                            <NuxtLink to="/organizations?create=true" @click="isOrgMenuExpanded = false" class="px-3 py-2 text-sm font-bold rounded-xl hover:bg-gray-200/40 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-[#0891b2]">
                                <Icon name="heroicons:plus" class="w-5 h-5 shrink-0" />
                                Créer une organisation
                            </NuxtLink>
                            <NuxtLink to="/organizations" @click="isOrgMenuExpanded = false" class="px-3 py-2 text-sm font-medium rounded-xl hover:bg-gray-200/40 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-secondary dark:text-gray-400">
                                <Icon name="heroicons:chevron-double-left" class="w-5 h-5 shrink-0" />
                                Changer d'organisation
                            </NuxtLink>
                        </div>
                    </div>
                </div>
            </div>

            <nav class="relative flex flex-col gap-2 p-4 pt-6 overflow-y-auto item custom-scrollbar isolate">
                <!-- Bouncy Sliding Background -->
                <div 
                    class="absolute top-6 left-4 right-4 h-[44px] rounded-xl bg-[#0891b2] neo-emboss transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] -z-10"
                    :style="activeNavIndex >= 0 ? { transform: `translateY(${activeNavIndex * 52}px)`, opacity: 1 } : { opacity: 0 }"
                ></div>

                <NuxtLink :to="orgId && workspaceId ? `/organization/${orgId}/workspace/${workspaceId}` : (orgId ? `/organization/${orgId}/workspaces` : '/')" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/dashboard') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:home" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/dashboard') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Tableau de bord</span>
                </NuxtLink>
                <NuxtLink :to="orgId && workspaceId ? `/organization/${orgId}/workspace/${workspaceId}/projects` : (orgId ? `/organization/${orgId}/workspaces` : '/organizations')" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/projets') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:folder" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/projets') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Projets</span>
                </NuxtLink>
                <NuxtLink :to="orgId && workspaceId ? `/organization/${orgId}/workspace/${workspaceId}/tasks` : (orgId ? `/organization/${orgId}/workspaces` : '/organizations')" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/tasks') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:clipboard-document-list" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/tasks') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Tâches</span>
                </NuxtLink>
                <NuxtLink :to="orgId && workspaceId ? `/organization/${orgId}/workspace/${workspaceId}/calendar` : (orgId ? `/organization/${orgId}/workspaces` : '/organizations')" @click="isMobileMenuOpen = false" :class="[
                    'px-4 py-3 text-sm font-mono rounded-xl transition-all duration-300 flex items-center gap-3 relative group',
                    isActive('/calendar') 
                        ? 'font-bold text-white scale-[1.02]' 
                        : 'text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white hover:bg-canvas dark:hover:bg-gray-800'
                ]">
                    <Icon name="heroicons:calendar-days" class="w-5 h-5 relative z-10 shrink-0 transition-all duration-300" :class="{ 'drop-shadow-md text-white': isActive('/calendar') }" />
                    <span class="relative z-10 tracking-wide transition-colors duration-300" :class="isSidebarCollapsed ? 'md:hidden' : ''">Planning</span>
                </NuxtLink>
                <NuxtLink :to="orgId && workspaceId ? `/organization/${orgId}/workspace/${workspaceId}/team` : (orgId ? `/organization/${orgId}/workspaces` : '/organizations')" @click="isMobileMenuOpen = false" :class="[
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
                    <span v-if="unreadCount > 0" class="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full" :class="isSidebarCollapsed ? 'absolute top-3 right-4 md:top-1 md:right-1' : 'ml-auto'">{{ unreadCount }}</span>
                </NuxtLink>
                <NuxtLink v-if="isOwner" :to="orgId && workspaceId ? `/organization/${orgId}/workspace/${workspaceId}/settings` : (orgId ? `/organization/${orgId}/workspaces` : '/organizations')" @click="isMobileMenuOpen = false" :class="[
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
                <div class="flex md:hidden items-center justify-start px-2 py-2">
                    <!-- Profile -->
                    <NuxtLink to="/profile" @click="isMobileMenuOpen = false" class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ring-2 ring-form-border dark:ring-gray-700 overflow-hidden shrink-0">
                            <img :src="user?.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`) : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.first_name ?? 'U'}&chars=1`" alt="Avatar" class="w-full h-full object-cover">
                        </div>
                    </NuxtLink>
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

        <!-- Create Workspace Modal -->
        <div v-if="isCreateWorkspaceModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden transform transition-all animate-fade-in-up">
            <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
              <h3 class="text-xl font-bold text-main dark:text-white">Nouvel Espace de Travail</h3>
              <button @click="isCreateWorkspaceModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
                <Icon name="heroicons:x-mark" class="w-6 h-6" />
              </button>
            </div>
            
            <div class="p-6 space-y-5">
              <div v-if="createWorkspaceError" class="p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
                {{ createWorkspaceError }}
              </div>
              
              <div>
                <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'espace</label>
                <input 
                  v-model="newWorkspaceForm.name" 
                  type="text" 
                  placeholder="Ex: Marketing, Développement..."
                  class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description (optionnel)</label>
                <textarea
                  v-model="newWorkspaceForm.description" 
                  rows="3"
                  class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                ></textarea>
              </div>
            </div>

            <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-black/10">
              <button 
                @click="isCreateWorkspaceModalOpen = false" 
                :disabled="isSubmittingWorkspace"
                class="px-5 py-2.5 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button 
                @click="handleCreateWorkspace" 
                :disabled="isSubmittingWorkspace || !newWorkspaceForm.name.trim()"
                class="px-5 py-2.5 bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon v-if="isSubmittingWorkspace" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                Créer
              </button>
            </div>
          </div>
        </div>

    </div>
</template>
