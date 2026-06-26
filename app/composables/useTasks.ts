import { TaskPriority, TaskStatus, TaskTag } from '~/utils/enums'

interface Tache {
  id: number | string
  title: string
  description: string
  status: string
  priority: string
  tag: string
  projet_id?: number | string | null
  created_at?: string
  updated_at?: string
}

interface TaskPayload {
  title: string
  description?: string
  status?: string
  priority?: string
  tag?: string
  projet_id?: number | string | null
}

const defaultTasks: Tache[] = [
  {
    id: 1,
    title: 'Write Sprint 2 report — goal, completed stories, velocity, retrospective notes',
    description: 'Prepare the sprint summary for the team review.',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    tag: TaskTag.DOCUMENTATION,
    projet_id: 1,
  },
  {
    id: 2,
    title: 'Write integration tests for emergency and contacts endpoints',
    description: 'Add regression coverage for the API endpoints.',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    tag: TaskTag.TESTING,
    projet_id: 1,
  },
  {
    id: 3,
    title: 'Deploy frontend to Vercel or Netlify — connected to live backend',
    description: 'Prepare the deployment checklist and verify the live environment.',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    tag: TaskTag.DEPLOYMENT,
    projet_id: 1,
  },
]

export default function useTasks() {
  const tasks = useState<Tache[]>('tasks', () => [...defaultTasks])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const { $api } = useNuxtApp()

  const normalizeTask = (task: any): Tache => ({
    id: task.id ?? task._id ?? '',
    title: task.title ?? task.name ?? 'Sans titre',
    description: task.description ?? '',
    status: task.status ?? TaskStatus.TO_DO,
    priority: task.priority ?? TaskPriority.MEDIUM,
    tag: task.tag ?? TaskTag.FEATURE,
    projet_id: task.projet_id ?? task.project_id ?? null,
    created_at: task.created_at ?? '',
    updated_at: task.updated_at ?? '',
  })

  const getTasks = async (projectId?: number | string) => {
    isLoading.value = true
    error.value = null

    try {
      const query = projectId ? `?projet_id=${projectId}` : ''
      const data = await $api<{ tasks: Tache[]; success: boolean }>(`/api/taches${query}`, {
        method: 'GET',
      })

      tasks.value = (data.tasks ?? []).map(normalizeTask)
      return tasks.value
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      if (!tasks.value.length) {
        tasks.value = [...defaultTasks]
      }
      error.value = 'Impossible de charger les tâches.'
      return tasks.value
    } finally {
      isLoading.value = false
    }
  }

  const getTask = async (id: number | string) => {
    try {
      const data = await $api<{ task: Tache; success: boolean }>(`/api/taches/${id}`, {
        method: 'GET',
      })

      const nextTask = normalizeTask(data.task)
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
      const data = await $api<{ task: Tache; success: boolean }>('/api/taches', {
        method: 'POST',
        body: payload,
      })

      const createdTask = normalizeTask(data.task)
      tasks.value = [createdTask, ...tasks.value]
      return createdTask
    } catch (err) {
      console.error('Failed to create task:', err)
      throw err
    }
  }

  const updateTask = async (id: number | string, payload: Partial<TaskPayload>) => {
    try {
      const data = await $api<{ task: Tache; success: boolean }>(`/api/taches/${id}`, {
        method: 'PUT',
        body: payload,
      })

      const updatedTask = normalizeTask(data.task)
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
    deleteTask,
  }
}