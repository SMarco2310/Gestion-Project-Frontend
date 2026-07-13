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
      const response = await $api<{ notifications: Notification[] }>('/notifications', {
        method: 'GET'
      })
      notifications.value = response.notifications
      await fetchUnreadCount()
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
      const data = await $api<{ unread_count: number }>('/notifications/unread-count', { method: 'GET' })
      unreadCount.value = data.unread_count
      return data.unread_count
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      throw error
    }
  }

  /**
   * Clear all notifications.
   */
  const clearAll = async () => {
    try {
      await $api('/notifications/clear', {
        method: 'POST'
      })
      notifications.value = []
      unreadCount.value = 0
    } catch (error) {
      console.error('Failed to clear notifications:', error)
      throw error
    }
  }

  /**
   * Mark a single notification as read.
   */
  const markAsRead = async (id: string) => {
    try {
      await $api(`/notifications/${id}/read`, {
        method: 'POST'
      })
      const notif = notifications.value.find((n: any) => n.id === id)
      if (notif && !notif.read_at) {
        notif.read_at = new Date().toISOString()
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
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
      await $api('/notifications/read-all', {
        method: 'POST'
      })
      notifications.value = notifications.value.map((n: any) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString()
      }))
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
      await $api(`/notifications/${id}`, {
        method: 'DELETE'
      })
      const notif = notifications.value.find((n: any) => n.id === id)
      notifications.value = notifications.value.filter((n: any) => n.id !== id)
      if (notif && !notif.read_at) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
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
  const startPolling = (intervalMs = 10000) => {
    stopPolling()
    pollInterval = setInterval(() => {
      fetchUnreadCount().catch(() => { })
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
