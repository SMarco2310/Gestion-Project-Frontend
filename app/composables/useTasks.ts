import { TaskPriority, TaskStatus, TaskTag } from '~/utils/enums'

interface Tache {
  id: number | string
  title: string
  reference_code: string
  description: string
  status: string
  board_column?: string
  priority: string
  tag_ids?: (string | number)[] | null
  tags?: any[] | null
  projet_id?: number | string | null
  projet?: { id?: number | string; reference_code?: string; name?: string; end_date?: string; } | null
  parent_task_id?: number | string | null
  sub_tasks?: any[]
  commentaires_count?: number | 0
  due_date?: string
  created_at?: string
  updated_at?: string
  banner_image?: string | null
  assignee_id?: string | number | null
  assignee?: any | null
  checklists?: any[]
  attachments?: any[]
  user?: any | null
}

interface TaskPayload {
  title: string
  description?: string
  status?: string
  board_column?: string
  priority?: string
  tag_ids?: number[] | string[] | null
  projet_id?: number | string | null
  parent_task_id?: number | string | null
  due_date?: string
  banner_image?: string | null
  assignee_id?: string | number | null
}


export default function useTasks() {
  const tasks = useState<Tache[]>('tasks', () => [])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const { $api } = useNuxtApp()
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const normalizeTask = (task: any): Tache => {
    let projet = task.projet ?? null
    if (!projet && task.projet_id) {
      try {
        const { projets } = useProjets()
        const found = projets.value?.find((p: any) => String(p.id) === String(task.projet_id))
        if (found) {
          projet = {
            id: found.id,
            reference_code: found.reference_code || found.name,
            name: found.name,
            end_date: found.end_date
          }
        }
      } catch (e) {
        // ignore fallback
      }
    }

    return {
      id: task.id ?? task._id ?? '',
      title: task.title ?? task.name ?? 'Sans titre',
      reference_code: task.reference_code ?? '',
      description: task.description ?? '',
      status: task.status ?? TaskStatus.NOT_DONE,
      board_column: task.board_column ?? null,
      priority: task.priority ?? TaskPriority.MEDIUM,
      tag_ids: task.tags ? task.tags.map((t: any) => t.id) : (task.tag_ids ?? []),
      tags: task.tags ?? [],
      projet_id: task.projet_id ?? null,
      projet: projet,
      parent_task_id: task.parent_task_id ?? null,
      sub_tasks: task.sub_tasks ?? task.sub_tasks ?? task.subTasks ?? [],
      commentaires_count: task.commentaires_count ?? 0,
      due_date: task.due_date ?? '',
      created_at: task.created_at ?? new Date().toISOString(),
      updated_at: task.updated_at ?? '',
      banner_image: task.banner_image ? (task.banner_image.startsWith('http') ? task.banner_image : `http://localhost:8000${task.banner_image}`) : '',
      assignee_id: task.assignee_id ?? null,
      assignee: task.assignee ?? null,
      checklists: task.checklists ?? [],
      attachments: task.attachments ?? [],
    }
  }

  const getTasks = async (projectId?: number | string) => {
    isLoading.value = true
    error.value = null

    try {
      const route = useRoute()
      const { activeOrganization } = useOrganizations()
      const { activeWorkspace } = useWorkspaces()
      const orgId = activeOrganization.value?.id || route?.params?.org_id
      const wsId = activeWorkspace.value?.id || route?.params?.workspace_id
      
      let query = ''
      if (projectId) {
        query = `?projet_id=${projectId}`
        if (wsId) query += `&workspace_id=${wsId}`
        else if (orgId) query += `&organization_id=${orgId}`
      } else if (wsId) {
        query = `?workspace_id=${wsId}`
      } else if (orgId) {
        query = `?organization_id=${orgId}`
      }

      const data = await $api<Tache[] | any>(`/taches${query}`, {
        method: 'GET',
      })

      const rawTasks = Array.isArray(data) ? data : (data.taches ?? data.data?.data ?? data.data ?? data.tasks ?? [])
      const normalizedTasks = rawTasks.map(normalizeTask)

      if (projectId) {
        // Keep existing tasks from other projects and merge new ones
        const otherTasks = tasks.value.filter(t => String(t.projet_id) !== String(projectId))
        tasks.value = [...otherTasks, ...normalizedTasks]
        return normalizedTasks
      } else {
        tasks.value = normalizedTasks
        return tasks.value
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      if (!tasks.value.length) {
        tasks.value = []
      }
      error.value = 'Impossible de charger les tâches.'
      return tasks.value
    } finally {
      isLoading.value = false
    }
  }

  const getTask = async (id: number | string) => {
    try {
      const data = await $api<Tache | any>(`/taches/${id}`, {
        method: 'GET',
      })

      const rawTask = data.tache ?? data.task ?? data.Tache ?? data.data ?? data
      const nextTask = normalizeTask(rawTask)
      const index = tasks.value.findIndex((item) => String(item.id) === String(id))
      if (index !== -1) {
        tasks.value[index] = nextTask
      } else {
        tasks.value = [nextTask, ...tasks.value]
      }

      return nextTask
    } catch (err) {
      console.error('Failed to fetch task:', err)
      return tasks.value.find((item) => String(item.id) === String(id)) ?? null
    }
  }

  const createTask = async (payload: TaskPayload) => {
    try {
      const { activeWorkspace } = useWorkspaces()
      if (activeWorkspace.value?.id) {
         payload = { ...payload, workspace_id: activeWorkspace.value.id } as any
      }
      if ((payload as any).tag_id && (!payload.tag_ids || payload.tag_ids.length === 0)) {
        payload.tag_ids = [(payload as any).tag_id]
      }
      const data = await $api<Tache | any>('/taches', {
        method: 'POST',
        body: payload,
      })

      const rawTask = data.tache ?? data.task ?? data.Tache ?? data.data ?? data
      const createdTask = normalizeTask(rawTask)
      tasks.value = [createdTask, ...tasks.value]
      return createdTask
    } catch (err) {
      console.error('Failed to create task:', err)
      throw err
    }
  }

  const updateTask = async (id: number | string, payload: Partial<TaskPayload>) => {
    try {
      if ((payload as any).tag_id && (!payload.tag_ids || payload.tag_ids.length === 0)) {
        payload.tag_ids = [(payload as any).tag_id]
      }
      const data = await $api<any>(`/taches/${id}`, {
        method: 'PUT',
        body: payload,
      })

      const rawTask = data.tache ?? data.task ?? data.Tache ?? data.data ?? data
      const updatedTask = normalizeTask(rawTask)
      const index = tasks.value.findIndex((item) => String(item.id) === String(id))
      if (index !== -1) {
        const existingTask = tasks.value[index]
        if (!updatedTask.projet && existingTask?.projet) {
          updatedTask.projet = existingTask.projet
        }
        if (!updatedTask.assignee && existingTask?.assignee) {
          updatedTask.assignee = existingTask.assignee
        }
        if ((!updatedTask.tags || updatedTask.tags.length === 0) && existingTask?.tags && existingTask.tags.length > 0) {
          updatedTask.tags = existingTask.tags
        }
        tasks.value[index] = updatedTask
      }

      return updatedTask
    } catch (err) {
      console.error('Failed to update task:', err)
      throw err
    }
  }

  const uploadBanner = async (id: number | string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('banner_image', file)

      const data = await $api<any>(`/taches/${id}/banner`, {
        method: 'POST',
        body: formData,
      })

      const rawTask = data.tache ?? data.task ?? data.Tache ?? data.data ?? data
      const updatedTask = normalizeTask(rawTask)
      const index = tasks.value.findIndex((item) => String(item.id) === String(id))
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }

      return updatedTask
    } catch (err) {
      console.error('Failed to upload task banner:', err)
      throw err
    }
  }

  const deleteTask = async (id: number | string) => {
    try {
      await $api<{ message: string }>(`/taches/${id}`, {
        method: 'DELETE',
      })

      tasks.value = tasks.value.filter((item) => String(item.id) !== String(id))
      return true
    } catch (err) {
      console.error('Failed to delete task:', err)
      throw err
    }
  }

  // --- Checklists ---
  const createChecklist = async (taskId: number | string, title: string) => {
    const data = await $api<any>(`/taches/${taskId}/checklists`, {
      method: 'POST',
      body: { title },
    })
    return data.checklist
  }

  const deleteChecklist = async (checklistId: number | string) => {
    await $api<any>(`/checklists/${checklistId}`, {
      method: 'DELETE',
    })
  }

  const createChecklistItem = async (checklistId: number | string, content: string) => {
    const data = await $api<any>(`/checklists/${checklistId}/items`, {
      method: 'POST',
      body: { content },
    })
    return data.item
  }

  const updateChecklistItem = async (itemId: number | string, payload: { content?: string, is_done?: boolean }) => {
    const data = await $api<any>(`/checklist-items/${itemId}`, {
      method: 'PUT',
      body: payload,
    })
    return data.item
  }

  const deleteChecklistItem = async (itemId: number | string) => {
    await $api<any>(`/checklist-items/${itemId}`, {
      method: 'DELETE',
    })
  }

  // --- Attachments ---
  const uploadAttachment = async (taskId: number | string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const data = await $api<any>(`/taches/${taskId}/attachments`, {
      method: 'POST',
      body: formData,
    })
    return data.attachment
  }

  const deleteAttachment = async (attachmentId: number | string) => {
    await $api<any>(`/attachments/${attachmentId}`, {
      method: 'DELETE',
    })
  }

  return {
    tasks,
    isLoading,
    error,
    getTasks,
    getTask,
    createTask,
    updateTask,
    uploadBanner,
    deleteTask,
    createChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    uploadAttachment,
    deleteAttachment,
  }
}