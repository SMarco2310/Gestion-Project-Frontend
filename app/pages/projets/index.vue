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



</script>

<template>
    <header>
        <div class="pb-5"> 
            <h1 class="text-4xl font-bold text-gray-300">Projets Overview</h1>
            <p class="text-gray-400 pt-3">Gérer et suivre l'avancement de tous vos projets.</p>
        </div>
        <div class="flex justify-between items-center pb-5 gap-2 md:gap-4">
            
            <div id="search-bar" class="flex-1 md:flex-none">
                <div class="relative flex items-center w-full">
                    <Icon name="heroicons:magnifying-glass" class="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
                    <input type="text" placeholder="Rechercher" class="bg-gray-600 text-gray-300 w-full px-4 py-2 rounded-md pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-64">
                </div>
            </div>
            
            <div class="flex items-center gap-2 md:gap-4 shrink-0">
                <button class="bg-gray-600 text-gray-300 hover:bg-gray-500 transition-colors cursor-pointer flex items-center justify-center px-3 md:px-4 py-2 rounded-md whitespace-nowrap">
                    <Icon name="heroicons:adjustments-horizontal" class="w-5 h-5" /> 
                    <span class="px-2 hidden md:inline">Filtrer</span>
                </button>
                <button class="bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer flex items-center justify-center px-3 md:px-4 py-2 rounded-md whitespace-nowrap shadow-md">
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
        />    
    </section>
</template>