import { TaskPriority, TaskStatus, TaskTag } from '~/utils/enums'

interface Tache {
  id: number | string
  title: string
  reference_code: string
  description: string
  status: string
  priority: string
  tag: string
  projet_id?: number | string | null
  parent_task_id?: number | string | null
  sub_tasks?: any[]
  commentaires_count?: number
  due_date?: string
  created_at?: string
  updated_at?: string
  banner_image?: string
}

interface TaskPayload {
  title: string
  description?: string
  status?: string
  priority?: string
  tag?: string
  projet_id?: number | string | null
  parent_task_id?: number | string | null
  due_date?: string
  banner_image?: string | null
}


export default function useTasks() {
  const tasks = useState<Tache[]>('tasks', () => [])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const { $api } = useNuxtApp()

  const normalizeTask = (task: any): Tache => ({
    id: task.id ?? task._id ?? '',
    title: task.title ?? task.name ?? 'Sans titre',
    reference_code: task.reference_code ?? '',
    description: task.description ?? '',
    status: task.status ?? TaskStatus.TO_DO,
    priority: task.priority ?? TaskPriority.MEDIUM,
    tag: task.tag ?? TaskTag.FEATURE,
    projet_id: task.projet_id ?? task.project_id ?? null,
    parent_task_id: task.parent_task_id ?? null,
    sub_tasks: task.sub_tasks ?? task.sub_tasks ?? task.subTasks ?? [],
    commentaires_count: task.commentaires_count ?? 0,
    due_date: task.due_date ?? '',
    created_at: task.created_at ?? '',
    updated_at: task.updated_at ?? '',
    banner_image: task.banner_image ? (task.banner_image.startsWith('http') ? task.banner_image : `http://localhost:8000${task.banner_image}`) : '',
  })

  const getTasks = async (projectId?: number | string) => {
    isLoading.value = true
    error.value = null

    try {
      const query = projectId ? `?projet_id=${projectId}` : ''
      const data = await $api<Tache[] | any>(`/api/taches${query}`, {
        method: 'GET',
      })

      const rawTasks = Array.isArray(data) ? data : data.tasks ?? data.data ?? []
      tasks.value = rawTasks.map(normalizeTask)
      return tasks.value
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
      const data = await $api<Tache | any>(`/api/taches/${id}`, {
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
      const data = await $api<Tache | any>('/api/taches', {
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
      const data = await $api<any>(`/api/taches/${id}`, {
        method: 'PUT',
        body: payload,
      })

      const rawTask = data.tache ?? data.task ?? data.Tache ?? data.data ?? data
      const updatedTask = normalizeTask(rawTask)
      const index = tasks.value.findIndex((item) => String(item.id) === String(id))
      if (index !== -1) {
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

      const data = await $api<any>(`/api/taches/${id}/banner`, {
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
      await $api<{ message: string }>(`/api/taches/${id}`, {
        method: 'DELETE',
      })

      tasks.value = tasks.value.filter((item) => String(item.id) !== String(id))
      return true
    } catch (err) {
      console.error('Failed to delete task:', err)
      throw err
    }
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
  }
}