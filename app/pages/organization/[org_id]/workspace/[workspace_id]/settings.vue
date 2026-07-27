<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'custom'
})

const route = useRoute()
const orgId = route.params.org_id as string
const { goBack: smartBack } = useSmartBack()
const goBack = () => {
  smartBack(`/organization/${orgId}/workspace/${route.params.workspace_id}`)
}
const workspaceId = route.params.workspace_id as string
const { activeWorkspace, getWorkspace, getWorkspaceTeams, updateWorkspace, deleteWorkspace, setActiveWorkspace } = useWorkspaces()
const { activeOrganization } = useOrganizations()
const { addToast } = useToast()

const currentWorkspace = ref<any>(null)
const workspaceTeams = ref<any[]>([])
const workspaceMembers = ref<any[]>([])

const form = ref({
  name: '',
  description: '',
})

const isLoading = ref(false)
const selectedColor = ref('#8B5CF6') // default purple
const identityColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#EAB308', '#10B981', '#F97316', '#64748B', '#84CC16']

const isActiveWorkspace = computed(() => {
  return activeWorkspace.value?.id == workspaceId
})

const fetchWorkspace = async () => {
  if (!workspaceId) return;
  try {
    const ws = await getWorkspace(workspaceId)
    currentWorkspace.value = ws
    form.value.name = ws.name
    form.value.description = ws.description || ''
    if (ws.color) {
      selectedColor.value = ws.color
    }

    const teams = await getWorkspaceTeams(workspaceId)
    workspaceTeams.value = teams || []
    
    const membersMap = new Map()
    workspaceTeams.value.forEach(t => {
       if (t.members) {
         t.members.forEach((m: any) => {
            if (!membersMap.has(m.id)) {
               membersMap.set(m.id, m)
            }
         })
       }
    })
    workspaceMembers.value = Array.from(membersMap.values())
  } catch (err) {
    console.error('Failed to fetch workspace:', err)
  }
}

onMounted(() => {
  fetchWorkspace()
})

const getIconColor = (name: string) => {
  if (!name) return '#0B0E11';
  const colors = ['#0B0E11', '#8B5CF6', '#F97316', '#3B82F6', '#10B981', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '...'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

const handleSave = async () => {
  if (!currentWorkspace.value) return;
  isLoading.value = true
  try {
    const updated = await updateWorkspace(currentWorkspace.value.id, {
      name: form.value.name,
      description: form.value.description,
      color: selectedColor.value,
    })
    currentWorkspace.value = updated
    if (isActiveWorkspace.value) {
      setActiveWorkspace(updated)
    }
    addToast({ type: 'success', title: 'Succès', message: 'Paramètres mis à jour.' })
  } catch (err) {
    console.error('Error updating workspace', err)
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de mettre à jour.' })
  } finally {
    isLoading.value = false
  }
}

const isDeleteModalOpen = ref(false)
const deleteConfirmationText = ref('')
const deleteTimeout = ref<any>(null)
const isDeleting = ref(false)

const confirmDelete = () => {
  deleteConfirmationText.value = ''
  isDeleteModalOpen.value = true
}

const cancelDelete = () => {
  if (deleteTimeout.value) {
    clearTimeout(deleteTimeout.value)
    deleteTimeout.value = null
  }
  isDeleting.value = false
  addToast({ type: 'info', title: 'Annulé', message: 'La suppression a été annulée.' })
}

const executeDeleteWorkspace = async () => {
  if (!currentWorkspace.value) return;
  if (deleteConfirmationText.value !== currentWorkspace.value.name) return;
  
  isDeleteModalOpen.value = false
  isDeleting.value = true
  
  addToast({ 
    type: 'warning', 
    title: 'Suppression en attente', 
    message: 'L\'espace sera supprimé dans 5 secondes.',
    duration: 5000,
    action: {
      label: 'Annuler',
      onClick: cancelDelete
    }
  })

  deleteTimeout.value = setTimeout(async () => {
    if (!isDeleting.value) return;
    try {
      await deleteWorkspace(currentWorkspace.value.id)
      if (isActiveWorkspace.value) {
        setActiveWorkspace(null)
      }
      addToast({ type: 'success', title: 'Succès', message: 'Espace supprimé.' })
      navigateTo(`/organization/${activeOrganization.value?.id || ''}`)
    } catch (err) {
      console.error('Error deleting workspace', err)
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'espace.' })
    } finally {
      isDeleting.value = false
    }
  }, 5000)
}

const makeActive = () => {
  if (currentWorkspace.value) {
    setActiveWorkspace(currentWorkspace.value)
    addToast({ type: 'success', title: 'Workspace activé', message: `${currentWorkspace.value.name} est maintenant actif.` })
  }
}
</script>

<template>
  <div class="w-full px-4 md:px-6 lg:px-8 pb-12">
    
    <!-- Top Nav / Back button -->
    <div class="flex items-center gap-4 mb-8">
      <button @click="goBack" class="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-[#2A2A2D] flex items-center justify-center bg-white dark:bg-[#1D1D1D] text-main dark:text-white shadow-md hover:scale-105 hover:shadow-lg transition-all" title="Retour">
        <Icon name="heroicons:chevron-left" class="w-5 h-5 font-bold" />
      </button>
    </div>

    <!-- Header Block -->
    <div class="bg-[#ffffff] dark:bg-[#1A1A1D] rounded-[32px] p-6 border border-gray-200/50 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-sm">
      <div class="flex items-center gap-6">
         <div class="w-20 h-20 rounded-[24px] flex items-center justify-center text-white font-bold text-4xl shadow-sm shrink-0 transition-colors duration-300" :style="{ backgroundColor: selectedColor }">
            {{ form.name ? form.name.charAt(0).toUpperCase() : 'W' }}
         </div>
         <div>
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-main dark:text-white mb-2 truncate max-w-sm">{{ form.name }}</h1>
         </div>
      </div>
      <button 
        @click="makeActive" 
        class="px-6 py-3 font-bold rounded-xl transition-colors shadow-md shrink-0 w-full md:w-auto text-white flex items-center justify-center"
        :class="isActiveWorkspace ? 'btn-primary/80 cursor-default shadow-[#0B0E11]/10' : 'btn-primary hover:bg-[#26b0ac] shadow-[#0B0E11]/20'"
        :disabled="isActiveWorkspace"
      >
        <span v-if="isActiveWorkspace">Workspace actif</span>
        <span v-else>Définir comme actif</span>
      </button>
    </div>

    <!-- Grid Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column (Informations & Membres) -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- Informations Form -->
        <div class="bg-[#ffffff] dark:bg-[#1A1A1D] rounded-[32px] p-8 border border-gray-200/50 dark:border-gray-800 shadow-sm">
          <h2 class="text-xl font-bold text-main dark:text-white mb-6">Informations</h2>
          
          <form @submit.prevent="handleSave" class="space-y-6">
            <div>
              <label class="block text-[10px] font-mono font-bold tracking-widest text-secondary dark:text-gray-500 uppercase mb-2">Nom du Workspace</label>
              <input v-model="form.name" type="text" class="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B0E11]/50 transition-shadow shadow-sm" />
            </div>

            <div>
              <label class="block text-[10px] font-mono font-bold tracking-widest text-secondary dark:text-gray-500 uppercase mb-2">Description</label>
              <textarea v-model="form.description" rows="3" class="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B0E11]/50 transition-shadow shadow-sm"></textarea>
            </div>

            <div class="pt-2">
              <label class="block text-[10px] font-mono font-bold tracking-widest text-secondary dark:text-gray-500 uppercase mb-3">Couleur d'identité</label>
              <div class="flex flex-wrap items-center gap-3">
                 <button v-for="color in identityColors" :key="color" type="button" class="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm" :class="selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600 dark:ring-offset-[#1A1A1D]' : ''" :style="{ backgroundColor: color }" @click="selectedColor = color">
                    <Icon v-if="selectedColor === color" name="heroicons:check" class="w-4 h-4 text-white" />
                 </button>
              </div>
            </div>

            <div class="pt-6 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-gray-200/50 dark:border-gray-800">
              <NuxtLink :to="`/organization/${orgId}/workspaces`" class="w-full sm:w-auto px-5 py-2.5 font-bold text-sm text-center text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors">
                Annuler
              </NuxtLink>
              <button type="submit" class="w-full sm:w-auto px-6 py-2.5 btn-primary text-white rounded-xl font-bold text-sm shadow-md hover:btn-primary hover:brightness-90 transition-colors flex items-center justify-center gap-2" :disabled="isLoading">
                <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
                Enregistrer
              </button>
            </div>
          </form>
        </div>

        <!-- Membres -->
        <div class="bg-[#ffffff] dark:bg-[#1A1A1D] rounded-[32px] p-8 border border-gray-200/50 dark:border-gray-800 shadow-sm">
           <div class="flex items-center justify-between mb-6">
             <h2 class="text-xl font-bold text-main dark:text-white">Membres</h2>
             <span class="text-xs text-secondary dark:text-gray-500 font-mono tracking-wider">{{ workspaceMembers.length }}</span>
           </div>
           
           <div class="space-y-3" v-if="workspaceMembers.length > 0">
             <div v-for="(member, index) in workspaceMembers" :key="member.id" class="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200/50 dark:hover:border-gray-800" :class="index !== 0 ? 'border-t border-gray-200/50 dark:border-gray-800' : ''">
               <div class="flex items-center gap-4">
                 <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm text-white" :style="{ backgroundColor: getIconColor((member.last_name || '') + (member.first_name || '')) }">
                    {{ ((member.last_name || '').charAt(0) + (member.first_name || '').charAt(0)).toUpperCase() || 'U' }}
                 </div>
                 <span class="font-bold text-sm text-main dark:text-gray-200">{{ member.last_name }} {{ member.first_name }}</span>
               </div>
               <span class="text-[11px] font-mono text-gray-400 capitalize">{{ member.pivot?.role || 'Membre' }}</span>
             </div>
           </div>
           <div v-else class="text-sm text-secondary dark:text-gray-500 text-center py-4">
             Aucun membre trouvé.
           </div>
        </div>

        <!-- Équipes -->
        <div class="bg-[#ffffff] dark:bg-[#1A1A1D] rounded-[32px] p-8 border border-gray-200/50 dark:border-gray-800 shadow-sm">
           <div class="flex items-center justify-between mb-6">
             <h2 class="text-xl font-bold text-main dark:text-white">Équipes</h2>
             <span class="text-xs text-secondary dark:text-gray-500 font-mono tracking-wider">{{ workspaceTeams.length }}</span>
           </div>
           
           <div class="space-y-3" v-if="workspaceTeams.length > 0">
             <div v-for="(team, index) in workspaceTeams" :key="team.id" class="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200/50 dark:hover:border-gray-800" :class="index !== 0 ? 'border-t border-gray-200/50 dark:border-gray-800' : ''">
               <div class="flex items-center gap-4">
                 <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm text-white" :style="{ backgroundColor: getIconColor(team.name) }">
                    <Icon name="heroicons:user-group" class="w-5 h-5" />
                 </div>
                 <div class="flex flex-col">
                   <span class="font-bold text-sm text-main dark:text-gray-200">{{ team.name }}</span>
                   <span class="text-[11px] font-mono text-gray-500">{{ team.members_count || 0 }} membres</span>
                 </div>
               </div>
               <NuxtLink :to="`/organization/${orgId}/workspace/${workspaceId}/team/${team.id}`" class="px-3 py-1.5 text-[11px] font-bold text-[#0B0E11] hover:btn-primary/10 rounded-lg transition-colors">
                 Gérer
               </NuxtLink>
             </div>
           </div>
           <div v-else class="text-sm text-secondary dark:text-gray-500 text-center py-4">
             Aucune équipe attachée.
           </div>
        </div>

      </div>
      
      <!-- Right Column -->
      <div class="lg:col-span-4 space-y-6">
        
        <!-- Aperçu -->
        <div class="bg-[#ffffff] dark:bg-[#1A1A1D] rounded-[32px] p-8 border border-gray-200/50 dark:border-gray-800 shadow-sm">
           <h2 class="text-lg font-bold text-main dark:text-white mb-6">Aperçu</h2>
           <div class="flex items-center gap-8 mb-8">
              <div>
                <div class="text-2xl font-bold text-main dark:text-white">{{ workspaceMembers.length }}</div>
                <div class="text-[9px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase mt-1">Membres</div>
              </div>
           </div>
           
           <div class="flex items-center justify-between border-t border-gray-200/50 dark:border-gray-800 pt-5">
             <span class="text-[10px] font-mono tracking-widest text-secondary dark:text-gray-500 uppercase">Créé le</span>
             <span class="text-[11px] font-bold text-main dark:text-gray-300">{{ formatDate(currentWorkspace?.created_at) }}</span>
           </div>
        </div>

        <!-- Organisations -->
        <div class="bg-[#ffffff] dark:bg-[#1A1A1D] rounded-[32px] p-8 border border-gray-200/50 dark:border-gray-800 shadow-sm">
           <div class="flex items-center justify-between mb-5">
             <h2 class="text-lg font-bold text-main dark:text-white">Organisation</h2>
             <span class="text-xs text-secondary dark:text-gray-500 font-mono">1</span>
           </div>
           
           <div class="bg-white dark:bg-[#252525] rounded-xl p-3 flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-700 shadow-sm group">
             <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden" :class="!activeOrganization?.logo ? 'btn-primary-subtle text-primary dark:btn-primary/30 dark:text-primary' : 'bg-transparent'">
                  <img v-if="activeOrganization?.logo" :src="activeOrganization.logo.startsWith('http') ? activeOrganization.logo : `http://localhost:8000${activeOrganization.logo}`" alt="Org Logo" class="w-full h-full object-cover">
                  <span v-else>{{ activeOrganization?.name ? activeOrganization.name.charAt(0).toUpperCase() : 'N' }}</span>
                </div>
               <span class="font-bold text-sm text-main dark:text-gray-200 truncate">{{ activeOrganization?.name || 'Neo Start Technology' }}</span>
             </div>
             <NuxtLink :to="`/organization/${orgId}/settings`" class="p-2 text-primary hover:btn-primary-subtle dark:hover:bg-cyan-900/20 rounded-lg transition-colors shrink-0" title="Paramètres de l'organisation">
               <Icon name="heroicons:arrows-right-left" class="w-5 h-5 transition-transform group-hover:rotate-180" />
             </NuxtLink>
           </div>
        </div>

        <!-- Zone sensible -->
        <div class="bg-[#FFF5F5] dark:bg-red-900/10 rounded-[32px] p-8 border border-red-200 dark:border-red-900/30 shadow-sm">
          <h2 class="text-lg font-bold text-red-500 dark:text-red-400 mb-3">Zone sensible</h2>
          <p class="text-[11px] text-gray-500 dark:text-red-300/70 mb-5 leading-relaxed">
            La suppression d'un workspace efface définitivement ses organisations, équipes et projets.
          </p>
          <button @click="confirmDelete" class="w-full py-2.5 px-4 bg-transparent border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 font-bold text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm">
            <Icon name="heroicons:trash" class="w-4 h-4" />
            Supprimer le workspace
          </button>
        </div>

      </div>

    </div>

    <!-- Custom Delete Workspace Modal -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div @click="isDeleteModalOpen = false" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden transform transition-all relative z-10 animate-fade-in-up">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">Supprimer le workspace</h3>
          <button @click="isDeleteModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6">
          <p class="text-secondary dark:text-gray-400 mb-4">
            Êtes-vous sûr de vouloir supprimer cet espace de travail ? Cette action est irréversible et supprimera toutes les données associées.
          </p>
          <div class="mt-4">
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">
              Veuillez taper <span class="font-bold text-red-500">{{ currentWorkspace?.name }}</span> pour confirmer :
            </label>
            <input 
              v-model="deleteConfirmationText" 
              type="text" 
              class="w-full px-4 py-2 rounded-xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Nom du workspace"
            />
          </div>
        </div>
        <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-black/10">
          <button @click="isDeleteModalOpen = false" class="px-5 py-2.5 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            Annuler
          </button>
          <button 
            @click="executeDeleteWorkspace" 
            :disabled="deleteConfirmationText !== currentWorkspace?.name"
            class="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
