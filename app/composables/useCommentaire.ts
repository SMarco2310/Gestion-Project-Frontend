interface Commentaire {
  id: number | string
  content: string
  user_id: number | string | null
  tache_id: number | string | null
  user?: { id: number | string; name: string } | null
  created_at?: string
  updated_at?: string
}

interface CommentairePayload {
  content: string
  tache_id: number | string | null
}

export default function useCommentaire() {
  const commentaires = useState<Commentaire[]>('commentaires', () => [])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: process.client ? window.location.protocol === 'https:' : false,
  })

  const normalizeCommentaire = (item: any): Commentaire => ({
    id: item.id ?? item._id ?? '',
    content: item.content ?? item.body ?? '',
    user_id: item.user_id ?? item.userId ?? null,
    tache_id: item.tache_id ?? item.task_id ?? null,
    user: item.user ?? null,
    created_at: item.created_at ?? item.createdAt ?? '',
    updated_at: item.updated_at ?? item.updatedAt ?? '',
  })

  const getCommentaires = async (tacheId?: number | string | null) => {
    isLoading.value = true
    error.value = null
    commentaires.value = []

    const query = tacheId ? `?tache_id=${tacheId}` : ''

    try {
      const { $api } = useNuxtApp()
      const data = await $api<{ commentaires: Commentaire[]; success: boolean } | any>(`/commentaires${query}`, {
        method: 'GET',
      })

      commentaires.value = (data.commentaires ?? data.data ?? data ?? []).map(normalizeCommentaire)
      return commentaires.value
    } catch (err) {
      console.error('Failed to fetch commentaires:', err)
      error.value = 'Impossible de charger les commentaires.'
      commentaires.value = []
      return commentaires.value
    } finally {
      isLoading.value = false
    }
  }

  const createCommentaire = async (payload: CommentairePayload) => {
    if (!payload.content.trim() || !payload.tache_id) {
      throw new Error('Message de commentaire ou identifiant de tâche manquant.')
    }

    try {
      const { $api } = useNuxtApp()
      const data = await $api<{ commentaire: Commentaire; success: boolean }>('/commentaires', {
        method: 'POST',
        body: payload,
      })

      const created = normalizeCommentaire(data.commentaire ?? data)
      commentaires.value = [created, ...commentaires.value]
      return created
    } catch (err) {
      console.error('Failed to create commentaire:', err)
      throw err
    }
  }

  const updateCommentaire = async (id: number | string, content: string) => {
    if (!content.trim()) {
      throw new Error('Le message de commentaire ne peut pas être vide.')
    }

    try {
      const { $api } = useNuxtApp()
      const data = await $api<{ commentaire: Commentaire; success: boolean }>(`/commentaires/${id}`, {
        method: 'PUT',
        body: { content },
      })

      const updated = normalizeCommentaire(data.commentaire ?? data)
      const index = commentaires.value.findIndex(c => String(c.id) === String(id))
      if (index !== -1) {
        commentaires.value[index] = updated
      }
      return updated
    } catch (err) {
      console.error('Failed to update commentaire:', err)
      throw err
    }
  }

  return {
    commentaires,
    isLoading,
    error,
    getCommentaires,
    createCommentaire,
    updateCommentaire,
  }
}
