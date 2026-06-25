<script setup lang="ts">

definePageMeta({
    layout: "custom"
})


const projects = ref([
    {
        id: 1,
        reference_code: 'PRJ-0001',
        name: 'Project 1',
        description: 'Project 1 description',
        status: 'TO_DO',
        end_date: '2022-12-31'
    },
    {
        id: 2,
        reference_code: 'PRJ-0002',
        name: 'Project 2',
        description: 'Project 2 description',
        status: 'EN_COURS',
        end_date: '2022-12-31'
    },
    
])

const isProjectSheetOpen = ref(false)
const selectedProjectId = ref<number | null>(null)

const isCreateModalOpen = ref(false)

const handleProjectClick = (projectId: number) => {
  selectedProjectId.value = projectId
  isProjectSheetOpen.value = true
}

const handleCloseProjectSheet = () => {
  isProjectSheetOpen.value = false
  selectedProjectId.value = null
}

const handleCreateProjectSubmit = (data: any) => {
  // Mock add to list
  projects.value.push({
    id: Date.now(),
    reference_code: data.reference_code || 'PRJ-NEW',
    name: data.title,
    description: data.description,
    status: data.status,
    end_date: data.end_date || 'N/A'
  })
}




</script>

<template>
    <header>
        <div class="pb-5"> 
            <h1 class="text-4xl font-bold text-main dark:text-gray-300">Projets Overview</h1>
            <p class="text-secondary dark:text-gray-400 pt-3">Gérer et suivre l'avancement de tous vos projets.</p>
        </div>
        <div class="flex justify-between items-center pb-5 gap-2 md:gap-4">
            
            <div id="search-bar" class="flex-1 md:flex-none">
                <div class="relative flex items-center w-full">
                    <Icon name="heroicons:magnifying-glass" class="w-5 h-5 text-secondary dark:text-gray-400 absolute left-3 pointer-events-none" />
                    <input type="text" placeholder="Rechercher" class="bg-card dark:bg-gray-600 text-main dark:text-gray-300 border border-form-border dark:border-transparent placeholder-form-placeholder w-full px-4 py-2 rounded-md pl-10 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 md:w-64">
                </div>
            </div>
            
            <div class="flex items-center gap-2 md:gap-4 shrink-0">
                <FilterDropdown :showProjects="false" :showStatus="true" :showPriority="false"/>
                <button @click="isCreateModalOpen = true" class="bg-primary dark:bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer flex items-center justify-center px-3 md:px-4 py-2 rounded-md whitespace-nowrap shadow-md">
                    <Icon name="heroicons:plus" class="w-5 h-5" /> 
                    <span class="px-2 font-medium hidden md:inline">Ajouter un projet</span>
                </button>
            </div>

        </div>
    </header>
    <section id="projects-section" class="pt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" >
        <ProjetCard 
            v-for="(p, index) in projects" :key="index" 
            :id="p.id"
            :reference_code="p.reference_code"
            :name="p.name"
            :description="p.description"
            :status="p.status"
            :end_date="p.end_date"
            @cardClick="handleProjectClick"
        />    
    </section>

    <!-- Project Side Sheet -->
    <ProjectSideSheet 
      :isOpen="isProjectSheetOpen" 
      :project-id="selectedProjectId" 
      @close="handleCloseProjectSheet" 
    />

    <!-- Create Project Modal -->
    <CreateProjectModal 
      :is-open="isCreateModalOpen" 
      @close="isCreateModalOpen = false" 
      @submit="handleCreateProjectSubmit"
    />
</template>