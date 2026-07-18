export interface Invitation {
  id: string | number
  email: string
  token: string
  organization_id: string | number
  team_id?: string | number
  projet_id?: string | number
  role: string
  status: string
  expires_at: string
  organization?: { id: string | number; name: string }
  team?: { id: string | number; name: string }
  projet?: { id: string | number; name: string }
  inviter?: { id: string | number; name: string }
}

export default function useInvite() {
  const { $api } = useNuxtApp()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const getInvitation = async (token: string) => {
    isLoading.value = true
    error.value = null
    try {
      const data = await $api<{ success: boolean; message: string; invitation: Invitation }>(`/invitations/${token}`, {
        method: 'GET',
      })
      return data.invitation
    } catch (err: any) {
      console.error('Failed to fetch invitation:', err)
      error.value = err?.data?.message || 'Failed to fetch invitation details.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const acceptInvitation = async (token: string) => {
    isLoading.value = true
    error.value = null
    try {
      const data = await $api<{ success: boolean; message: string }>(`/invitations/${token}/accept`, {
        method: 'POST',
      })
      return data
    } catch (err: any) {
      console.error('Failed to accept invitation:', err)
      error.value = err?.data?.message || 'Failed to accept invitation.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    getInvitation,
    acceptInvitation,
  }
}
