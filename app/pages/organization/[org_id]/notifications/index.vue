<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
    layout: 'custom',
})

const { 
  notifications, 
  loading,
  fetchNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification
} = useNotification()

onMounted(() => {
  fetchNotifications()
})

const filterText = ref('')
const filterStatus = ref<'all' | 'unread' | 'read'>('all')

const filteredNotifications = computed(() => {
  let result = notifications.value || []

  if (filterStatus.value === 'unread') {
    result = result.filter((n: any) => !n.read_at)
  } else if (filterStatus.value === 'read') {
    result = result.filter((n: any) => n.read_at)
  }

  if (filterText.value) {
    const searchTerm = filterText.value.toLowerCase()
    result = result.filter((n: any) => 
      (n.data.title && n.data.title.toLowerCase().includes(searchTerm)) ||
      (n.data.message && n.data.message.toLowerCase().includes(searchTerm))
    )
  }

  return result
})

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

const getNotifStyle = (notif: any) => {
  const t = notif.type || '';
  if (t.includes('due') || t.includes('overdue')) return 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400';
  if (t.includes('comment')) return 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400';
  if (t.includes('project')) return 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400';
  if (t.includes('team') || t.includes('organization')) return 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400';
  if (notif.data?.task_id) return 'bg-blue-50 text-primary dark:bg-primary/10 dark:text-blue-400';
  if (notif.data?.projet_id) return 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400';
  return 'bg-gray-50 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400';
}

const getNotifIcon = (notif: any) => {
  const t = notif.type || '';
  if (t.includes('due') || t.includes('overdue')) return 'heroicons:clock';
  if (t.includes('comment')) return 'ph:chat-teardrop';
  if (t.includes('project')) return 'ph:folder';
  if (t.includes('team') || t.includes('organization')) return 'heroicons:users';
  if (notif.data?.task_id) return 'heroicons:document-text';
  if (notif.data?.projet_id) return 'ph:folder';
  return 'heroicons:bell';
}

const { activeWorkspace, workspaces } = useWorkspaces();

const handleNotificationClick = (notif: any) => {
  const route = useRoute();
  const orgId = route.params.org_id;
  const wsId = notif.data?.workspace_id || activeWorkspace.value?.id || workspaces.value[0]?.id;

  if (notif.data?.task_id && wsId) {
    navigateTo(`/organization/${orgId}/workspace/${wsId}/tasks/${notif.data.task_id}`)
  } else if (notif.data?.projet_id && wsId) {
    navigateTo(`/organization/${orgId}/workspace/${wsId}/projects/${notif.data.projet_id}`)
  } else {
    navigateTo(`/organization/${orgId}/notifications/${notif.id}`)
  }
}
</script>

<template>
  <div class="flex flex-col h-full w-full max-h-full">
    <header class="flex flex-col md:flex-row md:justify-between w-full flex-shrink-0">
      <div class="py-2">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-300">Notifications</h1>
        <p class="text-secondary dark:text-gray-400 py-3 text-sm md:text-base">Consultez et gérez toutes vos alertes.</p>
      </div>
      <div class="py-4 md:py-10 flex flex-col md:flex-row justify-between md:justify-end items-center gap-4 w-full">
        <!-- Filter Status (Segmented Control) -->
        <div class="relative flex items-center bg-[#EFEFEF] dark:bg-black/20 p-1 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border border-gray-200/50 dark:border-gray-800 w-max isolate shrink-0">
          <div 
            class="absolute top-1 bottom-1 rounded-full bg-white dark:bg-[#2A2A2D] shadow-[0_2px_5px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] -z-10"
            :class="{
              'left-1 w-[80px]': filterStatus === 'all',
              'left-[81px] w-[95px]': filterStatus === 'unread'
            }"
          ></div>
          
          <button 
            @click="filterStatus = 'all'"
            :class="filterStatus === 'all' ? 'text-[#001D35] dark:text-white' : 'text-[#4B6B8A] hover:text-[#001D35] dark:text-gray-400 dark:hover:text-gray-200'"
            class="py-1.5 rounded-full text-[15px] font-medium transition-colors duration-300 w-[80px]"
          >Toutes</button>
          
          <button 
            @click="filterStatus = 'unread'"
            :class="filterStatus === 'unread' ? 'text-[#001D35] dark:text-white' : 'text-[#4B6B8A] hover:text-[#001D35] dark:text-gray-400 dark:hover:text-gray-200'"
            class="py-1.5 rounded-full text-[15px] font-medium transition-colors duration-300 w-[95px]"
          >Non lues</button>
        </div>

        <button @click="markAllAsRead" class="shrink-0 bg-transparent text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-all cursor-pointer flex items-center justify-center px-4 py-2 rounded-xl whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-800 w-full md:w-auto text-sm font-medium">
          <Icon name="heroicons:check" class="w-4 h-4 mr-2" />
          <span>Tout marquer lu</span>
        </button>
      </div>
    </header>

    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-8">
      <div v-if="loading" class="flex justify-center items-center h-32">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
      </div>
      
      <div v-else-if="filteredNotifications.length === 0" class="flex flex-col items-center justify-center h-64 text-secondary dark:text-gray-500 bg-card dark:bg-[#1D1D1D] rounded-xl border border-form-border dark:border-gray-800">
        <Icon name="heroicons:bell-slash" class="w-16 h-16 mb-4 opacity-50" />
        <p class="text-lg font-medium">Aucune notification trouvée</p>
        <p class="text-sm mt-1 opacity-75">Vous êtes à jour dans vos alertes.</p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div 
          v-for="notif in filteredNotifications" 
          :key="notif.id"
          class="group relative flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-transparent rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer overflow-hidden shadow-sm hover:shadow"
          @click="handleNotificationClick(notif)"
        >
          <div class="flex items-start gap-4 flex-1 min-w-0 pr-6">
            <div class="mt-0.5 shrink-0">
              <div :class="['w-11 h-11 rounded-full flex items-center justify-center', getNotifStyle(notif)]">
                <Icon :name="getNotifIcon(notif)" class="w-5 h-5" />
              </div>
            </div>
            
            <div class="flex flex-col min-w-0 flex-1">
              <h3 class="text-[15px] font-bold text-gray-900 dark:text-white truncate">{{ notif.data.title }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{{ notif.data.message }}</p>
              <span class="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium flex items-center gap-1 opacity-80">
                <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                {{ formatNotifTime(notif.created_at) }}
              </span>
            </div>
          </div>
          
          <div v-if="!notif.read_at" class="absolute right-5 top-1/2 -translate-y-1/2">
            <span class="block w-2.5 h-2.5 rounded-full bg-primary"></span>
          </div>
          
          <div class="flex items-center gap-2 mt-4 sm:mt-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-14 sm:ml-4">
            <button v-if="!notif.read_at" @click.stop="markAsRead(notif.id)" class="p-2 text-cyan-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors tooltip" title="Marquer lu">
              <Icon name="heroicons:check" class="w-5 h-5" />
            </button>
            <button @click.stop="deleteNotification(notif.id)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors tooltip" title="Supprimer">
              <Icon name="heroicons:trash" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
