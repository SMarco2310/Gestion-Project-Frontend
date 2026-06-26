<script setup lang="ts">
definePageMeta({
  layout: "custom",
  // middleware: 'auth',
})


const { projets, getProjets,createProjet,deleteProjet } = useProjets()
await getProjets()

const isCreateModalOpen = ref(false)

const handleProjectClick = (projectId: number | string) => {
  navigateTo(`/projets/${projectId}`)
}

const handleDeleteProject = async (projectId: number | string) => {
  try {
    await deleteProjet(projectId)
    await getProjets() // Refresh the list after deletion
  } catch (error) {
    console.error('Error deleting project:', error)
  }
}
const handleCreateProjectSubmit = async (data: any) => {
  try {
    await createProjet(
      data.name,
      data.description,
      data.reference_code,
      data.end_date,
      data.status,
      data.user_id
    )
    await getProjets()
  } catch (error) {
    console.error(error)
    throw error
  }
}
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
            <input type="text" placeholder="Rechercher" class="bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-gray-300 placeholder-form-placeholder w-full px-4 py-2.5 rounded-md pl-11 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 md:w-96">
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-3 shrink-0">
          <FilterDropdown :showProjects="false" :showStatus="true" :showPriority="false" class="shrink-0" />
          <button @click="isCreateModalOpen = true" class="shrink-0 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white transition-all cursor-pointer flex items-center justify-center px-3 md:px-4 py-2 rounded-md whitespace-nowrap neo-emboss active:neo-inset hover:brightness-110">
            <Icon name="heroicons:plus" class="w-5 h-5" />
            <span class="px-2 font-medium hidden md:inline">Ajouter un projet</span>
          </button>
        </div>

      </div>
    </header>

    <section id="projects-section" class="pt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <ProjetCard
        v-for="p in projets" :key="p.id"
        :id="p.id"
        :reference_code="p.reference_code"
        :name="p.name"
        :description="p.description"
        :status="(p as any).status || 'TO_DO'"
        :end_date="(p as any).end_date || ''"
        @cardClick="handleProjectClick"
        @delete="handleDeleteProject"
      />
    </section>

    <!-- Create Project Modal -->
    <CreateProjectModal
      :is-open="isCreateModalOpen"
      :create-project="handleCreateProjectSubmit"
      @close="isCreateModalOpen = false"
    />

    <!-- Nested route renders here: empty on /projets, detail sheet on /projets/:id -->
    <NuxtPage />
  </div>
</template>