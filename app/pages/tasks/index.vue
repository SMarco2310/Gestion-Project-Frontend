<script setup lang="ts">
import { TaskStatus, TaskTag } from '~/utils/enums'

definePageMeta({
    layout: 'custom',
    // middleware: 'auth',
})

import { useToast } from '~/composables/useToast'

const { tasks, getTasks, deleteTask, updateTask } = useTasks()
const { addToast } = useToast()

const todoItems = ref<any[]>([])
const inProgressItems = ref<any[]>([])
const doneItems = ref<any[]>([])

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<string | null>(null)

const handleTaskClick = (taskId: string) => {
  selectedTaskId.value = taskId
  isTaskModalOpen.value = true
}

const handleEditTask = (taskId: string) => {
  selectedTaskId.value = taskId
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

const getTagColorClass = (tag: string) => {
  switch (tag) {
    case TaskTag.TESTING:
      return 'bg-amber-500 text-black'
    case TaskTag.DEPLOYMENT:
      return 'bg-sky-300 text-black'
    case TaskTag.BUG:
      return 'bg-red-500 text-white'
    case TaskTag.FEATURE:
      return 'bg-blue-500 text-white'
    case TaskTag.IMPROVEMENT:
      return 'bg-emerald-500 text-white'
    case TaskTag.DOCUMENTATION:
      return 'bg-purple-500 text-white'
    case TaskTag.DESIGN:
      return 'bg-pink-500 text-white'
    default:
      return 'bg-[#3A3A3D] text-gray-300'
  }
}

const getTagIcon = (tag: string) => {
  switch (tag) {
    case TaskTag.TESTING:
      return 'ph:pencil-simple-duotone'
    case TaskTag.DEPLOYMENT:
      return 'ph:rocket-launch-duotone'
    case TaskTag.BUG:
      return 'ph:bug-duotone'
    case TaskTag.FEATURE:
      return 'ph:star-duotone'
    case TaskTag.IMPROVEMENT:
      return 'ph:trend-up-duotone'
    case TaskTag.DOCUMENTATION:
      return 'ph:book-open-duotone'
    case TaskTag.DESIGN:
      return 'ph:palette-duotone'
    default:
      return 'ph:file-duotone'
  }
}

const mapTaskToBoardItem = (task: any) => ({
  id: String(task.id),
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  tag: {
    label: task.tag || TaskTag.DOCUMENTATION,
    colorClass: getTagColorClass(task.tag || TaskTag.DOCUMENTATION),
    icon: getTagIcon(task.tag || TaskTag.DOCUMENTATION),
  },
  reference: task.reference_code || `T-${String(task.id).padStart(2, '0')}`,
  issueTypeIcon: 'ph:bookmark-simple-fill',
  issueTypeColorClass: 'text-emerald-600',
  statusIcon: 'ph:check',
  statusColorClass: 'text-emerald-500',
  commentairesCount: task.commentaires_count || 0,
  assignee: {
    initials: 'U',
    colorClass: 'bg-gray-600',
  },
})

const syncBoardItems = () => {
  todoItems.value = tasks.value
    .filter((task) => task.status === TaskStatus.TO_DO)
    .map(mapTaskToBoardItem)

  inProgressItems.value = tasks.value
    .filter((task) => task.status === TaskStatus.IN_PROGRESS)
    .map(mapTaskToBoardItem)

  doneItems.value = tasks.value
    .filter((task) => task.status === TaskStatus.DONE)
    .map(mapTaskToBoardItem)
}

watch(tasks, () => {
  const totalInBoard = todoItems.value.length + inProgressItems.value.length + doneItems.value.length
  let needsFullSync = tasks.value.length !== totalInBoard

  if (!needsFullSync) {
    for (const t of tasks.value) {
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
    tasks.value.forEach(t => {
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
  await getTasks()
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
                <input type="text" placeholder="Rechercher" class="bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-gray-300 placeholder-form-placeholder px-4 py-2.5 rounded-md pl-11 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 w-full md:w-96">
            </div>
            <FilterDropdown :showProjects="true" :showStatus="false" class="shrink-0" />
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
      @close="handleCloseTaskModal" 
    />
  </div>
</template>