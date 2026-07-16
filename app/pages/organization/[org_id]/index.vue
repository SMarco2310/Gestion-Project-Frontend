<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false, // We use a clean layout without sidebar for workspace selection
})

const { $api } = useNuxtApp()
const { user, logout } = useAuth()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const route = useRoute()
const orgId = route.params.org_id

const workspaces = ref<any[]>([])
const isProfileOpen = ref(false)
const { activeOrganization, getOrganization } = useOrganizations()

const handleLogout = async () => {
    await logout()
    navigateTo('/auth/login')
}

const fetchWorkspaces = async () => {
  try {
    const res = await $api<any>(`/workspaces?organization_id=${orgId}`)
    workspaces.value = res.data?.data || res.data || []
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  if (!activeOrganization.value || String(activeOrganization.value.id) !== String(orgId)) {
     const org = await getOrganization(orgId as string)
     if(org) {
         useOrganizations().setActiveOrganization(org)
     }
  }
  fetchWorkspaces()
})

const selectWorkspace = (workspace: any) => {
  navigateTo(`/organization/${orgId}/workspace/${workspace.id}`);
}

const isCreateModalOpen = ref(false)
const isSubmitting = ref(false)
const newWorkspaceForm = ref({ name: '', description: '' })
const createError = ref('')

const openCreateModal = () => {
  newWorkspaceForm.value = { name: '', description: '' }
  createError.value = ''
  isCreateModalOpen.value = true
}

const handleCreateWorkspace = async () => {
  if (!newWorkspaceForm.value.name.trim()) return

  isSubmitting.value = true
  createError.value = ''
  
  try {
    const res = await $api<any>('/workspaces', {
        method: 'POST',
        body: {
            name: newWorkspaceForm.value.name,
            description: newWorkspaceForm.value.description,
            organization_id: orgId
        }
    })
    const newWorkspace = res.workspace || res.data?.workspace || res.data
    navigateTo(`/organization/${orgId}/workspace/${newWorkspace.id}`)
  } catch (err: any) {
    createError.value = err.data?.message || 'Erreur lors de la création'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative min-h-[100dvh] flex items-center justify-center bg-canvas dark:bg-[#151515] p-4 sm:p-8">
    
    <!-- Top Left Branding -->
    <div class="absolute top-8 left-8 z-20 flex items-center gap-3">
        <NuxtLink to="/organizations" class="text-secondary hover:text-primary transition-colors flex items-center gap-2">
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            Retour aux organisations
        </NuxtLink>
    </div>

    <!-- Top Right Actions -->
    <div class="absolute top-8 right-8 z-20">
      <div class="relative">
          <div @click="isProfileOpen = !isProfileOpen" class="w-10 h-10 rounded-full ring-2 ring-form-border dark:ring-gray-700 hover:ring-primary dark:hover:ring-primary overflow-hidden cursor-pointer transition-all bg-canvas dark:bg-[#151515]">
              <img :src="user?.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : apiBase.replace('/api', '') + user.profile_picture) : `https://api.dicebear.com/7.x/initials/svg?seed=${(user?.last_name || '').charAt(0).toUpperCase() + (user?.first_name || '').charAt(0).toUpperCase() || 'U'}&chars=2`" alt="Avatar" class="w-full h-full object-cover">
          </div>
          <!-- Overlay for closing -->
          <div v-if="isProfileOpen" @click="isProfileOpen = false" class="fixed inset-0 z-40"></div>
          <!-- Dropdown Menu -->
          <div v-if="isProfileOpen" class="absolute right-0 mt-2 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden">
              <NuxtLink to="/profile?source=workspace" @click="isProfileOpen = false" class="block px-4 py-3 text-sm font-medium text-secondary dark:text-gray-300 hover:bg-canvas dark:hover:bg-gray-800 hover:text-main dark:hover:text-white transition-colors">
                  Profil
              </NuxtLink>
              <button @click="() => { isProfileOpen = false; handleLogout() }" class="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  Déconnexion
              </button>
          </div>
      </div>
    </div>

    <div class="w-full max-w-4xl flex flex-col items-center pt-20">
      
      <!-- Header text -->
      <div class="text-center mb-12">
        <h1 class="text-4xl sm:text-5xl font-bold tracking-wider text-main dark:text-white mb-4">
            {{ activeOrganization?.name || 'Organisation' }}
        </h1>
        <p class="text-secondary dark:text-gray-400 text-lg max-w-md mx-auto">
          Sélectionnez un espace de travail (Workspace) pour continuer.
        </p>
      </div>

      <!-- Active Workspaces Grid -->
      <div class="w-full mb-10">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Add New Workspace Card -->
          <div @click="openCreateModal" class="flex flex-col items-center justify-center bg-white dark:bg-[#1D1D1D] rounded-2xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-[#252525] transition-all cursor-pointer group min-h-[200px]">
            <div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="heroicons:plus" class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-primary" />
            </div>
            <span class="font-semibold text-main dark:text-white text-center">Créer un espace de travail</span>
          </div>

          <!-- Render Active Workspaces -->
          <div 
            v-for="workspace in workspaces" 
            :key="workspace.id"
            @click="selectWorkspace(workspace)"
            class="flex flex-col bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 border border-form-border dark:border-gray-800 hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all cursor-pointer min-h-[200px] relative overflow-hidden group"
          >
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div class="flex justify-between items-start mb-4">
              <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold text-xl uppercase shadow-sm overflow-hidden">
                <span>{{ workspace.name?.substring(0, 2) || 'WS' }}</span>
              </div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 group-hover:bg-primary group-hover:text-white text-gray-400 transition-colors">
                 <Icon name="heroicons:arrow-right" class="w-4 h-4" />
              </div>
            </div>
            
            <h2 class="text-xl font-bold text-main dark:text-white mb-2">{{ workspace.name }}</h2>
            <div v-if="workspace.description" class="text-sm text-secondary dark:text-gray-400 line-clamp-2 mt-auto prose dark:prose-invert max-w-none" v-html="workspace.description"></div>
          </div>

        </div>
      </div>

    </div>

    <!-- Create Workspace Modal -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden transform transition-all animate-fade-in-up">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">Nouvel Espace de Travail</h3>
          <button @click="isCreateModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        
        <div class="p-6 space-y-5">
          <div v-if="createError" class="p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
            {{ createError }}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'espace</label>
            <input 
              v-model="newWorkspaceForm.name" 
              type="text" 
              placeholder="Ex: Marketing, Développement..."
              class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description (optionnel)</label>
            <textarea
              v-model="newWorkspaceForm.description" 
              rows="3"
              class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            ></textarea>
          </div>
        </div>

        <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-black/10">
          <button 
            @click="isCreateModalOpen = false" 
            :disabled="isSubmitting"
            class="px-5 py-2.5 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button 
            @click="handleCreateWorkspace" 
            :disabled="isSubmitting || !newWorkspaceForm.name.trim()"
            class="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
            Créer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
