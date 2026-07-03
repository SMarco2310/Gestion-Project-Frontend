interface Notification {
  id: string
  type: string
  data: {
    title: string
    message: string
    type?: string
    projet_id?: number
    task_id?: number
    [key: string]: any
  }
  read_at: string | null
  created_at: string
  updated_at: string
}

export default function useNotification() {
  const USE_MOCK_DATA = false; // Set to false to revert to real API

  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'App\\Notifications\\AddedToProjectNotification',
      data: { title: 'Nouveau projet', message: 'Vous avez été ajouté au projet Refonte Site Web.', projet_id: 12 },
      read_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      type: 'App\\Notifications\\TaskAssignedNotification',
      data: { title: 'Nouvelle tâche', message: 'La tâche "Maquette UI" vous a été assignée.', task_id: 45 },
      read_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      type: 'App\\Notifications\\SystemNotification',
      data: { title: 'Mise à jour système', message: 'Le système sera en maintenance ce soir à 20h.' },
      read_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  const notifications = useState<(Notification | any)[]>('notifications', () => [])
  const unreadCount = useState<number>('unread_count', () => 0)
  const loading = useState<boolean>('notifications_loading', () => false)

  const { $api } = useNuxtApp()

  /**
   * Fetch all notifications for the authenticated user.
   */
  const fetchNotifications = async () => {
    loading.value = true
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500)) // simulate loading
        notifications.value = [...mockNotifications]
        unreadCount.value = notifications.value.filter((n) => !n.read_at).length
        return notifications.value
      }
      const rawData = await $api<any>('/api/notifications', { method: 'GET' })
      const notificationsArray = rawData.data?.data ?? rawData.data ?? rawData ?? []
      notifications.value = notificationsArray
      // Update unread count from the fetched list
      unreadCount.value = notificationsArray.filter((n: any) => !n.read_at).length
      return notificationsArray
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch the unread notification count.
   */
  const fetchUnreadCount = async () => {
    try {
      if (USE_MOCK_DATA) {
        return unreadCount.value;
      }
      const data = await $api<{ unread_count: number }>('/api/notifications/unread-count', { method: 'GET' })
      unreadCount.value = data.unread_count
      return data.unread_count
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      throw error
    }
  }

  /**
   * Mark a single notification as read.
   */
  const markAsRead = async (id: string) => {
    try {
      if (USE_MOCK_DATA) {
        const notif = notifications.value.find((n) => n.id === id)
        if (notif) notif.read_at = new Date().toISOString()
        unreadCount.value = Math.max(0, unreadCount.value - 1)
        return;
      }
      await $api(`/api/notifications/${id}/read`, { method: 'POST' })
      // Update local state
      const notif = notifications.value.find((n) => n.id === id)
      if (notif) notif.read_at = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read.
   */
  const markAllAsRead = async () => {
    try {
      if (USE_MOCK_DATA) {
        notifications.value.forEach((n) => {
          if (!n.read_at) n.read_at = new Date().toISOString()
        })
        unreadCount.value = 0
        return;
      }
      await $api('/api/notifications/read-all', { method: 'POST' })
      notifications.value.forEach((n) => {
        if (!n.read_at) n.read_at = new Date().toISOString()
      })
      unreadCount.value = 0
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      throw error
    }
  }

  /**
   * Delete a notification.
   */
  const deleteNotification = async (id: string) => {
    try {
      if (USE_MOCK_DATA) {
        const index = notifications.value.findIndex((n) => n.id === id)
        if (index !== -1) {
          const wasUnread = !notifications.value[index].read_at
          notifications.value.splice(index, 1)
          if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        return;
      }
      await $api(`/api/notifications/${id}`, { method: 'DELETE' })
      const index = notifications.value.findIndex((n) => n.id === id)
      if (index !== -1) {
        const wasUnread = !notifications.value[index].read_at
        notifications.value.splice(index, 1)
        if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  // Polling interval reference
  let pollInterval: ReturnType<typeof setInterval> | null = null

  /**
   * Start polling for unread count every `intervalMs` milliseconds (default 30s).
   */
  const startPolling = (intervalMs = 120000) => {
    stopPolling()
    pollInterval = setInterval(() => {
      if (!USE_MOCK_DATA) {
        fetchUnreadCount().catch(() => {})
      }
    }, intervalMs)
  }

  /**
   * Stop polling.
   */
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
  }
}
