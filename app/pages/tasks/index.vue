<script setup lang="ts">
import { TaskStatus } from '~/utils/enums'

definePageMeta({
    layout: 'custom',
    // middleware: 'auth',
})

import { useToast } from '~/composables/useToast'

const { tasks, getTasks, deleteTask, updateTask, createTask } = useTasks()
const { addToast } = useToast()

const todoItems = ref<any[]>([])
const inProgressItems = ref<any[]>([])
const doneItems = ref<any[]>([])

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<string | null>(null)
const taskModalEditMode = ref(false)

const isCreateTaskModalOpen = ref(false)

const handleCreateTaskSubmit = async (payload: any) => {
  try {
    await createTask(payload)
    await getTasks()
    isCreateTaskModalOpen.value = false
    addToast({ type: 'success', title: 'Tâche créée', message: 'La tâche a été créée avec succès.' })
  } catch (e) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer la tâche.' })
  }
}

const handleTaskClick = (taskId: string) => {
  selectedTaskId.value = taskId
  taskModalEditMode.value = false
  isTaskModalOpen.value = true
}

const handleEditTask = (taskId: string) => {
  selectedTaskId.value = taskId
  taskModalEditMode.value = true
  isTaskModalOpen.value = true
}

const handleDeleteTask = async (taskId: string) => {
  if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
    try {
      await deleteTask(taskId)
      addToast({ type: 'success', title: 'Tâche supprimée', message: 'La tâche a été supprimée avec succès.' })
    } catch (e) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer la tâche.' })
    }
  }
}

const handleCloseTaskModal = () => {
  isTaskModalOpen.value = false
  selectedTaskId.value = null
  taskModalEditMode.value = false
}

const handleTaskMoved = async (taskId: string, newStatus: string) => {
  try {
    // Map internal enum/status to the backend status string (en cours, à faire, terminé)
    let mappedStatus = newStatus
    if (newStatus === TaskStatus.TO_DO) mappedStatus = 'à faire'
    if (newStatus === TaskStatus.IN_PROGRESS) mappedStatus = 'en cours'
    if (newStatus === TaskStatus.DONE) mappedStatus = 'terminé'

    await updateTask(taskId, { status: mappedStatus })
    // No toast here to avoid spamming on drag and drop
  } catch (error) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de déplacer la tâche.' })
    await getTasks() // Reset the board if it failed
  }
}

// Tag colors are handled directly via the tag object now

const mapTaskToBoardItem = (task: any) => ({
  id: String(task.id),
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  tag: {
    label: task.tag?.name || 'SANS ÉTIQUETTE',
    colorHex: task.tag?.color || '#9CA3AF',
    icon: 'ph:tag-duotone',
  },
  reference: task.reference_code || `T-${String(task.id).padStart(2, '0')}`,
  issueTypeIcon: 'ph:bookmark-simple-fill',
  issueTypeColorClass: 'text-emerald-600',
  statusIcon: 'ph:check',
  statusColorClass: 'text-emerald-500',
  commentairesCount: task.commentaires_count || 0,
  bannerImage: task.banner_image || undefined,
  assignee: {
    initials: 'U',
    colorClass: 'bg-gray-600',
  },
})

const { projets, getProjets } = useProjets()

const projectOptions = computed(() => {
  return projets.value.map((p: any) => ({
    id: p.id,
    label: p.name || p.reference_code
  }))
})

const filterText = ref('')
const selectedProjects = ref<(string | number)[]>([])
const selectedPriorities = ref<(string | number)[]>([])
const selectedTags = ref<(string | number)[]>([])
const selectedDateSort = ref('recent')

const handleFilterUpdate = (filters: { priorities: (string | number)[], projects: (string | number)[], statuses: (string | number)[], tags?: (string | number)[], dateSort?: string }) => {
  selectedProjects.value = filters.projects
  selectedPriorities.value = filters.priorities
  selectedTags.value = filters.tags || []
  selectedDateSort.value = filters.dateSort || 'recent'
}

const filteredTasks = computed(() => {
  let result = tasks.value

  if (selectedProjects.value.length > 0) {
    result = result.filter(t => t.projet_id != null && selectedProjects.value.includes(t.projet_id as string | number))
  }

  if (selectedPriorities.value.length > 0) {
    result = result.filter(t => t.priority != null && selectedPriorities.value.includes(t.priority))
  }

  if (selectedTags.value.length > 0) {
    result = result.filter(t => t.tag != null && selectedTags.value.includes(t.tag))
  }

  if (filterText.value) {
    const searchTerm = filterText.value.toLowerCase()
    result = result.filter(t => 
      t.title.toLowerCase().includes(searchTerm) ||
      (t.description && t.description.toLowerCase().includes(searchTerm)) ||
      (t.reference_code && t.reference_code.toLowerCase().includes(searchTerm))
    )
  }

  // Apply sorting
  result = [...result].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return selectedDateSort.value === 'recent' ? dateB - dateA : dateA - dateB
  })

  return result
})

const syncBoardItems = () => {
  todoItems.value = filteredTasks.value
    .filter((task) => task.status === TaskStatus.TO_DO || task.status === 'à faire')
    .map(mapTaskToBoardItem)

  inProgressItems.value = filteredTasks.value
    .filter((task) => task.status === TaskStatus.IN_PROGRESS || task.status === 'en cours')
    .map(mapTaskToBoardItem)

  doneItems.value = filteredTasks.value
    .filter((task) => task.status === TaskStatus.DONE || task.status === 'terminé')
    .map(mapTaskToBoardItem)
}

watch(filteredTasks, () => {
  const totalInBoard = todoItems.value.length + inProgressItems.value.length + doneItems.value.length
  let needsFullSync = filteredTasks.value.length !== totalInBoard

  if (!needsFullSync) {
    for (const t of filteredTasks.value) {
      const mappedStatus = t.status === 'TO_DO' || t.status === 'à faire' ? TaskStatus.TO_DO : 
                           (t.status === 'IN_PROGRESS' || t.status === 'en cours' ? TaskStatus.IN_PROGRESS : 
                           (t.status === 'DONE' || t.status === 'terminé' ? TaskStatus.DONE : t.status))
                           
      const inTodo = todoItems.value.some(i => i.id === String(t.id))
      const inInProgress = inProgressItems.value.some(i => i.id === String(t.id))
      const inDone = doneItems.value.some(i => i.id === String(t.id))
      
      if (mappedStatus === TaskStatus.TO_DO && !inTodo) needsFullSync = true
      if (mappedStatus === TaskStatus.IN_PROGRESS && !inInProgress) needsFullSync = true
      if (mappedStatus === TaskStatus.DONE && !inDone) needsFullSync = true
    }
  }

  if (needsFullSync) {
    syncBoardItems()
  } else {
    filteredTasks.value.forEach(t => {
      const mapped = mapTaskToBoardItem(t)
      const updateItem = (list: any[]) => {
        const item = list.find(i => i.id === mapped.id)
        if (item) Object.assign(item, mapped)
      }
      updateItem(todoItems.value)
      updateItem(inProgressItems.value)
      updateItem(doneItems.value)
    })
  }
}, { deep: true })

onMounted(async () => {
  await Promise.all([
    getTasks(),
    getProjets()
  ])
  syncBoardItems()
})
</script>

<template>
  <div class="flex flex-col h-full w-full max-h-full">
    <header class="flex flex-col md:flex-row md:justify-between w-full flex-shrink-0">
    <div class="py-2">
      <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-300">Tasks Overview</h1>
      <p class="text-secondary dark:text-gray-400 py-3 text-sm md:text-base">Gérer et suivre l'avancement de toutes vos tâches.</p>
    </div>
    <div id="search-bar" class="py-4 md:py-10 flex flex-row justify-between md:justify-end items-center gap-2 md:gap-4 w-full">
            <div class="relative flex items-center flex-1 md:flex-none">
                <Icon name="heroicons:magnifying-glass" class="w-5 h-5 text-secondary dark:text-gray-400 absolute left-4 pointer-events-none" />
                <input v-model="filterText" type="text" placeholder="Rechercher" class="bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-gray-300 placeholder-form-placeholder px-4 py-2.5 rounded-md pl-11 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 w-full md:w-96">
            </div>
            <FilterDropdown 
              :showProjects="true" 
              :showStatus="false" 
              :showTags="true"
              :projectOptions="projectOptions"
              @update:filters="handleFilterUpdate"
              class="shrink-0" 
            />
            <button @click="isCreateTaskModalOpen = true" class="shrink-0 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white transition-all cursor-pointer flex items-center justify-center px-3 md:px-4 py-2 rounded-md whitespace-nowrap neo-emboss active:neo-inset hover:brightness-110">
              <Icon name="heroicons:plus" class="w-5 h-5" />
              <span class="px-2 font-medium hidden md:inline">Ajouter une tâche</span>
            </button>
        </div>
  </header>
    <!-- Kanban Board Columns -->
    <div class="flex gap-4 md:gap-6 flex-1 min-h-0 pb-4 overflow-x-auto snap-x snap-mandatory flex-nowrap custom-scrollbar">
      <!-- Empty State Column -->
      <BoardColumn 
        title="À faire" 
        v-model:items="todoItems" 
        :allowCreate="true"
        @taskClick="handleTaskClick"
        @editTask="handleEditTask"
        @deleteTask="handleDeleteTask"
        @taskMoved="handleTaskMoved($event, TaskStatus.TO_DO)"
      />
      
      <!-- In Progress State Column -->
      <BoardColumn 
        title="En cours" 
        v-model:items="inProgressItems" 
        :allowCreate="false"
        @taskClick="handleTaskClick"
        @editTask="handleEditTask"
        @deleteTask="handleDeleteTask"
        @taskMoved="handleTaskMoved($event, TaskStatus.IN_PROGRESS)"
      />
    
      <!-- Loaded State Column -->
      <BoardColumn 
        title="Terminé" 
        v-model:items="doneItems" 
        :isDone="true" 
        @taskClick="handleTaskClick"
        @editTask="handleEditTask"
        @deleteTask="handleDeleteTask"
        @taskMoved="handleTaskMoved($event, TaskStatus.DONE)"
      />
    </div>
    <!-- Task Modal -->
    <TaskModal 
      :isOpen="isTaskModalOpen" 
      :task-id="selectedTaskId" 
      :startInEditMode="taskModalEditMode"
      @close="handleCloseTaskModal" 
    />
    <!-- Create Task Modal -->
    <CreateTaskModal
      :is-open="isCreateTaskModalOpen"
      :create-task="handleCreateTaskSubmit"
      @close="isCreateTaskModalOpen = false"
    />
  </div>
</template>