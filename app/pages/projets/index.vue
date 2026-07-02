<script setup lang="ts">
definePageMeta({
  layout: "custom",
  // middleware: 'auth',
})


import useTasks from '~/composables/useTasks'

const { isOwner } = useAuth()
const { projets, getProjets, createProjet, deleteProjet } = useProjets()
const { tasks, getTasks } = useTasks()

await Promise.all([
  getProjets(),
  getTasks()
])

const getProjectMetrics = (projectId: number | string) => {
  const projectTasks = tasks.value.filter(t => String(t.projet_id) === String(projectId))
  const totalTasks = projectTasks.length
  const doneTasks = projectTasks.filter(t => t.status === 'terminé').length
  const inProgressTasks = projectTasks.filter(t => t.status === 'en cours').length
  const todoTasks = projectTasks.filter(t => t.status === 'à faire').length
  const tasksProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return { totalTasks, doneTasks, inProgressTasks, todoTasks, tasksProgress }
}

const isCreateModalOpen = ref(false)
const isSideSheetOpen = ref(false)
const selectedProjectId = ref<number | string | null>(null)
const sideSheetEditMode = ref(false)

const handleProjectClick = (projectId: number | string) => {
  selectedProjectId.value = projectId
  sideSheetEditMode.value = false
  isSideSheetOpen.value = true
}

const handleEditProject = (projectId: number | string) => {
  selectedProjectId.value = projectId
  sideSheetEditMode.value = true
  isSideSheetOpen.value = true
}

const handleCloseSideSheet = () => {
  isSideSheetOpen.value = false
  selectedProjectId.value = null
  sideSheetEditMode.value = false
}

import { useToast } from '~/composables/useToast'

const handleDeleteProject = async (projectId: number | string) => {
  try {
    await deleteProjet(projectId)
    await getProjets() // Refresh the list after deletion
    const { addToast } = useToast()
    addToast({ type: 'success', title: 'Projet supprimé', message: 'Le projet a été supprimé avec succès.' })
  } catch (error) {
    console.error('Error deleting project:', error)
    const { addToast } = useToast()
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer le projet.' })
  }
}
const handleCreateProjectSubmit = async (data: any) => {
  try {
    await createProjet(
      data.name,
      data.description,
      data.status,
      data.start_date,
      data.end_date
    )
    await getProjets()
    const { addToast } = useToast()
    addToast({ type: 'success', title: 'Projet créé', message: 'Le projet a été créé avec succès.' })
  } catch (error) {
    console.error(error)
    const { addToast } = useToast()
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer le projet.' })
    throw error
  }
}

const filterText = ref('')
const selectedStatuses = ref<(string | number)[]>([])

const statusOptions = [
  { id: 'à faire', label: 'À faire' },
  { id: 'en cours', label: 'En cours' },
  { id: 'terminé', label: 'Terminé' },
]

const handleFilterUpdate = (filters: { priorities: (string | number)[]; projects: (string | number)[]; statuses: (string | number)[] }) => {
  selectedStatuses.value = filters.statuses
}

const filteredProjets = computed(() => {
  let result = projets.value

  if (selectedStatuses.value.length > 0) {
    result = result.filter(p => selectedStatuses.value.includes((p as any).status || 'à faire'))
  }

  if (filterText.value) {
    const searchTerm = filterText.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      (p.reference_code && p.reference_code.toLowerCase().includes(searchTerm)) ||
      (p.description && p.description.toLowerCase().includes(searchTerm))
    )
  }

  return result
})
</script>

<template>
  <div>
    <header>
      <div class="pb-5">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-300">Projets Overview</h1>
        <p class="text-secondary dark:text-gray-400 pt-3 text-sm md:text-base">Gérer et suivre l'avancement de tous vos projets.</p>
      </div>
      <div class="flex flex-row justify-between md:items-center pb-5 gap-2 md:gap-4 w-full">

        <div id="search-bar" class="flex-1 md:flex-none">
          <div class="relative flex items-center w-full">
            <Icon name="heroicons:magnifying-glass" class="w-5 h-5 text-secondary dark:text-gray-400 absolute left-4 pointer-events-none" />
            <input v-model="filterText" type="text" placeholder="Rechercher" class="bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-gray-300 placeholder-form-placeholder w-full px-4 py-2.5 rounded-md pl-11 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 md:w-96">
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-3 shrink-0">
          <FilterDropdown 
            :showProjects="false" 
            :showStatus="true" 
            :showPriority="false" 
            :statusOptions="statusOptions"
            @update:filters="handleFilterUpdate"
            class="shrink-0" 
          />
          <button v-if="isOwner" @click="isCreateModalOpen = true" class="shrink-0 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white transition-all cursor-pointer flex items-center justify-center px-3 md:px-4 py-2 rounded-md whitespace-nowrap neo-emboss active:neo-inset hover:brightness-110">
            <Icon name="heroicons:plus" class="w-5 h-5" />
            <span class="px-2 font-medium hidden md:inline">Ajouter un projet</span>
          </button>
        </div>

      </div>
    </header>

    <section id="projects-section" class="pt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <ProjetCard
        v-for="p in filteredProjets" :key="p.id"
        :id="p.id"
        :reference_code="p.reference_code"
        :name="p.name"
        :description="p.description"
        :status="(p as any).status || 'à faire'"
        :end_date="(p as any).end_date || ''"
        :metrics="getProjectMetrics(p.id)"
        @cardClick="handleProjectClick"
        @delete="handleDeleteProject"
        @edit="handleEditProject"
      />
    </section>

    <!-- Create Project Modal -->
    <CreateProjectModal
      :is-open="isCreateModalOpen"
      :create-project="handleCreateProjectSubmit"
      @close="isCreateModalOpen = false"
    />

    <!-- Project Side Sheet -->
    <ProjectSideSheet
      :is-open="isSideSheetOpen"
      :project-id="selectedProjectId"
      :start-in-edit-mode="sideSheetEditMode"
      @close="handleCloseSideSheet"
    />
  </div>
</template>