import { ref } from 'vue'

export interface Tag {
  id: string | number
  name: string
  color: string | null
  is_default: boolean
  user_id: string | number | null
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
      const { $api } = useNuxtApp()
      const response = await $api<{ tags: Tag[], success: boolean }>('/tags', {
        method: 'GET'
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
      const { $api } = useNuxtApp()
      const response = await $api<{ tag: Tag, success: boolean }>('/tags', {
        method: 'POST',
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

  const updateTag = async (tagId: number | string, payload: { name: string, color?: string }) => {
    isLoading.value = true
    error.value = null
    try {
      const { $api } = useNuxtApp()
      const response = await $api<{ tag: Tag, success: boolean }>(`/tags/${tagId}`, {
        method: 'PUT',
        body: payload
      })
      const index = tags.value.findIndex(t => String(t.id) === String(tagId))
      if (index !== -1) {
        tags.value[index] = response.tag
      }
      return response.tag
    } catch (e: any) {
      error.value = e.message || 'Erreur lors de la modification de l\'étiquette'
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
      const { $api } = useNuxtApp()
      await $api(`/tags/${tagId}`, {
        method: 'DELETE'
      })
      tags.value = tags.value.filter(t => String(t.id) !== String(tagId))
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
    updateTag,
    deleteTag
  }
}
