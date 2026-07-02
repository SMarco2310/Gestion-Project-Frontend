<script setup lang="ts">
definePageMeta({
  layout: 'custom'
})

// MOCK DATA
const teams = ref([
  { id: 1, name: 'Développement', description: 'Équipe en charge du développement technique.', members_count: 5 },
  { id: 2, name: 'Design', description: 'Création des interfaces et de l\'expérience utilisateur.', members_count: 3 },
])

const isCreateModalOpen = ref(false)
const newTeamName = ref('')
const newTeamDesc = ref('')

const handleCreateTeam = () => {
  // Mock logic
  isCreateModalOpen.value = false
  newTeamName.value = ''
  newTeamDesc.value = ''
}
</script>

<template>
  <div>
    <!-- Header Section -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Équipes</h1>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1">Gérez les équipes au sein de votre organisation.</p>
      </div>
      <div>
        <button @click="isCreateModalOpen = true" class="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30">
          <Icon name="heroicons:plus" class="w-5 h-5" />
          Nouvelle Équipe
        </button>
      </div>
    </section>

    <!-- Teams Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      
      <div v-for="team in teams" :key="team.id" @click="navigateTo('/team/' + team.id)" class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 border border-form-border dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg transition-all group flex flex-col h-full cursor-pointer">
        <div class="flex justify-between items-start mb-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 flex items-center justify-center">
            <Icon name="heroicons:user-group" class="w-6 h-6" />
          </div>
          <button class="text-gray-400 hover:text-main dark:hover:text-white p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
            <Icon name="heroicons:ellipsis-vertical" class="w-5 h-5" />
          </button>
        </div>
        
        <h2 class="text-xl font-bold text-main dark:text-white mb-2">{{ team.name }}</h2>
        <p class="text-sm text-secondary dark:text-gray-400 mb-6 flex-grow line-clamp-3">
          {{ team.description || 'Aucune description fournie.' }}
        </p>
        
        <div class="flex items-center justify-between pt-4 border-t border-form-border dark:border-gray-800">
          <div class="flex -space-x-2">
            <!-- Mock member avatars -->
            <div v-for="i in Math.min(team.members_count, 3)" :key="i" class="w-8 h-8 rounded-full border-2 border-white dark:border-[#1D1D1D] bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
              {{ String.fromCharCode(64 + i) }}
            </div>
            <div v-if="team.members_count > 3" class="w-8 h-8 rounded-full border-2 border-white dark:border-[#1D1D1D] bg-canvas dark:bg-[#151515] flex items-center justify-center text-[10px] font-bold text-secondary dark:text-gray-400">
              +{{ team.members_count - 3 }}
            </div>
          </div>
          <span class="text-xs font-medium text-secondary dark:text-gray-500">{{ team.members_count }} membres</span>
        </div>
      </div>

    </div>

    <!-- Empty State -->
    <div v-if="teams.length === 0" class="flex flex-col items-center justify-center py-20 px-4">
      <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
        <Icon name="heroicons:user-group" class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold text-main dark:text-white mb-2">Aucune équipe</h3>
      <p class="text-secondary dark:text-gray-400 text-center max-w-sm mb-6">Vous n'avez pas encore créé d'équipe. Créez-en une pour organiser vos membres.</p>
      <button @click="isCreateModalOpen = true" class="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
        Créer une équipe
      </button>
    </div>

    <!-- Create Modal (Static) -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">Créer une équipe</h3>
          <button @click="isCreateModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'équipe</label>
            <input v-model="newTeamName" type="text" placeholder="Ex: Développeurs Backend" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description</label>
            <textarea v-model="newTeamDesc" rows="3" placeholder="Description de l'équipe..." class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"></textarea>
          </div>
        </div>
        <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3">
          <button @click="isCreateModalOpen = false" class="px-4 py-2 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            Annuler
          </button>
          <button @click="handleCreateTeam" class="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors">
            Créer
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
