interface Commentaire {
  id: number | string
  content: string
  user_id: number | string | null
  tache_id: number | string | null
  created_at?: string
  updated_at?: string
  user?: {
    id: number | string
    name: string
    avatar?: string
  }
}

interface CommentairePayload {
  content: string
  tache_id: number | string | null
  user_id?: number | string | null
}

const commentaires = useState<Commentaire[]>('commentaires', () => [])

export default function useCommentaire() {
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
    created_at: item.created_at ?? item.createdAt ?? '',
    updated_at: item.updated_at ?? item.updatedAt ?? '',
    user: item.user ? {
      id: item.user.id ?? item.user._id ?? '',
      name: item.user.name ?? item.user.full_name ?? 'Utilisateur',
      avatar: "`https://api.dicebear.com/7.x/initials/svg?seed=${item.user.name ?? 'U'}&chars=1`",
    } : undefined,
  })

  const getCommentaires = async (tacheId?: number | string | null) => {
    isLoading.value = true
    error.value = null

    const query = tacheId ? `?tache_id=${tacheId}` : ''

    try {
      const data = await $fetch<{ commentaires: Commentaire[]; success: boolean }>(`http://localhost:8000/api/commentaires${query}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token.value}` },
      })

      commentaires.value = (data.commentaires ?? []).map(normalizeCommentaire)
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
      const data = await $fetch<{ commentaire: Commentaire; success: boolean }>('http://localhost:8000/api/commentaires', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: payload,
      })

      const created = normalizeCommentaire(data.commentaire)
      commentaires.value = [created, ...commentaires.value]
      return created
    } catch (err) {
      console.error('Failed to create commentaire:', err)
      throw err
    }
  }

  return {
    commentaires,
    isLoading,
    error,
    getCommentaires,
    createCommentaire,
  }
}
