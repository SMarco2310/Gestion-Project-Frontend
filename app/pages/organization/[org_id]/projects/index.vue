<script setup lang="ts">
definePageMeta({
  layout: "custom",
  // middleware: 'auth',
})


import useTasks from '~/composables/useTasks'

const { isOwner } = useAuth()
const { projets, getProjets, createProjet, deleteProjet, archiveProjet } = useProjets()
const { tasks, getTasks } = useTasks()

const isArchivedSectionOpen = ref(false)

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

const getProjectUsers = (p: any) => {
  const usersMap = new Map();
  // Directly assigned users
  if (p.users && Array.isArray(p.users)) {
    p.users.forEach((u: any) => usersMap.set(u.id, u));
  }
  // Team members
  if (p.teams && Array.isArray(p.teams)) {
    p.teams.forEach((t: any) => {
      if (t.members && Array.isArray(t.members)) {
        t.members.forEach((u: any) => usersMap.set(u.id, u));
      }
    });
  }
  // Include project owner if available
  if (p.user) {
    usersMap.set(p.user.id, p.user);
  }
  
  return Array.from(usersMap.values()).map((u: any) => {
    let pic = u.profile_picture;
    if (pic && !pic.startsWith('http')) {
      pic = `http://localhost:8000${pic}`;
    }
    return { ...u, profile_picture: pic };
  });
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

const handleArchiveProject = async (projectId: number | string) => {
  try {
    await archiveProjet(projectId, true)
    const { addToast } = useToast()
    addToast({ type: 'success', title: 'Projet archivé', message: 'Le projet a été archivé avec succès.' })
  } catch (error) {
    const { addToast } = useToast()
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'archiver le projet.' })
  }
}

const handleUnarchiveProject = async (projectId: number | string) => {
  try {
    await archiveProjet(projectId, false)
    const { addToast } = useToast()
    addToast({ type: 'success', title: 'Projet désarchivé', message: 'Le projet a été désarchivé avec succès.' })
  } catch (error) {
    const { addToast } = useToast()
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de désarchiver le projet.' })
  }
}

const handleCreateProjectSubmit = async (data: any) => {
  try {
    await createProjet(
      data.name,
      data.description,
      data.status,
      data.start_date,
      data.end_date,
      data.color
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
const selectedDateSort = ref('recent')

const statusOptions = [
  { id: 'à faire', label: 'À faire' },
  { id: 'en cours', label: 'En cours' },
  { id: 'terminé', label: 'Terminé' },
]

const handleFilterUpdate = (filters: { priorities: (string | number)[]; projects: (string | number)[]; statuses: (string | number)[]; tags: (string | number)[]; dateSort: string }) => {
  selectedStatuses.value = filters.statuses
  selectedDateSort.value = filters.dateSort || 'recent'
}

const filteredProjets = computed(() => {
  let result = projets.value || []

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

  // Apply sorting
  result = [...result].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return selectedDateSort.value === 'recent' ? dateB - dateA : dateA - dateB
  })

  return result
})

const activeProjects = computed(() => filteredProjets.value.filter((p: any) => !p.is_archived))
const archivedProjects = computed(() => filteredProjets.value.filter((p: any) => p.is_archived))


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
          <button @click="isCreateModalOpen = true" class="shrink-0 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white transition-all cursor-pointer flex items-center justify-center px-3 md:px-4 py-2 rounded-md whitespace-nowrap neo-emboss active:neo-inset hover:brightness-110">
            <Icon name="heroicons:plus" class="w-5 h-5" />
            <span class="px-2 font-medium hidden md:inline">Ajouter un projet</span>
          </button>
        </div>

      </div>
    </header>

    <template v-if="projets && projets.length > 0">
      <section v-if="activeProjects.length > 0" id="projects-section" class="pt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ProjetCard
          v-for="p in activeProjects" :key="p.id"
          :id="p.id"
          :user_id="(p as any).user_id"
          :reference_code="p.reference_code"
          :name="p.name"
          :description="p.description"
          :status="(p as any).status || 'à faire'"
          :color="p.color"
          :is_archived="p.is_archived"
          :end_date="(p as any).end_date || ''"
          :metrics="getProjectMetrics(p.id)"
          :users="getProjectUsers(p)"
          @cardClick="handleProjectClick"
          @delete="handleDeleteProject"
          @edit="handleEditProject"
          @archive="handleArchiveProject"
          @unarchive="handleUnarchiveProject"
        />
      </section>
      
      <div v-else-if="filteredProjets.length > 0" class="flex flex-col items-center justify-center py-16 text-center">
        <!-- We have projects but they are all archived -->
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Icon name="heroicons:archive-box" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-bold text-main dark:text-white mb-2">Tous les projets sont archivés</h3>
        <p class="text-secondary dark:text-gray-400 text-sm">Déployez la section des projets archivés ci-dessous pour les voir.</p>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Icon name="heroicons:magnifying-glass" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-bold text-main dark:text-white mb-2">Aucun projet trouvé</h3>
        <p class="text-secondary dark:text-gray-400 text-sm">Vos filtres ou votre recherche ne correspondent à aucun projet.</p>
      </div>

      <!-- Archived Projects Collapsible Section -->
      <div v-if="archivedProjects.length > 0" class="mt-12 mb-8 border-t border-form-border dark:border-gray-800 pt-6">
        <button @click="isArchivedSectionOpen = !isArchivedSectionOpen" class="flex items-center gap-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 transition-colors font-bold group">
          <Icon :name="isArchivedSectionOpen ? 'heroicons:chevron-down' : 'heroicons:chevron-right'" class="w-5 h-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
          <Icon name="heroicons:archive-box" class="w-5 h-5" />
          <span>Projets archivés ({{ archivedProjects.length }})</span>
        </button>

        <section v-show="isArchivedSectionOpen" class="pt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-70 hover:opacity-100 transition-opacity duration-300">
          <ProjetCard
            v-for="p in archivedProjects" :key="p.id"
            :id="p.id"
            :user_id="(p as any).user_id"
            :reference_code="p.reference_code"
            :name="p.name"
            :description="p.description"
            :status="(p as any).status || 'à faire'"
            :color="p.color"
            :is_archived="p.is_archived"
            :end_date="(p as any).end_date || ''"
            :metrics="getProjectMetrics(p.id)"
            :users="getProjectUsers(p)"
            @cardClick="handleProjectClick"
            @delete="handleDeleteProject"
            @edit="handleEditProject"
            @archive="handleArchiveProject"
            @unarchive="handleUnarchiveProject"
          />
        </section>
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col items-center justify-center py-20 mt-10 text-center mx-auto max-w-2xl">
        <div class="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
          <Icon name="heroicons:folder-open" class="w-12 h-12 text-primary" />
        </div>
        <h2 class="text-2xl font-bold text-main dark:text-white mb-3">Aucun projet pour le moment</h2>
        <p class="text-secondary dark:text-gray-400 mb-8 max-w-sm px-4 leading-relaxed">
          Vous n'avez pas encore de projet dans cette organisation. Créez votre premier projet pour commencer à collaborer.
        </p>
        <button @click="isCreateModalOpen = true" class="bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white font-bold py-3.5 px-8 rounded-xl neo-emboss active:neo-inset hover:brightness-110 flex items-center gap-2 transition-all shadow-lg">
          <Icon name="heroicons:plus" class="w-6 h-6" />
          Créer un nouveau projet
        </button>
      </div>
    </template>

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