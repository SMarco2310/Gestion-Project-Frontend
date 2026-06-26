<script setup lang="ts">
import { TaskStatus, TaskTag } from '~/utils/enums'

definePageMeta({
    layout: 'custom',
    // middleware: 'auth',
})

const { tasks, getTasks } = useTasks()

const todoItems = ref<any[]>([])
const inProgressItems = ref<any[]>([])
const doneItems = ref<any[]>([])

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<string | null>(null)

const handleTaskClick = (taskId: string) => {
  selectedTaskId.value = taskId
  isTaskModalOpen.value = true
}

const handleCloseTaskModal = () => {
  isTaskModalOpen.value = false
  selectedTaskId.value = null
}

const getTagColorClass = (tag: string) => {
  switch (tag) {
    case TaskTag.TESTING:
      return 'bg-amber-500 text-black'
    case TaskTag.DEPLOYMENT:
      return 'bg-sky-300 text-black'
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
  reference: `T-${String(task.id).padStart(2, '0')}`,
  issueTypeIcon: 'ph:bookmark-simple-fill',
  issueTypeColorClass: 'text-emerald-600',
  statusIcon: 'ph:check',
  statusColorClass: 'text-emerald-500',
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

watch(tasks, syncBoardItems, { deep: true })

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
      />
      
      <!-- In Progress State Column -->
      <BoardColumn 
        title="En cours" 
        v-model:items="inProgressItems" 
        :allowCreate="false"
        @taskClick="handleTaskClick"
      />
    
      <!-- Loaded State Column -->
      <BoardColumn 
        title="Terminé" 
        v-model:items="doneItems" 
        :isDone="true" 
        @taskClick="handleTaskClick"
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