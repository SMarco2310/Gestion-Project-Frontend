<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
    layout: 'custom',
})

const route = useRoute()
const router = useRouter()
const notificationId = route.params.id as string

const { 
  notifications, 
  loading,
  fetchNotifications,
  markAsRead,
  deleteNotification
} = useNotification()

onMounted(async () => {
  if (notifications.value.length === 0) {
    await fetchNotifications()
  }
})

const notification = computed(() => {
  return notifications.value.find((n: any) => n.id === notificationId)
})

const formatNotifTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }
    return new Intl.DateTimeFormat('fr-FR', options).format(date)
  } catch (e) {
    return dateStr
  }
}

const handleMarkAsRead = async () => {
  if (notification.value && !notification.value.read_at) {
    await markAsRead(notification.value.id)
  }
}

const handleDelete = async () => {
  if (notification.value) {
    await deleteNotification(notification.value.id)
    router.push(`/organization/${route.params.org_id}/notifications`)
  }
}

const handleActionClick = () => {
  if (notification.value) {
    if (notification.value.data.task_id) {
      navigateTo(`/organization/${route.params.org_id}/tasks/${notification.value.data.task_id}`)
    } else if (notification.value.data.projet_id) {
      navigateTo(`/organization/${route.params.org_id}/projects/${notification.value.data.projet_id}`)
    }
  }
}
</script>

<template>
  <div class="flex flex-col h-full w-full max-h-full">
    <header class="flex flex-col md:flex-row md:justify-between w-full flex-shrink-0">
      <div class="py-2 flex items-center gap-4">
        <button @click="router.push(`/organization/${route.params.org_id}/notifications`)" class="p-2 bg-card dark:bg-[#1D1D1D] rounded-lg border border-form-border dark:border-gray-800 hover:bg-canvas dark:hover:bg-gray-800 transition-colors text-secondary dark:text-gray-400">
          <Icon name="heroicons:arrow-left" class="w-6 h-6" />
        </button>
        <div>
          <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-300">Détails de la notification</h1>
        </div>
      </div>
    </header>

    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-8 mt-6">
      <div v-if="loading" class="flex justify-center items-center h-32">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
      </div>
      
      <div v-else-if="!notification" class="flex flex-col items-center justify-center h-64 text-secondary dark:text-gray-500 bg-card dark:bg-[#1D1D1D] rounded-xl border border-form-border dark:border-gray-800">
        <Icon name="heroicons:exclamation-triangle" class="w-16 h-16 mb-4 opacity-50 text-yellow-500" />
        <p class="text-lg font-medium">Notification introuvable</p>
        <p class="text-sm mt-1 opacity-75">Elle a peut-être été supprimée.</p>
        <button @click="router.push(`/organization/${route.params.org_id}/notifications`)" class="mt-6 text-primary hover:underline">
          Retour aux notifications
        </button>
      </div>

      <div v-else class="max-w-3xl mx-auto bg-card dark:bg-[#1D1D1D] rounded-2xl border border-form-border dark:border-gray-800 overflow-hidden shadow-sm">
        <div class="p-6 md:p-8 border-b border-form-border dark:border-gray-800">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary dark:text-blue-400 shrink-0">
                <Icon :name="notification.data.task_id ? 'heroicons:clipboard-document-list' : (notification.data.projet_id ? 'heroicons:folder' : 'heroicons:bell')" class="w-6 h-6" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-main dark:text-white">{{ notification.data.title }}</h2>
                <p class="text-sm text-secondary dark:text-gray-400 mt-1">{{ formatNotifTime(notification.created_at) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="!notification.read_at" class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                Non lu
              </span>
              <span v-else class="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                Lu
              </span>
            </div>
          </div>
        </div>

        <div class="p-6 md:p-8">
          <div class="prose dark:prose-invert max-w-none text-main dark:text-gray-300">
            <p class="text-lg leading-relaxed">{{ notification.data.message }}</p>
          </div>

          <div class="mt-10 flex flex-wrap gap-4">
            <button 
              v-if="notification.data.task_id || notification.data.projet_id"
              @click="handleActionClick" 
              class="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:brightness-110 flex items-center gap-2 shadow-sm"
            >
              <Icon :name="notification.data.task_id ? 'heroicons:clipboard-document-list' : 'heroicons:folder'" class="w-5 h-5" />
              <span>Voir {{ notification.data.task_id ? 'la tâche' : 'le projet' }}</span>
            </button>

            <button 
              v-if="!notification.read_at"
              @click="handleMarkAsRead" 
              class="bg-canvas dark:bg-[#2A2A2D] text-main dark:text-white border border-form-border dark:border-gray-700 px-6 py-2.5 rounded-lg font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <Icon name="heroicons:check" class="w-5 h-5" />
              <span>Marquer comme lu</span>
            </button>

            <button 
              @click="handleDelete" 
              class="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-6 py-2.5 rounded-lg font-medium transition-all hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-2 ml-auto"
            >
              <Icon name="heroicons:trash" class="w-5 h-5" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
