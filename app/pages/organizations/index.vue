<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from '~/composables/useToast'

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

const colorMode = useColorMode()
const toggleDarkMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const userInitials = computed(() => {
  const first = (user.value?.first_name || '').charAt(0).toUpperCase()
  const last = (user.value?.last_name || '').charAt(0).toUpperCase()
  return (last + first) || 'U'
})

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

const { startPhase1Tour, isTourCompleted } = useTour()

onMounted(() => {
  fetchOrgsAndInvites()
  if (route.query.create === 'true') {
    openCreateModal()
  } else if (!isTourCompleted.value) {
    // Delay slightly so the DOM is fully painted before Driver.js starts
    setTimeout(() => startPhase1Tour(), 700)
  }
})

const selectedOrgId = ref<number | string | null>(null)

const selectOrganization = (org: any) => {
  if (selectedOrgId.value !== null) return
  selectedOrgId.value = org.id
  const { setActiveOrganization } = useOrganizations()
  setActiveOrganization(org)
  setTimeout(() => {
    navigateTo(`/organization/${org.id}`);
  }, 400)
}

const acceptInvitation = (inviteId: number, orgId: number) => {
  // In a real app, call $api(`/invitations/${inviteId}/accept`, { method: 'POST' })
  navigateTo(`/organization/${orgId}`);
}

const { createOrganization: apiCreateOrganization, setActiveOrganization, activeOrganization, uploadLogo: apiUploadLogo } = useOrganizations()
const isCreateModalOpen = ref(false)

const getIconColor = (name: string) => {
  if (!name) return '#0B0E11';
  const colors = ['#0B0E11', '#8B5CF6', '#F97316', '#3B82F6', '#10B981', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
const isSubmitting = ref(false)
const newOrgForm = ref<{
  name: string
  description: string
  logoFile: File | null
  logoPreview: string | null
  primaryColor: string
  extractedColors: string[]
  isAnalyzingLogo: boolean
}>({
  name: '',
  description: '',
  logoFile: null,
  logoPreview: null,
  primaryColor: '#0B0E11',
  extractedColors: [],
  isAnalyzingLogo: false
})
const createError = ref('')
const modalFileInput = ref<HTMLInputElement | null>(null)

const triggerModalFileInput = () => {
  modalFileInput.value?.click()
}

const handleModalLogoChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (!file) return
    newOrgForm.value.logoFile = file
    newOrgForm.value.logoPreview = URL.createObjectURL(file)
    newOrgForm.value.isAnalyzingLogo = true

    try {
      const palette = await getPaletteFromImage(file, 6)
      newOrgForm.value.extractedColors = palette
      if (palette.length > 0 && palette[0]) {
        newOrgForm.value.primaryColor = palette[0]
      }
    } catch (err) {
      console.error('Error extracting color palette:', err)
    } finally {
      newOrgForm.value.isAnalyzingLogo = false
    }
  }
}

const selectPrimaryColor = (color: string) => {
  newOrgForm.value.primaryColor = color
}

const openCreateModal = () => {
  newOrgForm.value = {
    name: '',
    description: '',
    logoFile: null,
    logoPreview: null,
    primaryColor: '#0B0E11',
    extractedColors: [],
    isAnalyzingLogo: false
  }
  createError.value = ''
  isCreateModalOpen.value = true
}

const handleCreateOrganization = async () => {
  if (isSubmitting.value) return
  if (!newOrgForm.value.name.trim()) return

  isSubmitting.value = true
  createError.value = ''
  
  try {
    let newOrg = await apiCreateOrganization({
      name: newOrgForm.value.name,
      description: newOrgForm.value.description,
      primary_color: newOrgForm.value.primaryColor
    })

    if (newOrgForm.value.logoFile && newOrg?.id) {
      try {
        newOrg = await apiUploadLogo(newOrg.id, newOrgForm.value.logoFile)
      } catch (uploadErr) {
        console.error('Failed to upload logo during creation', uploadErr)
      }
    }

    const { addToast } = useToast()
    addToast({ title: 'Succès', message: 'L\'organisation a été créée avec succès.', type: 'success' })

    setActiveOrganization(newOrg)
    isCreateModalOpen.value = false
    navigateTo(`/organization/${newOrg.id}`)
  } catch (err: any) {
    createError.value = err.data?.message || 'Erreur lors de la création'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="relative min-h-[100dvh] flex items-center justify-center bg-canvas dark:bg-[#151515] p-4 sm:p-8 animate-fade-in">
    
    <!-- Top Left Branding -->
    <div class="absolute top-8 left-8 z-20 flex items-center gap-3">
       <img src="/assets/logo_app.svg" alt="Logo" class="w-10 h-10 object-contain drop-shadow-md" />
       <span class="text-main dark:text-white font-bold text-xl tracking-wide">Gestion Pro</span>
    </div>

    <!-- Top Right Actions -->
    <div class="absolute top-8 right-8 z-20">
      <div class="relative">
          <div @click="isProfileOpen = !isProfileOpen" class="w-11 h-11 rounded-full ring-2 ring-gray-200/80 dark:ring-gray-700 hover:ring-primary dark:hover:ring-primary overflow-hidden cursor-pointer transition-all bg-[#FACC15] text-white font-bold flex items-center justify-center text-sm shadow-sm select-none">
              <img v-if="user?.profile_picture" :src="user.profile_picture.startsWith('http') ? user.profile_picture : apiBase.replace('/api', '') + user.profile_picture" alt="Avatar" class="w-full h-full object-cover">
              <span v-else class="drop-shadow-sm">{{ userInitials }}</span>
          </div>
          <!-- Overlay for closing -->
          <div v-if="isProfileOpen" @click="isProfileOpen = false" class="fixed inset-0 z-40"></div>
          <!-- Dropdown Menu -->
          <div v-if="isProfileOpen" class="absolute right-0 mt-2 w-72 bg-[#ffffff] dark:bg-[#1D1D1D] rounded-[24px] shadow-xl border border-gray-200 dark:border-gray-800 z-50 flex flex-col overflow-hidden animate-fade-in-up" style="animation-duration: 0.2s;">
              
              <!-- Top Profile Section -->
              <div class="flex items-center gap-4 p-5 pb-4">
                  <div class="w-14 h-14 rounded-full ring-2 ring-primary/50 overflow-hidden shrink-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-primary font-bold text-xl shadow-sm">
                      <img v-if="user?.profile_picture" :src="user.profile_picture.startsWith('http') ? user.profile_picture : apiBase.replace('/api', '') + user.profile_picture" alt="Avatar" class="w-full h-full object-cover">
                      <span v-else>{{ userInitials }}</span>
                  </div>
                  <div class="flex flex-col overflow-hidden">
                      <span class="font-bold text-main dark:text-white text-[15px] truncate">{{ user?.last_name }} {{ user?.first_name }}</span>
                      <span class="text-[13px] text-secondary dark:text-gray-400 truncate mt-0.5">{{ user?.email }}</span>
                  </div>
              </div>

              <div class="h-px bg-gray-200 dark:bg-gray-800 mx-auto w-[calc(100%-40px)]"></div>

              <!-- Menu Items -->
              <div class="p-3 flex flex-col gap-1">
                  <NuxtLink to="/profile" @click="isProfileOpen = false" class="px-3 py-2.5 text-[15px] rounded-xl hover:bg-gray-200/40 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-secondary dark:text-gray-300">
                      <Icon name="heroicons:user-outline" class="w-5 h-5 shrink-0 opacity-70" />
                      Voir le profil
                  </NuxtLink>
                  
                  <div class="px-3 py-2.5 text-[15px] rounded-xl flex items-center justify-between text-secondary dark:text-gray-300">
                      <div class="flex items-center gap-3">
                          <div class="w-5 h-5 shrink-0"></div> <!-- Spacer for alignment -->
                          Thème
                      </div>
                      <button @click="toggleDarkMode" class="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors">
                          <Icon :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'" class="w-4 h-4 opacity-70" />
                          <span class="text-[13px] font-medium">{{ colorMode.value === 'dark' ? 'Sombre' : 'Clair' }}</span>
                      </button>
                  </div>
              </div>

              <div class="h-px bg-gray-200 dark:bg-gray-800 mx-auto w-[calc(100%-40px)]"></div>

              <!-- Logout -->
              <div class="p-3">
                  <button @click="() => { isProfileOpen = false; handleLogout() }" class="w-full text-left px-3 py-2.5 text-[15px] font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-red-500">
                      <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5 shrink-0" />
                      Déconnexion
                  </button>
              </div>
          </div>
      </div>
    </div>

    <div 
      class="w-full max-w-4xl flex flex-col items-center pt-20 transition-all duration-500 ease-out"
      :class="{ 'scale-[0.95] opacity-90': selectedOrgId !== null }"
    >
      
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
              <div class="w-12 h-12 rounded-xl btn-primary text-white flex items-center justify-center font-bold text-xl uppercase shadow-md overflow-hidden">
                <img v-if="invite.organization?.logo" :src="invite.organization.logo.startsWith('http') ? invite.organization.logo : 'http://localhost:8000' + invite.organization.logo" class="w-full h-full object-cover" />
                <span v-else>{{ invite.organization?.name?.substring(0, 2) || 'OR' }}</span>
              </div>
              <div>
                <h3 class="text-lg font-bold text-main dark:text-white">{{ invite.organization.name }}</h3>
                <span class="text-xs font-semibold text-primary dark:text-blue-400 uppercase tracking-wider">Rôle: {{ invite.role }}</span>
              </div>
            </div>
            <p class="text-sm text-secondary dark:text-gray-400 mb-6 flex-1">Vous avez été invité à rejoindre cette organisation.</p>
            
            <button @click="acceptInvitation(invite.id, invite.organization.id)" class="w-full btn-primary hover:btn-primary text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              <span>Rejoindre l'équipe</span>
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Active Organizations Grid -->
      <div class="w-full mb-10" id="tour-org-list">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl sm:text-3xl font-bold text-main dark:text-white">Vos Organisations</h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Render Active Organizations -->
          <div 
            v-for="org in organizations" 
            :key="org.id"
            @click="selectOrganization(org)"
            class="bg-card dark:bg-[#1A1A1D] rounded-[24px] p-5 border border-form-border dark:border-gray-800 flex flex-col hover:border-primary/40 transition-all duration-300 group min-h-[220px] cursor-pointer relative"
            :class="selectedOrgId === org.id ? 'scale-105 shadow-2xl ring-2 ring-primary z-20 brightness-105' : (selectedOrgId !== null ? 'scale-90 opacity-20 blur-[1px]' : 'hover:-translate-y-1 hover:shadow-xl')"
          >
            
            <div class="flex justify-between items-start mb-3">
              <div v-if="org.logo" class="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                <img :src="org.logo.startsWith('http') ? org.logo : apiBase.replace('/api', '') + org.logo" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm" :style="{ backgroundColor: getIconColor(org.name) }">
                {{ org.name?.charAt(0).toUpperCase() || 'O' }}
              </div>
            </div>
            
            <h2 class="text-lg font-bold text-main dark:text-white mb-1 truncate" :title="org.name">{{ org.name }}</h2>

            <div class="flex items-center gap-6 mb-5 mt-auto">
              <div>
                <div class="text-lg font-bold text-main dark:text-white">{{ org.users_count || 0 }}</div>
                <div class="text-[9px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mt-0.5">Membres</div>
              </div>
              <div>
                <div class="text-lg font-bold text-main dark:text-white">{{ org.workspaces_count || 0 }}</div>
                <div class="text-[9px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mt-0.5">Workspaces</div>
              </div>
            </div>

            <div class="flex items-center gap-2.5">
              <button 
                @click.stop="selectOrganization(org)" 
                class="flex-1 py-2 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                :class="activeOrganization?.id === org.id 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40' 
                  : 'btn-primary hover:brightness-110 active:scale-95 text-white'"
              >
                <Icon v-if="activeOrganization?.id === org.id" name="heroicons:check-circle" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{{ activeOrganization?.id === org.id ? 'Organisation active' : 'Basculer' }}</span>
              </button>
              <NuxtLink :to="`/organization/${org.id}/settings`" @click.stop class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold text-xs transition-colors text-center shrink-0">
                Gérer
              </NuxtLink>
            </div>
          </div>

          <!-- Add New Organization Card (Mobile: fallback, Desktop: inline) -->
          <button id="tour-create-org-btn" @click="openCreateModal" class="bg-transparent dark:bg-transparent rounded-[24px] p-5 border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center min-h-[220px] hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-primary transition-all duration-300 group" :class="{ 'scale-90 opacity-20 blur-[1px]': selectedOrgId !== null }">
            <div class="w-12 h-12 rounded-xl btn-primary-subtle text-primary dark:btn-primary/30 dark:text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Icon name="heroicons:plus" class="w-5 h-5" />
            </div>
            <span class="font-bold text-sm text-main dark:text-white">Créer une organisation</span>
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
            
            <!-- Logo Selection & ColorThief Palette Extraction -->
            <div>
              <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Logo de l'organisation (optionnel)</label>
              <div class="flex items-center gap-4 p-3 bg-[#F4F5F7] dark:bg-[#1A1A1D] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <div class="relative w-16 h-16 rounded-xl bg-white dark:bg-[#222224] border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <img v-if="newOrgForm.logoPreview" :src="newOrgForm.logoPreview" alt="Logo preview" class="w-full h-full object-cover" />
                  <Icon v-else name="heroicons:photo" class="w-8 h-8 text-secondary dark:text-gray-500" />
                </div>
                <div class="flex-1">
                  <button type="button" @click="triggerModalFileInput" class="px-3 py-1.5 bg-white dark:bg-[#2A2A2D] border border-gray-200 dark:border-gray-700 hover:border-primary text-main dark:text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
                    <Icon name="heroicons:arrow-up-tray" class="w-3.5 h-3.5 text-primary" />
                    {{ newOrgForm.logoFile ? 'Changer le logo' : 'Ajouter un logo' }}
                  </button>
                  <span class="block text-[11px] text-secondary dark:text-gray-400 mt-1">PNG, JPG, SVG jusqu'à 5 Mo</span>
                  <input type="file" ref="modalFileInput" class="hidden" accept="image/*" @change="handleModalLogoChange" />
                </div>
              </div>
            </div>

            <!-- Color Palette / Main Theme Selection -->
            <div>
              <label class="block text-sm font-bold text-main dark:text-gray-300 mb-1.5">Couleur principale de l'organisation</label>
              
              <!-- ColorThief extracted swatches -->
              <div v-if="newOrgForm.isAnalyzingLogo" class="flex items-center gap-2 py-2 text-xs text-secondary dark:text-gray-400">
                <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin text-primary" />
                <span>Extraction des couleurs du logo avec Color Thief...</span>
              </div>
              <div v-else-if="newOrgForm.extractedColors.length > 0" class="mb-3">
                <span class="text-xs text-secondary dark:text-gray-400 mb-2 block font-medium">Couleurs suggérées (Color Thief) :</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="color in newOrgForm.extractedColors"
                    :key="color"
                    type="button"
                    @click="selectPrimaryColor(color)"
                    class="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center shadow-sm relative group"
                    :style="{ backgroundColor: color, borderColor: newOrgForm.primaryColor === color ? '#000' : 'transparent' }"
                    :title="color"
                  >
                    <Icon v-if="newOrgForm.primaryColor === color" name="heroicons:check" class="w-4 h-4 text-white drop-shadow-md" />
                  </button>
                </div>
              </div>

              <!-- Color picker input -->
              <div class="flex items-center gap-3">
                <input 
                  type="color" 
                  v-model="newOrgForm.primaryColor" 
                  class="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  v-model="newOrgForm.primaryColor" 
                  placeholder="#0B0E11"
                  class="w-32 bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white font-mono text-xs uppercase rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span class="text-xs text-secondary dark:text-gray-400">Couleur sélectionnée</span>
              </div>
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
            class="px-5 py-2 rounded-lg text-sm font-bold text-white btn-primary hover:brightness-110 neo-emboss active:neo-inset transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            <Icon v-else name="heroicons:plus" class="w-4 h-4" />
            Créer
          </button>
        </div>
      </div>
    </div>

    <!-- Fade-In Screen Transition Overlay when navigating to dashboard -->
    <Transition name="fade">
      <div 
        v-if="selectedOrgId !== null" 
        class="fixed inset-0 z-50 bg-canvas/80 dark:bg-[#151515]/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 pointer-events-none"
      >
        <div class="w-16 h-16 rounded-2xl bg-white dark:bg-[#252528] shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center animate-bounce">
          <img src="/assets/logo_app.svg" class="w-9 h-9 object-contain" alt="Loading" />
        </div>
        <div class="flex items-center gap-2 text-main dark:text-white font-bold text-sm tracking-wider animate-pulse">
          <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin text-primary" />
          <span>Chargement du tableau de bord...</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
