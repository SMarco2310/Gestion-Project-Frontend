<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false, // We use a clean layout without sidebar for org selection
})

const { $api } = useNuxtApp()
const { user, logout } = useAuth()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string

const organizations = ref<any[]>([])
const invitations = ref<any[]>([])
const isProfileOpen = ref(false)

const handleLogout = async () => {
    await logout()
    navigateTo('/auth/login')
}

const fetchOrgsAndInvites = async () => {
  try {
    const orgsData = await $api<any>('/organizations')
    organizations.value = orgsData.data?.data || orgsData.data || []
  } catch (err) {
    console.error(err)
  }
}

const route = useRoute()

onMounted(() => {
  fetchOrgsAndInvites()
  if (route.query.create === 'true') {
    openCreateModal()
  }
})

const selectOrganization = (org: any) => {
  const { setActiveOrganization } = useOrganizations()
  setActiveOrganization(org)
  navigateTo(`/organization/${org.id}`);
}

const acceptInvitation = (inviteId: number, orgId: number) => {
  // In a real app, call $api(`/invitations/${inviteId}/accept`, { method: 'POST' })
  navigateTo(`/organization/${orgId}`);
}

const { createOrganization: apiCreateOrganization, setActiveOrganization, activeOrganization } = useOrganizations()
const isCreateModalOpen = ref(false)

const getIconColor = (name: string) => {
  if (!name) return '#0891b2';
  const colors = ['#0891b2', '#8B5CF6', '#F97316', '#3B82F6', '#10B981', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
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
    const newOrg = await apiCreateOrganization({ name: newOrgForm.value.name, description: newOrgForm.value.description })
    setActiveOrganization(newOrg)
    navigateTo(`/organization/${newOrg.id}`)
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
       <img src="/assets/logo_app.svg" alt="Logo" class="w-10 h-10 object-contain drop-shadow-md" />
       <span class="text-main dark:text-white font-bold text-xl tracking-wide">Gestion Pro</span>
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
              <NuxtLink to="/profile?source=org" @click="isProfileOpen = false" class="block px-4 py-3 text-sm font-medium text-secondary dark:text-gray-300 hover:bg-canvas dark:hover:bg-gray-800 hover:text-main dark:hover:text-white transition-colors">
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
            class="flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 hover:border-primary transition-all relative group shadow-sm">
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
            
            <button @click="acceptInvitation(invite.id, invite.organization.id)" class="w-full bg-cyan-600 hover:bg-cyan-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              <span>Rejoindre l'équipe</span>
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Active Organizations Grid -->
      <div class="w-full mb-10">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl sm:text-3xl font-bold text-main dark:text-white">Vos Organisations</h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Render Active Organizations -->
          <div 
            v-for="org in organizations" 
            :key="org.id"
            class="bg-card dark:bg-[#1A1A1D] rounded-[32px] p-6 border border-form-border dark:border-gray-800 flex flex-col hover:border-primary/30 transition-colors group min-h-[280px]"
          >
            
            <div class="flex justify-between items-start mb-4">
              <div v-if="org.logo" class="w-14 h-14 rounded-2xl overflow-hidden shadow-sm">
                <img :src="org.logo.startsWith('http') ? org.logo : 'http://localhost:8000' + org.logo" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-sm" :style="{ backgroundColor: getIconColor(org.name) }">
                {{ org.name?.charAt(0).toUpperCase() || 'O' }}
              </div>
            </div>
            
            <h2 class="text-xl font-bold text-main dark:text-white mb-2 truncate" :title="org.name">{{ org.name }}</h2>

            <div class="flex items-center gap-8 mb-8 mt-auto">
              <div>
                <div class="text-xl font-bold text-main dark:text-white">{{ org.users_count || 0 }}</div>
                <div class="text-[9px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mt-1">Membres</div>
              </div>
              <div>
                <div class="text-xl font-bold text-main dark:text-white">{{ org.workspaces_count || 0 }}</div>
                <div class="text-[9px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mt-1">Workspaces</div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button @click="selectOrganization(org)" class="flex-1 py-2.5 rounded-xl font-bold text-sm text-center transition-colors shadow-sm" :class="activeOrganization?.id === org.id ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed' : 'bg-[#0891b2] text-white hover:bg-[#26b0ac]'">
                {{ activeOrganization?.id === org.id ? 'Organisation active' : 'Basculer' }}
              </button>
              <NuxtLink :to="`/organization/${org.id}/settings`" class="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold text-sm transition-colors text-center">
                Gérer
              </NuxtLink>
            </div>
          </div>

          <!-- Add New Organization Card (Mobile: fallback, Desktop: inline) -->
          <button @click="openCreateModal" class="bg-transparent dark:bg-transparent rounded-[32px] p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center min-h-[280px] hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-[#0891b2] transition-colors group">
            <div class="w-14 h-14 rounded-2xl bg-cyan-50 text-primary dark:bg-cyan-900/30 dark:text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="heroicons:plus" class="w-6 h-6" />
            </div>
            <span class="font-bold text-main dark:text-white">Créer une organisation</span>
          </button>

        </div>
      </div>

    </div>

    <!-- Create Organization Modal -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" @click.self="isCreateModalOpen = false">
      <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] w-full max-w-md max-h-full rounded-xl flex flex-col overflow-hidden shadow-2xl" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="px-6 py-4 flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] z-10 relative shrink-0">
          <div class="flex items-center gap-2 text-main dark:text-white">
            <Icon name="heroicons:building-office-2" class="w-6 h-6 text-primary dark:text-primary" />
            <h2 class="text-xl font-bold">Nouvelle organisation</h2>
          </div>
          <button @click="isCreateModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div class="flex flex-col gap-5">
            <div v-if="createError" class="p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/30">
              {{ createError }}
            </div>
            
            <div>
              <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Nom de l'organisation <span class="text-red-500">*</span></label>
              <input 
                v-model="newOrgForm.name" 
                type="text" 
                placeholder="Ex: Acme Corp"
                class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white placeholder-secondary dark:placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary transition-all"
              />
            </div>
            
            <div>
              <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Description (optionnel)</label>
              <RichTextEditor 
                v-model="newOrgForm.description" 
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] flex justify-end gap-3 bg-gray-50 dark:bg-[#222224] z-10 relative shrink-0">
          <button 
            @click="isCreateModalOpen = false" 
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-lg text-sm font-bold text-secondary dark:text-gray-300 hover:text-main dark:hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button 
            @click="handleCreateOrganization" 
            :disabled="isSubmitting || !newOrgForm.name.trim()"
            class="px-5 py-2 rounded-lg text-sm font-bold text-white bg-cyan-600 hover:brightness-110 neo-emboss active:neo-inset transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            <Icon v-else name="heroicons:plus" class="w-4 h-4" />
            Créer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
