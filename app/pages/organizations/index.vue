<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false, // We use a clean layout without sidebar for org selection
  pageTransition: {
    name: 'fade',
    mode: 'out-in'
  }
})

const { $api } = useNuxtApp()

const organizations = ref<any[]>([])
const invitations = ref<any[]>([])

const fetchOrgsAndInvites = async () => {
  try {
    const orgsData = await $api<any>('/api/organizations')
    organizations.value = orgsData.data?.data || orgsData.data || []
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  fetchOrgsAndInvites()
})

const selectOrganization = (org: any) => {
  const { setActiveOrganization } = useOrganizations()
  setActiveOrganization(org)
  navigateTo('/dashboard');
}

const acceptInvitation = (inviteId: number, orgId: number) => {
  // In a real app, call $api(`/api/invitations/${inviteId}/accept`, { method: 'POST' })
  navigateTo('/dashboard');
}

const { createOrganization: apiCreateOrganization, setActiveOrganization } = useOrganizations()
const isCreateModalOpen = ref(false)
const isSubmitting = ref(false)
const newOrgForm = ref({ name: '', description: '' })
const createError = ref('')

const openCreateModal = () => {
  newOrgForm.value = { name: '', description: '' }
  createError.value = ''
  isCreateModalOpen.value = true
}

const handleCreateOrganization = async () => {
  if (!newOrgForm.value.name.trim()) return

  isSubmitting.value = true
  createError.value = ''
  
  try {
    const newOrg = await apiCreateOrganization(newOrgForm.value.name, newOrgForm.value.description)
    setActiveOrganization(newOrg)
    navigateTo('/dashboard')
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
       <img src="/assets/logo_app.png" alt="Logo" class="w-10 h-10 object-contain drop-shadow-md" />
       <span class="text-main dark:text-white font-bold text-xl tracking-wide">Gestion de Projets</span>
    </div>

    <!-- Top Right Actions -->
    <div class="absolute top-8 right-8 z-20">
       <NuxtLink to="/profile" class="text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white font-medium transition-colors">
         Profil
       </NuxtLink>
    </div>

    <div class="w-full max-w-4xl flex flex-col items-center pt-20">
      
      <!-- Header text -->
      <div class="text-center mb-12">
        <h1 class="text-4xl sm:text-5xl font-bold tracking-wider text-main dark:text-white mb-4">Bienvenue</h1>
        <p class="text-secondary dark:text-gray-400 text-lg max-w-md mx-auto">
          Sélectionnez ou rejoignez une organisation pour commencer.
        </p>
      </div>

      <!-- Invitations Section -->
      <div v-if="invitations.length > 0" class="w-full mb-12">
        <h2 class="text-2xl font-bold text-main dark:text-white mb-6 flex items-center gap-2">
          <Icon name="heroicons:envelope-open" class="w-6 h-6 text-primary" />
          Invitations en attente
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="invite in invitations" 
            :key="invite.id"
            class="flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 hover:border-primary transition-all relative group shadow-sm"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl uppercase shadow-md overflow-hidden">
                <img v-if="invite.organization?.logo" :src="invite.organization.logo.startsWith('http') ? invite.organization.logo : 'http://localhost:8000' + invite.organization.logo" class="w-full h-full object-cover" />
                <span v-else>{{ invite.organization?.name?.substring(0, 2) || 'OR' }}</span>
              </div>
              <div>
                <h3 class="text-lg font-bold text-main dark:text-white">{{ invite.organization.name }}</h3>
                <span class="text-xs font-semibold text-primary dark:text-blue-400 uppercase tracking-wider">Rôle: {{ invite.role }}</span>
              </div>
            </div>
            <p class="text-sm text-secondary dark:text-gray-400 mb-6 flex-1">Vous avez été invité à rejoindre cette organisation.</p>
            
            <button @click="acceptInvitation(invite.id, invite.organization.id)" class="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              <span>Rejoindre l'équipe</span>
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Active Organizations Grid -->
      <div class="w-full mb-10">
        <h2 class="text-2xl font-bold text-main dark:text-white mb-6">Vos Organisations</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Add New Organization Card -->
          <div @click="openCreateModal" class="flex flex-col items-center justify-center bg-white dark:bg-[#1D1D1D] rounded-2xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-[#252525] transition-all cursor-pointer group min-h-[200px]">
            <div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="heroicons:plus" class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-primary" />
            </div>
            <span class="font-semibold text-main dark:text-white">Créer une organisation</span>
          </div>

          <!-- Render Active Organizations -->
          <div 
            v-for="org in organizations" 
            :key="org.id"
            @click="selectOrganization(org)"
            class="flex flex-col bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 border border-form-border dark:border-gray-800 hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all cursor-pointer min-h-[200px] relative overflow-hidden group"
          >
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div class="flex justify-between items-start mb-4">
              <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold text-xl uppercase shadow-sm overflow-hidden">
                <img v-if="org.logo" :src="org.logo.startsWith('http') ? org.logo : 'http://localhost:8000' + org.logo" class="w-full h-full object-cover" />
                <span v-else>{{ org.name?.substring(0, 2) || 'OR' }}</span>
              </div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 group-hover:bg-primary group-hover:text-white text-gray-400 transition-colors">
                 <Icon name="heroicons:arrow-right" class="w-4 h-4" />
              </div>
            </div>
            
            <h2 class="text-xl font-bold text-main dark:text-white mb-2">{{ org.name }}</h2>
            <p v-if="org.description" class="text-sm text-secondary dark:text-gray-400 line-clamp-2 mt-auto">{{ org.description }}</p>
          </div>

        </div>
      </div>

    </div>

    <!-- Create Organization Modal -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden transform transition-all animate-fade-in-up">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">Nouvelle organisation</h3>
          <button @click="isCreateModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        
        <div class="p-6 space-y-5">
          <div v-if="createError" class="p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
            {{ createError }}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'organisation</label>
            <input 
              v-model="newOrgForm.name" 
              type="text" 
              placeholder="Ex: Acme Corp"
              class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description (optionnel)</label>
            <textarea 
              v-model="newOrgForm.description" 
              rows="3" 
              placeholder="Décrivez brièvement votre organisation..."
              class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none"
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
            @click="handleCreateOrganization" 
            :disabled="isSubmitting || !newOrgForm.name.trim()"
            class="px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
            Créer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
