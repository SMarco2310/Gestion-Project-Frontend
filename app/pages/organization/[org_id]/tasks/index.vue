<script setup lang="ts">
import { TaskStatus } from '~/utils/enums'
import draggable from 'vuedraggable'

definePageMeta({
    layout: 'custom',
    // middleware: 'auth',
})

import { useToast } from '~/composables/useToast'

const { tasks, getTasks, deleteTask, updateTask, createTask } = useTasks()
const { activeOrganization, updateKanbanColumns } = useOrganizations()
const { addToast } = useToast()

const kanbanColumns = computed(() => {
  return activeOrganization.value?.kanban_columns?.length 
    ? activeOrganization.value.kanban_columns 
    : ['À faire', 'En cours', 'Terminé']
})

const localColumns = ref<{name: string}[]>([])

watch(kanbanColumns, (newCols) => {
  // Only update localColumns if it's empty or lengths differ, to avoid interrupting drags
  // Actually, we should sync it whenever the actual source of truth changes, 
  // but be careful not to create a new array reference if the content is the same order.
  const currentLocalNames = localColumns.value.map(c => c.name).join(',')
  const newNames = newCols.join(',')
  if (currentLocalNames !== newNames) {
    localColumns.value = newCols.map((col: string) => ({ name: col }))
  }
}, { immediate: true })

const handleColumnReorder = async () => {
  if (!activeOrganization.value) return
  const newColumns = localColumns.value.map((c) => c.name)
  const oldColumns = [...activeOrganization.value.kanban_columns || []]
  
  // Optmistic UI update
  activeOrganization.value = {
    ...activeOrganization.value,
    kanban_columns: newColumns
  }
  
  try {
    await updateKanbanColumns(activeOrganization.value.id, newColumns)
  } catch (e) {
    // Revert on error
    activeOrganization.value.kanban_columns = oldColumns
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de réorganiser les colonnes.' })
  }
}

const boardItems = ref<Record<string, any[]>>({})

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

const handleTaskMoved = async (taskId: string, newColumn: string) => {
  try {
    const payload: any = { board_column: newColumn }
    if (newColumn.toLowerCase() === 'terminé' || newColumn.toLowerCase() === 'done') {
      payload.status = 'terminé'
    }
    await updateTask(taskId, payload)
  } catch (error) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de déplacer la tâche.' })
    await getTasks() // Reset the board if it failed
  }
}

const handleToggleStatus = async (taskId: string) => {
  const task = tasks.value.find((t: any) => String(t.id) === String(taskId))
  if (!task) return
  const newStatus = task.status === 'terminé' ? 'à faire' : 'terminé'
  try {
    await updateTask(taskId, { status: newStatus })
  } catch (error) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de changer le statut.' })
  }
}

const kanbanColors = computed(() => {
  return activeOrganization.value?.kanban_colors || {}
})

const handleRenameColumn = async (oldName: string, newName: string) => {
  if (!activeOrganization.value) return
  if (['à faire', 'to do', 'en cours', 'in progress', 'terminé', 'done'].includes(oldName.toLowerCase())) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de renommer une colonne système.' })
    return
  }
  if (kanbanColumns.value.includes(newName)) {
    addToast({ type: 'error', title: 'Erreur', message: 'Ce nom de colonne existe déjà.' })
    return
  }
  
  const newColumns = kanbanColumns.value.map(col => col === oldName ? newName : col)
  const renames = { [oldName]: newName }
  
  const currentColors = activeOrganization.value.kanban_colors || {}
  const newColors = { ...currentColors }
  if (newColors[oldName]) {
    newColors[newName] = newColors[oldName]
    delete newColors[oldName]
  }
  
  try {
    await updateKanbanColumns(activeOrganization.value.id, newColumns, newColors, renames)
    addToast({ type: 'success', title: 'Succès', message: 'Colonne renommée avec succès.' })
    await getTasks() // Refresh tasks to get the new status
  } catch (error) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de renommer la colonne.' })
  }
}

const handleAddColumn = async () => {
  if (!activeOrganization.value) return
  const newName = 'Nouvelle colonne'
  let finalName = newName
  let i = 1
  while (kanbanColumns.value.includes(finalName)) {
    finalName = `${newName} ${i}`
    i++
  }
  
  const newColumns = [...kanbanColumns.value, finalName]
  try {
    await updateKanbanColumns(activeOrganization.value.id, newColumns, activeOrganization.value.kanban_colors || {})
    addToast({ type: 'success', title: 'Succès', message: 'Colonne ajoutée avec succès.' })
  } catch (error) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'ajouter la colonne.' })
  }
}

const handleDeleteColumn = async (colName: string) => {
  if (!activeOrganization.value) return
  if (['à faire', 'to do', 'en cours', 'in progress', 'terminé', 'done'].includes(colName.toLowerCase())) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer une colonne système.' })
    return
  }
  if (kanbanColumns.value.length <= 1) {
    addToast({ type: 'warning', title: 'Action impossible', message: 'Vous ne pouvez pas supprimer la dernière colonne.' })
    return
  }
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer la colonne "${colName}" ? Toutes les tâches qu'elle contient seront déplacées vers la première colonne.`)) {
    return
  }
  
  const targetCol = kanbanColumns.value.find(c => c !== colName) || kanbanColumns.value[0] || ''
  const newColumns = kanbanColumns.value.filter(c => c !== colName)
  const renames: Record<string, string> = { [colName]: targetCol }
  
  const currentColors: Record<string, string> = activeOrganization.value.kanban_colors || {}
  const newColors: Record<string, string> = { ...currentColors }
  delete newColors[colName]
  
  try {
    await updateKanbanColumns(activeOrganization.value.id, newColumns, newColors, renames)
    addToast({ type: 'success', title: 'Succès', message: 'Colonne supprimée avec succès.' })
    await getTasks() // Refresh tasks
  } catch (error) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer la colonne.' })
  }
}

const handleUpdateColumnColor = async (colName: string, color: string) => {
  if (!activeOrganization.value) return
  const currentColors = activeOrganization.value.kanban_colors || {}
  const newColors = { ...currentColors, [colName]: color }
  
  try {
    await updateKanbanColumns(activeOrganization.value.id, kanbanColumns.value, newColors)
    addToast({ type: 'success', title: 'Succès', message: 'Couleur de colonne modifiée.' })
  } catch (error) {
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de modifier la couleur.' })
  }
}

// Tag colors are handled directly via the tag object now

const mapTaskToBoardItem = (task: any) => ({
  id: String(task.id),
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.due_date,
  tags: task.tags?.map((t: any) => ({
    id: t.id,
    label: t.name || 'SANS ÉTIQUETTE',
    colorHex: t.color || '#9CA3AF',
    icon: 'ph:tag-duotone',
  })) || [],
  reference: task.reference_code || `T-${String(task.id).padStart(2, '0')}`,
  issueTypeIcon: 'ph:bookmark-simple-fill',
  issueTypeColorClass: 'text-emerald-600',
  statusIcon: 'ph:check',
  statusColorClass: 'text-emerald-500',
  commentairesCount: task.commentaires_count || 0,
  subtasksTotal: task.sub_tasks ? task.sub_tasks.length : 0,
  subtasksCompleted: task.sub_tasks ? task.sub_tasks.filter((st: any) => st.status === 'terminé').length : 0,
  bannerImage: task.banner_image || undefined,
  assignee: task.assignee ? {
    initials: task.assignee.name?.charAt(0)?.toUpperCase() || '?',
    colorClass: 'bg-blue-500',
    profilePicture: task.assignee.profile_picture ? (task.assignee.profile_picture.startsWith('http') ? task.assignee.profile_picture : `http://localhost:8000${task.assignee.profile_picture}`) : null
  } : {
    icon: 'ph:user',
  },
  projetName: task.projet?.name || task.projet?.reference_code || null,
})

const { projets, getProjets } = useProjets()

const projectOptions = computed(() => {
  return projets.value.map((p: any) => ({
    id: p.id,
    label: p.name || p.reference_code
  }))
})

const tagOptions = computed(() => {
  const uniqueTags = new Map()
  
  // 1. Add standard/default tags first so they always appear at the top
  const defaultTags = [
    { id: 'bug', label: 'BUG' },
    { id: 'feature', label: 'FEATURE' },
    { id: 'improvement', label: 'IMPROVEMENT' },
    { id: 'documentation', label: 'DOCUMENTATION' },
    { id: 'design', label: 'DESIGN' },
    { id: 'testing', label: 'TESTING' },
    { id: 'deployment', label: 'DEPLOYMENT' }
  ]
  defaultTags.forEach(t => uniqueTags.set(t.id, t))

  // 2. Add any additional user-created tags found in current tasks
  tasks.value.forEach((t: any) => {
    if (t.tags) {
      t.tags.forEach((tag: any) => {
        const tagName = tag.name || tag
        const tagId = tagName.toLowerCase()
        if (!uniqueTags.has(tagId)) {
          uniqueTags.set(tagId, { id: tagId, label: tagName.toUpperCase() })
        }
      })
    }
  })
  return Array.from(uniqueTags.values())
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
    result = result.filter(t => t.tags && t.tags.some((tag: any) => selectedTags.value.includes(tag.name || tag)))
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
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return selectedDateSort.value === 'recent' ? dateB - dateA : dateA - dateB
  })

  return result
})

const syncBoardItems = () => {
  const newBoardItems: Record<string, any[]> = {}
  
  kanbanColumns.value.forEach((col: string) => {
    newBoardItems[col] = []
  })

  const firstCol = kanbanColumns.value[0] || 'À faire'

  filteredTasks.value.forEach((task) => {
    // If the task has a board_column, place it there. Otherwise fallback to its status.
    let targetCol = task.board_column || task.status
    
    // If the target column doesn't exist on the board anymore, push it to the first column
    if (!kanbanColumns.value.includes(targetCol)) {
      targetCol = firstCol
    }
    
    const colArray = newBoardItems[targetCol]
    if (colArray) {
       colArray.push(mapTaskToBoardItem(task))
    }
  })

  boardItems.value = newBoardItems
}

watch([filteredTasks, kanbanColumns], () => {
  syncBoardItems()
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
              :tagOptions="tagOptions"
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
    <draggable 
      v-model="localColumns"
      @change="handleColumnReorder"
      item-key="name"
      class="flex gap-4 md:gap-6 flex-1 min-h-0 pb-4 overflow-x-auto scroll-smooth flex-nowrap custom-scrollbar"
      handle=".column-drag-handle"
      ghost-class="opacity-40"
      :animation="200"
    >
      <template #item="{ element: col }">
        <BoardColumn 
          :title="col.name" 
          :color="kanbanColors[col.name]"
          v-model:items="boardItems[col.name]" 
          :allowCreate="true"
          :isDone="col.name.toLowerCase() === 'terminé' || col.name.toLowerCase() === 'done'"
          @taskClick="handleTaskClick"
          @editTask="handleEditTask"
          @deleteTask="handleDeleteTask"
          @taskMoved="handleTaskMoved($event, col.name)"
          @rename="handleRenameColumn(col.name, $event)"
          @deleteColumn="handleDeleteColumn(col.name)"
          @toggleStatus="handleToggleStatus"
          @updateColor="handleUpdateColumnColor(col.name, $event)"
        />
      </template>
      <template #footer>
        <!-- Add Column Button -->
        <div class="w-[85vw] min-w-[85vw] md:w-[340px] md:min-w-[340px] shrink-0 md:shrink-0 flex items-start h-fit max-h-full">
          <button @click="handleAddColumn" class="w-full py-4 bg-canvas/50 dark:bg-[#161618]/50 hover:bg-canvas dark:hover:bg-[#161618] border-2 border-dashed border-form-border dark:border-[#2A2A2D] rounded-lg text-secondary dark:text-gray-400 hover:text-main dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap">
            <Icon name="ph:plus" class="text-xl" />
            Ajouter une colonne
          </button>
        </div>
      </template>
    </draggable>
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