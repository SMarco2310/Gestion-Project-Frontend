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

const handleNotificationClick = (notif: any) => {
  const route = useRoute();
  if (notif.data?.task_id) {
    navigateTo(`/organization/${route.params.org_id}/tasks/${notif.data.task_id}`)
  } else if (notif.data?.projet_id) {
    navigateTo(`/organization/${route.params.org_id}/projects/${notif.data.projet_id}`)
  } else {
    navigateTo(`/organization/${route.params.org_id}/notifications/${notif.id}`)
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
        <!-- Search bar -->
        <div class="relative flex items-center w-full md:w-auto">
          <Icon name="heroicons:magnifying-glass" class="w-5 h-5 text-secondary dark:text-gray-400 absolute left-4 pointer-events-none" />
          <input v-model="filterText" type="text" placeholder="Rechercher..." class="bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-gray-300 placeholder-form-placeholder px-4 py-2.5 rounded-md pl-11 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 w-full md:w-80">
        </div>
        
        <!-- Filter Status -->
        <CustomSelect
          v-model="filterStatus"
          :options="[
            { value: 'all', label: 'Toutes', icon: 'ph:list' },
            { value: 'unread', label: 'Non lues', icon: 'ph:envelope-simple' },
            { value: 'read', label: 'Lues', icon: 'ph:envelope-open' }
          ]"
          buttonClass="bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-gray-300 px-4 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 w-full md:w-40 cursor-pointer flex justify-between items-center"
        />

        <button @click="markAllAsRead" class="shrink-0 bg-card dark:bg-[#1D1D1D] text-main dark:text-white border border-form-border dark:border-gray-800 transition-all cursor-pointer flex items-center justify-center px-4 py-2.5 rounded-md whitespace-nowrap hover:bg-canvas dark:hover:bg-gray-800 w-full md:w-auto">
          <Icon name="heroicons:check-circle" class="w-5 h-5 mr-2" />
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
          class="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card dark:bg-[#1D1D1D] rounded-xl border border-form-border dark:border-gray-800 hover:border-primary dark:hover:border-blue-500 transition-colors cursor-pointer overflow-hidden"
          :class="{'bg-blue-50/30 dark:bg-blue-900/10': !notif.read_at}"
          @click="handleNotificationClick(notif)"
        >
          <div v-if="!notif.read_at" class="absolute left-0 top-0 bottom-0 w-1 bg-primary dark:bg-blue-500"></div>
          
          <div class="flex items-start gap-4 flex-1 min-w-0 pl-2">
            <div class="mt-1 shrink-0">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary dark:text-blue-400">
                <Icon :name="notif.data.task_id ? 'heroicons:clipboard-document-list' : (notif.data.projet_id ? 'heroicons:folder' : 'heroicons:bell')" class="w-5 h-5" />
              </div>
            </div>
            
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-base font-semibold text-main dark:text-white truncate" :class="{'font-bold': !notif.read_at}">{{ notif.data.title }}</span>
                <span v-if="!notif.read_at" class="w-2 h-2 rounded-full bg-primary shrink-0"></span>
              </div>
              <p class="text-sm text-secondary dark:text-gray-400 mt-1 line-clamp-2">{{ notif.data.message }}</p>
              <span class="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium flex items-center gap-1">
                <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                {{ formatNotifTime(notif.created_at) }}
              </span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 mt-4 sm:mt-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-14 sm:ml-4">
            <button v-if="!notif.read_at" @click.stop="markAsRead(notif.id)" class="p-2 text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors tooltip" title="Marquer lu">
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
