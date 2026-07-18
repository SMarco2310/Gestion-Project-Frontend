<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { activeOrganization } = useOrganizations()
const { workspaces, getWorkspaces, activeWorkspace } = useWorkspaces()
const route = useRoute()
const orgId = route.params.org_id as string
const isCreateWorkspaceModalOpen = useState('isCreateWorkspaceModalOpen', () => false)
const isLoading = ref(true)

onMounted(async () => {
  try {
    await getWorkspaces(orgId)
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
})

const getIconColor = (name: string) => {
  if (!name) return '#0891b2';
  const colors = ['#0891b2', '#8B5CF6', '#F97316', '#3B82F6', '#10B981', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
</script>

<template>
  <div>
    <!-- Header -->
    <section class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-10">
      <div>
        <p class="text-[10px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mb-2">Gestion</p>
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Workspaces</h1>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-2 max-w-xl">
          Basculez entre vos espaces de travail, gérez leurs membres et leurs organisations.
        </p>
      </div>
      <button @click="isCreateWorkspaceModalOpen = true" class="px-5 py-2.5 bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-600 hover:brightness-90 transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0">
        <Icon name="heroicons:plus" class="w-5 h-5" />
        Nouveau workspace
      </button>
    </section>

    <!-- Grid -->
    <div v-if="isLoading" class="flex justify-center p-12">
      <Icon name="eos-icons:loading" class="w-10 h-10 text-primary animate-spin" />
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <!-- Workspace Cards -->
      <div v-for="ws in workspaces" :key="ws.id" class="bg-card dark:bg-[#1A1A1D] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col hover:border-cyan-600/30 transition-colors group min-h-[250px] shadow-sm">
        
        <div class="flex justify-between items-start mb-4">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-sm" :style="{ backgroundColor: ws.color || getIconColor(ws.name) }">
            {{ ws.name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <h2 class="text-xl font-bold text-main dark:text-white mb-2 truncate">{{ ws.name }}</h2>

        <div class="flex items-center gap-8 mb-8 mt-auto">
          <div>
            <div class="text-xl font-bold text-main dark:text-white">{{ ws.users_count || 0 }}</div>
            <div class="text-[9px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mt-1">Membres</div>
          </div>
          <div>
            <div class="text-xl font-bold text-main dark:text-white">{{ ws.projets_count || 0 }}</div>
            <div class="text-[9px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mt-1">Projets</div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink :to="`/organization/${orgId}/workspace/${ws.id}`" class="flex-1 py-2.5 rounded-xl font-bold text-sm text-center transition-colors shadow-sm" :class="activeWorkspace?.id === ws.id ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed' : 'bg-cyan-600 text-white hover:brightness-110'">
            {{ activeWorkspace?.id === ws.id ? 'Workspace actif' : 'Basculer' }}
          </NuxtLink>
          <NuxtLink :to="`/organization/${orgId}/workspace/${ws.id}/settings`" class="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold text-sm transition-colors shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
            Gérer
          </NuxtLink>
        </div>

      </div>

      <!-- Add New Workspace Card -->
      <button @click="isCreateWorkspaceModalOpen = true" class="bg-transparent dark:bg-transparent rounded-2xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center min-h-[250px] hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-cyan-600 transition-colors group shadow-sm">
        <div class="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
          <Icon name="heroicons:plus" class="w-6 h-6" />
        </div>
        <span class="font-bold text-main dark:text-white">Créer un workspace</span>
      </button>

    </div>
  </div>
</template>
