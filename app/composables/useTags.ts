import { ref } from 'vue'

export interface Tag {
  id: number
  name: string
  color: string | null
  is_default: boolean
  user_id: number | null
}

export default function useTags() {
  const tags = ref<Tag[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const token = useCookie('auth_token')
  const config = useRuntimeConfig()
  
  const getTags = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<{ tags: Tag[], success: boolean }>(`${config.public.apiBaseUrl}/api/tags`, {
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Accept': 'application/json'
        }
      })
      tags.value = response.tags
      return response.tags
    } catch (e: any) {
      error.value = e.message || 'Erreur lors du chargement des étiquettes'
      console.error(e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const createTag = async (payload: { name: string, color?: string }) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<{ tag: Tag, success: boolean }>(`${config.public.apiBaseUrl}/api/tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: payload
      })
      tags.value.push(response.tag)
      return response.tag
    } catch (e: any) {
      error.value = e.message || 'Erreur lors de la création de l\'étiquette'
      console.error(e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const deleteTag = async (tagId: number | string) => {
    isLoading.value = true
    error.value = null
    try {
      await $fetch(`${config.public.apiBaseUrl}/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Accept': 'application/json'
        }
      })
      tags.value = tags.value.filter(t => t.id !== Number(tagId))
    } catch (e: any) {
      error.value = e.message || 'Erreur lors de la suppression de l\'étiquette'
      console.error(e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    tags,
    isLoading,
    error,
    getTags,
    createTag,
    deleteTag
  }
}
