<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { $api } = useNuxtApp()
const route = useRoute()
const orgId = route.params.org_id
const isLoading = ref(true)
const isCreateWorkspaceModalOpen = useState('isCreateWorkspaceModalOpen', () => false)

const fetchWorkspaces = async () => {
  try {
    const res = await $api<any>(`/workspaces?organization_id=${orgId}`)
    const workspaces = res.data?.data || res.data || []
    
    if (workspaces.length > 0) {
      navigateTo(`/organization/${orgId}/workspace/${workspaces[0].id}`)
    } else {
      isLoading.value = false
    }
  } catch (err) {
    console.error(err)
    isLoading.value = false
  }
}

onMounted(() => {
  fetchWorkspaces()
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh]">
    <div v-if="isLoading" class="flex flex-col items-center">
      <Icon name="eos-icons:loading" class="w-10 h-10 text-primary animate-spin mb-4" />
      <p class="text-secondary dark:text-gray-400">Chargement de votre espace de travail...</p>
    </div>
    
    <div v-else class="text-center p-8 max-w-md">
      <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
        <Icon name="heroicons:briefcase" class="w-8 h-8" />
      </div>
      <h2 class="text-2xl font-bold text-main dark:text-white mb-4">Aucun espace de travail</h2>
      <p class="text-secondary dark:text-gray-400 mb-8">
        Cette organisation ne possède aucun espace de travail. Vous pouvez en créer un directement ci-dessous.
      </p>

      <button 
        @click="isCreateWorkspaceModalOpen = true" 
        class="inline-flex items-center justify-center gap-2 px-6 py-3 btn-primary hover:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
      >
        <Icon name="heroicons:plus" class="w-5 h-5" />
        Créer un espace de travail
      </button>
    </div>
  </div>
</template>
