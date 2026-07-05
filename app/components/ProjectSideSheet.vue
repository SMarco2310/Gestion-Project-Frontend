<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import useProjets from '~/composables/useProjets'
import useTasks from '~/composables/useTasks'
import useTeams from '~/composables/useTeams'
import { useToast } from '~/composables/useToast'

const { isOwner, user } = useAuth()
const { getTeams } = useTeams()
const { activeOrganization, getMembers } = useOrganizations()

const props = defineProps<{
  isOpen: boolean
  projectId?: number|null|any
  startInEditMode?: boolean
}>()

const emit = defineEmits(['close'])

const close = () => {
  if (isEditing.value) {
    cancelEdit()
  } else {
    emit('close')
  }
}

const { getProjet, updateProjet } = useProjets()
const { getTasks } = useTasks()
const { addToast } = useToast()

const isEditing = ref(false)
const projectTitle = ref('')
const projectDescription = ref('')
const projectRef = ref('')
const projectStartDate = ref('')
const projectEndDate = ref('')
const projectColor = ref('blue')
const editTitle = ref('')
const editDescription = ref('')
const editEndDate = ref('')
const editColor = ref('blue')

const totalTasks = ref(0)
const todoTasks = ref(0)
const inProgressTasks = ref(0)
const doneTasks = ref(0)
const tasksProgress = ref(0)
const projectTasks = ref<any[]>([])

const isAddDropdownOpen = ref(false)
const assignSearchQuery = ref('')

const assignedMembers = ref<any[]>([])
const assignedTeams = ref<any[]>([])

const availableMembers = ref<any[]>([])
const availableTeams = ref<any[]>([])

const filteredAssignees = computed(() => {
  const query = assignSearchQuery.value.toLowerCase()
  return {
    members: availableMembers.value.filter(m => m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)),
    teams: availableTeams.value.filter(t => t.name.toLowerCase().includes(query))
  }
})

const assignMember = async (member: any) => {
  assignedMembers.value.push(member)
  availableMembers.value = availableMembers.value.filter(m => m.id !== member.id)
  isAddDropdownOpen.value = false
  assignSearchQuery.value = ''
  if (!isEditing.value && props.projectId) {
    await saveInstant()
  }
}

const assignTeam = async (team: any) => {
  assignedTeams.value.push(team)
  availableTeams.value = availableTeams.value.filter(t => t.id !== team.id)
  isAddDropdownOpen.value = false
  assignSearchQuery.value = ''
  if (!isEditing.value && props.projectId) {
    await saveInstant()
  }
}

const removeMember = async (member: any) => {
  assignedMembers.value = assignedMembers.value.filter(m => m.id !== member.id)
  availableMembers.value.push(member)
  if (!isEditing.value && props.projectId) {
    await saveInstant()
  }
}

const removeTeam = async (team: any) => {
  assignedTeams.value = assignedTeams.value.filter(t => t.id !== team.id)
  availableTeams.value.push(team)
  if (!isEditing.value && props.projectId) {
    await saveInstant()
  }
}

const saveInstant = async () => {
    try {
      await updateProjet(
        props.projectId,
        projectTitle.value,
        projectDescription.value,
        projectStartDate.value ? String(projectStartDate.value).split('T')[0] || '' : '',
        projectEndDate.value ? String(projectEndDate.value).split('T')[0] || getTodayDate() : getTodayDate(),
        projectStatus.value,
        projectColor.value,
        assignedTeams.value.map(t => t.id),
        assignedMembers.value.map(m => m.id)
      )
      addToast({ title: 'Équipe modifiée', message: 'L\'équipe du projet a été mise à jour.', type: 'success' })
    } catch(e) {
      addToast({ title: 'Erreur', message: 'Impossible de mettre à jour l\'équipe.', type: 'error' })
    }
}

const projectCreatorId = ref<number | null>(null)
const canEdit = computed(() => isOwner.value || (projectCreatorId.value && user.value && projectCreatorId.value === user.value.id))

const formatDate = (dateString: string) => {
  if (!dateString) return 'Non définie'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const fetchProject = async (id: number | string | null) => {
  if (!id) return
  try {
    const projet = await getProjet(id)
    if (projet) {
      projectTitle.value = projet.name || 'Sans titre'
      projectDescription.value = projet.description || 'Ajouter une description...'
      projectRef.value = projet.reference_code || `PRJ-${String(id).substring(0, 8)}`
      projectCreatorId.value = (projet as any).user_id || null
      projectStartDate.value = (projet as any).start_date || ''
      projectEndDate.value = (projet as any).end_date || ''
      projectColor.value = (projet as any).color || 'blue'
      
      assignedTeams.value = (projet as any).teams || []
      
      let members = (projet as any).users || []
      const creator = (projet as any).user
      if (creator) {
        const existingIndex = members.findIndex((m: any) => m.id === creator.id)
        if (existingIndex === -1) {
          members = [{ ...creator, role: 'Créateur du projet' }, ...members]
        } else {
          members[existingIndex] = { ...members[existingIndex], role: members[existingIndex].role || 'Créateur du projet' }
        }
      }
      assignedMembers.value = members
      
      // The API returns the status as defined in ProjectStatus (e.g. 'à faire', 'en cours', 'terminé')
      if ((projet as any).status) projectStatus.value = (projet as any).status
    }
    
    // Fetch tasks to calculate progress metrics
    const tasksData = await getTasks(id)
    if (tasksData) {
      projectTasks.value = tasksData
      totalTasks.value = tasksData.length
      todoTasks.value = tasksData.filter((t: any) => t.status === 'à faire').length
      inProgressTasks.value = tasksData.filter((t: any) => t.status === 'en cours').length
      doneTasks.value = tasksData.filter((t: any) => t.status === 'terminé').length
      
      if (totalTasks.value > 0) {
        tasksProgress.value = Math.round((doneTasks.value / totalTasks.value) * 100)
      } else {
        tasksProgress.value = 0
      }
    } else {
      projectTasks.value = []
    }
  } catch (error) {
    console.error('Failed to fetch project details:', error)
  }
}

const startEditing = () => {
  editTitle.value = projectTitle.value
  editDescription.value = projectDescription.value
  editEndDate.value = projectEndDate.value ? (projectEndDate.value.split('T')[0] ?? '') : ''
  editColor.value = projectColor.value
  isEditing.value = true
}

const saveEdit = async () => {
  if (!props.projectId) return
  try {
    await updateProjet(
      props.projectId,
      editTitle.value,
      editDescription.value,
      projectStartDate.value ? String(projectStartDate.value).split('T')[0] || '' : '',
      editEndDate.value ? String(editEndDate.value).split('T')[0] || getTodayDate() : getTodayDate(),
      projectStatus.value,
      editColor.value,
      assignedTeams.value.map(t => t.id),
      assignedMembers.value.map(m => m.id)
    )
    
    projectTitle.value = editTitle.value
    projectDescription.value = editDescription.value
    projectEndDate.value = editEndDate.value
    projectColor.value = editColor.value
    isEditing.value = false
    addToast({ title: 'Projet modifié', message: 'Les modifications ont été enregistrées.', type: 'success' })
  } catch (error) {
    addToast({ title: 'Erreur', message: 'Impossible d’enregistrer le projet.', type: 'error' })
  }
}

const cancelEdit = () => {
  isEditing.value = false
}

const { deleteProjet } = useProjets()

const handleDelete = async () => {
  if (!props.projectId) return
  if (confirm('Voulez-vous vraiment supprimer ce projet ?')) {
    try {
      await deleteProjet(props.projectId)
      addToast({ type: 'success', title: 'Projet supprimé', message: 'Le projet a été supprimé avec succès.' })
      close()
    } catch (e) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer le projet.' })
    }
  }
}

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    if (activeOrganization.value?.id) {
        try {
            availableTeams.value = await getTeams(activeOrganization.value.id)
            const membersData = await getMembers(activeOrganization.value.id)
            availableMembers.value = Array.isArray(membersData) ? membersData : (membersData?.data || [])
            availableMembers.value = availableMembers.value.map(m => m.user || m)
        } catch(e) {}
    }

    await fetchProject(props.projectId)

    availableTeams.value = availableTeams.value.filter(t => !assignedTeams.value.find((at:any) => at.id === t.id))
    availableMembers.value = availableMembers.value.filter(m => !assignedMembers.value.find((am:any) => am.id === m.id))

    if (props.startInEditMode) {
      startEditing()
    } else {
      isEditing.value = false
    }
  }
})

const isStatusDropdownOpen = ref(false)
const projectStatus = ref('en cours')

const statusConfig: Record<string, { label: string; colorClass: string }> = {
  'à faire': { label: 'À FAIRE', colorClass: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-500' },
  'en cours': { label: 'EN COURS', colorClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-500' },
  'terminé': { label: 'TERMINÉ', colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500' }
}

const getTodayDate = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const updateStatus = async (status: string) => {
  if (status === 'terminé' && doneTasks.value === 0) {
    addToast({ title: 'Action impossible', message: 'Impossible de terminer un projet qui n\'a aucune tâche terminée.', type: 'error' })
    isStatusDropdownOpen.value = false
    return
  }

  projectStatus.value = status
  isStatusDropdownOpen.value = false
  
  if (!props.projectId) return

  try {
    await updateProjet(
      props.projectId,
      projectTitle.value,
      projectDescription.value,
      projectStartDate.value ? String(projectStartDate.value).split('T')[0] || '' : '',
      projectEndDate.value ? String(projectEndDate.value).split('T')[0] || getTodayDate() : getTodayDate(),
      status,
      projectColor.value,
      assignedTeams.value.map(t => t.id),
      assignedMembers.value.map(m => m.id)
    )
    addToast({ title: 'Statut modifié', message: 'Le statut du projet a été mis à jour.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de modifier le statut.', type: 'error' })
  }
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div>
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100] bg-black/60" @click="close"></div>
    </Transition>

    <!-- Side-sheet -->
    <Transition
      enter-active-class="transition transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div 
        v-if="isOpen" 
        class="fixed top-0 bottom-0 right-0 z-[110] w-full max-w-md md:max-w-xl bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <header class="flex items-center justify-between px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] shrink-0 z-10 relative">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-b from-blue-400 to-blue-500 neo-emboss flex items-center justify-center text-white">
              <Icon name="heroicons:briefcase" class="w-5 h-5" />
            </div>
            <div class="flex-1">
              <p class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">{{ projectRef }}</p>
              <h2 v-if="!isEditing" class="text-lg font-bold text-main dark:text-gray-200 leading-tight">{{ projectTitle }}</h2>
              <input v-else v-model="editTitle" type="text" class="neo-input w-full text-lg font-bold text-main dark:text-gray-200 bg-transparent focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 rounded px-2 py-0.5 -ml-2" />
            </div>
          </div>
          
          <div class="flex items-center gap-1 shrink-0">
            <button v-if="!isEditing && canEdit" @click="startEditing" class="p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors" title="Modifier">
              <Icon name="heroicons:pencil" class="w-5 h-5" />
            </button>
            <button v-if="!isEditing && canEdit" @click="handleDelete" class="p-2 text-secondary hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Supprimer">
              <Icon name="heroicons:trash" class="w-6 h-6" />
            </button>
            <button v-if="isEditing" @click="saveEdit" class="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white neo-emboss rounded transition-all text-sm font-medium hover:brightness-110 active:neo-inset"><Icon name="heroicons:check" class="w-4 h-4" /> Enregistrer</button>
            <button v-if="isEditing" @click="cancelEdit" class="flex items-center gap-1.5 px-3 py-1 bg-canvas dark:bg-gray-800 text-main dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-sm font-medium"><Icon name="heroicons:x-mark" class="w-4 h-4" /> Annuler</button>
            <button @click="close" class="p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </header>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          
          <div class="flex items-center gap-3 mb-8 relative">
            <button @click="isStatusDropdownOpen = !isStatusDropdownOpen" :class="['px-3 py-1 rounded-md neo-metallic font-bold text-sm flex items-center gap-1.5 hover:brightness-105 transition-colors', statusConfig[projectStatus]?.colorClass || '']">
              {{ statusConfig[projectStatus]?.label || projectStatus }} <Icon name="heroicons:chevron-down" class="w-4 h-4" />
            </button>
            
            <!-- Dropdown Menu -->
            <div v-if="isStatusDropdownOpen" @click="isStatusDropdownOpen = false" class="fixed inset-0 z-40"></div>
            <div v-if="isStatusDropdownOpen" class="absolute left-0 top-8 mt-1 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1">
              <button @click="updateStatus(key as string)" v-for="(config, key) in statusConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', projectStatus === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', config.colorClass]">
                {{ config.label }}
                <Icon v-if="projectStatus === key" name="heroicons:check" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-8">
            <h3 class="text-base font-bold text-main dark:text-gray-200 mb-2">Description</h3>
            <div v-if="!isEditing" @click="startEditing" class="text-secondary dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap cursor-text p-2 -ml-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {{ projectDescription }}
            </div>
            <textarea v-else v-model="editDescription" class="w-full h-32 p-3 rounded-lg neo-input bg-[#F4F5F7] dark:bg-[#1A1A1D] text-main dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 resize-y custom-scrollbar"></textarea>
          </div>

          <!-- Color Selection (Only in Edit Mode) -->
          <div v-if="isEditing" class="mb-8">
            <label class="block text-sm font-bold text-main dark:text-gray-300 mb-2">Couleur du dossier</label>
            <div class="flex items-center gap-3">
              <button 
                v-for="color in ['purple', 'blue', 'green', 'rose', 'amber', 'slate']" 
                :key="color"
                @click="editColor = color"
                class="w-8 h-8 rounded-full border-2 transition-transform"
                :class="[
                  editColor === color ? 'border-primary dark:border-blue-500 scale-110 shadow-sm' : 'border-transparent scale-100 hover:scale-105',
                  {
                    'bg-[#F2F0F9] dark:bg-[#2A2938]': color === 'purple',
                    'bg-blue-100 dark:bg-blue-900/40': color === 'blue',
                    'bg-emerald-100 dark:bg-emerald-900/40': color === 'green',
                    'bg-rose-100 dark:bg-rose-900/40': color === 'rose',
                    'bg-amber-100 dark:bg-amber-900/40': color === 'amber',
                    'bg-slate-200 dark:bg-slate-700': color === 'slate'
                  }
                ]"
              ></button>
            </div>
          </div>

          <!-- Progress -->
          <div class="mb-8 p-5 rounded-xl neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224]">
            <h3 class="text-sm font-bold text-main dark:text-gray-200 mb-4">Progression globale</h3>
            
            <div class="flex flex-col gap-4">
              <div>
                <div class="flex justify-between text-sm mb-1.5 font-medium">
                  <span class="text-secondary dark:text-gray-400">Tâches accomplies</span>
                  <span class="text-main dark:text-gray-200">{{ tasksProgress }}%</span>
                </div>
                <div class="w-full h-2 neo-input bg-[#E5E7EB] dark:bg-[#2A2A2D] rounded-lg overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-600 rounded-r-lg transition-all duration-500" :style="{ width: `${tasksProgress}%` }"></div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between text-sm mb-1.5 font-medium">
                  <span class="text-secondary dark:text-gray-400">Tickets</span>
                  <span class="text-main dark:text-gray-200">{{ totalTasks }} total</span>
                </div>
                <div class="flex h-2 w-full gap-1 neo-input bg-[#E5E7EB] dark:bg-[#2A2A2D] rounded-lg overflow-hidden">
                  <template v-if="totalTasks > 0">
                    <div class="bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 h-full rounded-l-full transition-all duration-500" :style="{ width: `${(todoTasks / totalTasks) * 100}%` }" title="À faire"></div>
                    <div class="bg-gradient-to-r from-blue-400 to-blue-500 h-full transition-all duration-500" :style="{ width: `${(inProgressTasks / totalTasks) * 100}%` }" title="En cours"></div>
                    <div class="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-r-full transition-all duration-500" :style="{ width: `${(doneTasks / totalTasks) * 100}%` }" title="Terminés"></div>
                  </template>
                  <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                </div>
                <div class="flex justify-between text-[11px] font-bold text-secondary dark:text-gray-500 pt-2 uppercase tracking-wider">
                  <span>{{ todoTasks }} À faire</span>
                  <span class="text-blue-600 dark:text-blue-400">{{ inProgressTasks }} En cours</span>
                  <span class="text-emerald-600 dark:text-emerald-500">{{ doneTasks }} Terminés</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Équipe du projet -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-main dark:text-gray-200">Équipe du projet</h3>
              <div class="relative">
                <button @click="isAddDropdownOpen = !isAddDropdownOpen" class="px-3 py-1.5 bg-canvas dark:bg-[#1A1A1D] text-primary dark:text-blue-400 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-xs border border-form-border dark:border-gray-800 shadow-sm">
                  <Icon name="heroicons:plus" class="w-4 h-4" />
                  Ajouter
                </button>
                
                <div v-if="isAddDropdownOpen" @click="isAddDropdownOpen = false" class="fixed inset-0 z-40"></div>
                <div v-if="isAddDropdownOpen" class="absolute right-0 top-10 mt-1 w-64 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-xl border border-form-border dark:border-gray-800 z-50 flex flex-col max-h-[300px] overflow-hidden">
                  <div class="p-2 border-b border-form-border dark:border-gray-800 shrink-0">
                    <input v-model="assignSearchQuery" type="text" placeholder="Rechercher..." class="w-full bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 rounded px-3 py-2 text-sm text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div class="overflow-y-auto custom-scrollbar flex-1 p-1">
                    <div v-if="filteredAssignees.teams.length > 0">
                      <div class="px-2 py-1 text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Équipes</div>
                      <button v-for="team in filteredAssignees.teams" :key="team.id" @click="assignTeam(team)" class="w-full text-left px-2 py-1.5 rounded hover:bg-canvas dark:hover:bg-gray-800 flex items-center gap-2 group transition-colors">
                        <div class="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />
                        </div>
                        <span class="text-sm font-medium text-main dark:text-gray-300 truncate">{{ team.name }}</span>
                      </button>
                    </div>
                    <div v-if="filteredAssignees.members.length > 0" :class="{'mt-2 pt-2 border-t border-form-border dark:border-gray-800': filteredAssignees.teams.length > 0}">
                      <div class="px-2 py-1 text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Membres</div>
                      <button v-for="member in filteredAssignees.members" :key="member.id" @click="assignMember(member)" class="w-full text-left px-2 py-1.5 rounded hover:bg-canvas dark:hover:bg-gray-800 flex items-center gap-2 group transition-colors">
                        <div class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {{ member.name.charAt(0) }}
                        </div>
                        <div class="flex flex-col truncate">
                          <span class="text-sm font-medium text-main dark:text-gray-300 truncate">{{ member.name }}</span>
                        </div>
                      </button>
                    </div>
                    <div v-if="filteredAssignees.teams.length === 0 && filteredAssignees.members.length === 0" class="p-4 text-center text-xs text-secondary dark:text-gray-500">
                      Aucun résultat trouvé
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex flex-col gap-3">
              <!-- Assigned Teams -->
              <div v-if="assignedTeams.length > 0" class="flex flex-wrap gap-2 mb-2">
                  <div v-for="team in assignedTeams" :key="'t-'+team.id" class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg text-sm font-medium">
                    <Icon name="heroicons:user-group" class="w-4 h-4" />
                    {{ team.name }}
                    <button @click="removeTeam(team)" class="hover:text-blue-900 dark:hover:text-blue-200 ml-1">
                      <Icon name="heroicons:x-mark" class="w-4 h-4" />
                    </button>
                  </div>
              </div>
              
              <!-- Assigned Members -->
              <div v-for="(member, idx) in assignedMembers" :key="'m-'+member.id" class="flex items-center justify-between group">
                <div class="flex items-center gap-3 cursor-pointer" @click="navigateTo(`/profile/${member.id}`)">
                    <div :class="['w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shadow-sm overflow-hidden shrink-0', !member.profile_picture ? ['bg-orange-500', 'bg-teal-500', 'bg-blue-500', 'bg-rose-500', 'bg-emerald-500', 'bg-purple-500'][idx % 6] : 'bg-canvas dark:bg-gray-800']">
                      <img v-if="member.profile_picture" :src="member.profile_picture.startsWith('http') ? member.profile_picture : `http://localhost:8000${member.profile_picture}`" class="w-full h-full object-cover" />
                      <span v-else>{{ member.name.substring(0, 2).toUpperCase() }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-main dark:text-gray-200 group-hover:text-primary transition-colors">{{ member.name }}</span>
                        <span class="text-xs text-secondary dark:text-gray-500">{{ member.role || 'Membre' }}</span>
                    </div>
                </div>
                <button @click.stop="removeMember(member)" class="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Icon name="heroicons:x-mark" class="w-5 h-5" />
                </button>
              </div>
              
              <div v-if="assignedTeams.length === 0 && assignedMembers.length === 0" class="text-sm text-secondary dark:text-gray-500 italic mt-2">
                Aucun membre ou équipe assigné.
              </div>
            </div>
          </div>

          <!-- Tasks List -->
          <div class="mb-8">
            <h3 class="text-sm font-bold text-main dark:text-gray-200 mb-4">Tâches du projet</h3>
            <div v-if="projectTasks.length > 0" class="flex flex-col gap-2">
              <NuxtLink
                v-for="task in projectTasks" :key="task.id"
                :to="`/tasks/${task.id}`"
                @click="close"
                class="flex items-center justify-between p-3 bg-canvas dark:bg-[#1A1A1D] rounded-lg border border-form-border dark:border-gray-800 hover:border-primary dark:hover:border-blue-500 transition-colors group cursor-pointer"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <div
                    class="w-2.5 h-2.5 rounded-full shrink-0"
                    :class="{
                      'bg-orange-400': task.status === 'à faire',
                      'bg-blue-500': task.status === 'en cours',
                      'bg-emerald-500': task.status === 'terminé'
                    }"
                  ></div>
                  <span
                    class="text-sm text-main dark:text-gray-300 truncate font-medium"
                    :class="{ 'line-through text-secondary dark:text-gray-500': task.status === 'terminé' }"
                  >{{ task.title }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div v-if="task.commentaires_count && task.commentaires_count > 0" class="flex items-center gap-1 text-secondary dark:text-gray-400 mr-2">
                    <Icon name="ph:chat-teardrop-text" class="text-[14px]" />
                    <span class="text-xs font-medium">{{ task.commentaires_count }}</span>
                  </div>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                    :class="{
                      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400': task.status === 'à faire',
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': task.status === 'en cours',
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400': task.status === 'terminé'
                    }"
                  >{{ task.status }}</span>
                  <span class="text-xs font-bold text-secondary dark:text-gray-500">{{ task.reference_code }}</span>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="text-sm text-secondary dark:text-gray-500 p-4 border border-dashed border-form-border dark:border-gray-800 rounded-lg text-center bg-canvas dark:bg-transparent">
              Aucune tâche dans ce projet.
            </div>
          </div>
          
          <!-- Footer Details -->
          <div class="mt-8 pt-4 border-t border-form-border dark:border-gray-800 flex justify-between items-center pb-4">
            <div class="flex flex-col gap-1">
               <span class="text-[10px] text-secondary dark:text-gray-500 font-bold uppercase tracking-wider">Date de fin prévue</span>
               <span v-if="!isEditing" class="text-sm text-main dark:text-gray-300 font-medium">{{ formatDate(projectEndDate) }}</span>
               <input v-else v-model="editEndDate" type="date" class="text-sm bg-[#F4F5F7] dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded px-2 py-1 text-main dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          
        </div>
      </div>
    </Transition>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #52525b;
}
</style>
