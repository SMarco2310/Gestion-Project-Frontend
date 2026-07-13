<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import useProjets from '~/composables/useProjets'
import useTasks from '~/composables/useTasks'
import useTeams from '~/composables/useTeams'
import { useToast } from '~/composables/useToast'
import DeleteProjectModal from '~/components/DeleteProjectModal.vue'

definePageMeta({
  layout: 'custom',
})

const route = useRoute()
const projectId = route.params.id as string

const { isOwner, user } = useAuth()
const { getTeams } = useTeams()
const { activeOrganization, getMembers } = useOrganizations()

const { getProjet, updateProjet, deleteProjet } = useProjets()
const { getTasks } = useTasks()
const { addToast } = useToast()

const goBack = () => {
  navigateTo(`/organization/${route.params.org_id}/projects`)
}

const isEditing = ref(false)
const projectTitle = ref('')
const projectDescription = ref('')
const projectRef = ref('')
const projectStartDate = ref('')
const projectEndDate = ref('')
const projectColor = ref('blue')
const editTitle = ref('')
const editDescription = ref('')
const editStartDate = ref('')
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
    members: availableMembers.value.filter(m => m.name.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query)),
    teams: availableTeams.value.filter(t => t.name.toLowerCase().includes(query))
  }
})

// Unescape HTML entities function to fix raw <p> tags
const unescapeHtml = (html: string) => {
  if (!html) return ''
  return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

const assignMember = async (member: any) => {
  assignedMembers.value.push(member)
  availableMembers.value = availableMembers.value.filter(m => m.id !== member.id)
  isAddDropdownOpen.value = false
  assignSearchQuery.value = ''
  if (!isEditing.value && projectId) {
    await saveInstant()
  }
}

const assignTeam = async (team: any) => {
  assignedTeams.value.push(team)
  availableTeams.value = availableTeams.value.filter(t => t.id !== team.id)
  isAddDropdownOpen.value = false
  assignSearchQuery.value = ''
  if (!isEditing.value && projectId) {
    await saveInstant()
  }
}

const removeMember = async (member: any) => {
  assignedMembers.value = assignedMembers.value.filter(m => m.id !== member.id)
  availableMembers.value.push(member)
  if (!isEditing.value && projectId) {
    await saveInstant()
  }
}

const removeTeam = async (team: any) => {
  assignedTeams.value = assignedTeams.value.filter(t => t.id !== team.id)
  availableTeams.value.push(team)
  if (!isEditing.value && projectId) {
    await saveInstant()
  }
}

const projectStatus = ref('à faire')
const isStatusDropdownOpen = ref(false)

const saveInstant = async () => {
    try {
      await updateProjet(
        Number(projectId),
        projectTitle.value,
        projectDescription.value,
        projectStartDate.value ? String(projectStartDate.value).split('T')[0] || '' : '',
        projectEndDate.value ? String(projectEndDate.value).split('T')[0] || '' : '',
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
      
      if ((projet as any).status) projectStatus.value = (projet as any).status
    }
    
    // Fetch tasks to calculate progress metrics
    const tasksData = await getTasks(id)
    if (tasksData) {
      projectTasks.value = tasksData
      totalTasks.value = tasksData.length
      todoTasks.value = tasksData.filter((t: any) => t.status === 'à faire').length
      doneTasks.value = tasksData.filter((t: any) => t.status === 'done' || t.status === 'terminé').length
      inProgressTasks.value = totalTasks.value - todoTasks.value - doneTasks.value
      
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
  editDescription.value = unescapeHtml(projectDescription.value)
  editStartDate.value = projectStartDate.value ? (projectStartDate.value.split('T')[0] ?? '') : ''
  editEndDate.value = projectEndDate.value ? (projectEndDate.value.split('T')[0] ?? '') : ''
  editColor.value = projectColor.value
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
}

const saveEdit = async () => {
  if (!projectId) return
  if (!editTitle.value.trim()) {
    addToast({ title: 'Erreur', message: 'Le titre est obligatoire', type: 'error' })
    return
  }
  
  try {
    await updateProjet(
      Number(projectId), 
      editTitle.value, 
      editDescription.value,
      editStartDate.value,
      editEndDate.value,
      projectStatus.value,
      editColor.value,
      assignedTeams.value.map(t => t.id),
      assignedMembers.value.map(m => m.id)
    )
    
    projectTitle.value = editTitle.value
    projectDescription.value = editDescription.value
    projectStartDate.value = editStartDate.value
    projectEndDate.value = editEndDate.value
    projectColor.value = editColor.value
    isEditing.value = false
    
    addToast({ title: 'Succès', message: 'Projet mis à jour', type: 'success' })
  } catch (error) {
    addToast({ title: 'Erreur', message: 'Impossible de mettre à jour le projet', type: 'error' })
  }
}

const isDeleteModalOpen = ref(false)

const handleDelete = () => {
  isDeleteModalOpen.value = true
}

const executeDeleteProject = async () => {
  if (!projectId) return
  
  try {
    await deleteProjet(Number(projectId))
    addToast({ title: 'Projet supprimé', message: 'Le projet a été supprimé avec succès.', type: 'success' })
    isDeleteModalOpen.value = false
    goBack()
  } catch (error) {
    addToast({ title: 'Erreur', message: 'Impossible de supprimer le projet.', type: 'error' })
  }
}

const statusConfig: Record<string, { label: string, colorClass: string }> = {
  'à faire': { label: 'À faire', colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
  'en cours': { label: 'En cours', colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  'terminé': { label: 'Terminé', colorClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' }
}

const isOverdue = computed(() => {
  if (projectStatus.value === 'terminé' || !projectEndDate.value) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(projectEndDate.value)
  endDate.setHours(0, 0, 0, 0)
  return endDate < today
})

const updateStatus = async (status: string) => {
  if (status === 'terminé' && doneTasks.value === 0 && totalTasks.value > 0) {
    addToast({ title: 'Attention', message: 'Le projet est terminé bien qu\'aucune tâche ne le soit.', type: 'info' })
  }

  projectStatus.value = status
  isStatusDropdownOpen.value = false
  
  if (!projectId) return

  try {
    await updateProjet(
      Number(projectId),
      projectTitle.value,
      projectDescription.value,
      projectStartDate.value ? String(projectStartDate.value).split('T')[0] || '' : '',
      projectEndDate.value ? String(projectEndDate.value).split('T')[0] || '' : '',
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

onMounted(async () => {
  await fetchProject(projectId)
  
  // Load members and teams for the assign dropdown
  if (activeOrganization.value) {
    const membersData = await getMembers(activeOrganization.value.id)
    availableMembers.value = membersData.filter((m: any) => !assignedMembers.value.some(am => am.id === m.id))
    
    const teamsData = await getTeams(activeOrganization.value.id)
    availableTeams.value = teamsData.filter((t: any) => !assignedTeams.value.some(at => at.id === t.id))
  }
})
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-[#1D1D1D]">
    <div class="w-full flex flex-col h-full relative">
      <!-- Header -->
      <header class="flex items-start justify-between px-6 lg:px-8 pt-6 lg:pt-8 pb-4 shrink-0 z-10 border-b border-form-border dark:border-gray-800">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-b from-blue-400 to-blue-500 neo-emboss flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
            <Icon name="heroicons:briefcase" class="w-5 h-5" />
          </div>
          <div class="flex-1 pt-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">{{ projectRef }}</span>
            </div>
            <h2 v-if="!isEditing" class="text-xl md:text-2xl font-bold text-main dark:text-gray-100 leading-tight">{{ projectTitle }}</h2>
            <input v-else v-model="editTitle" type="text" class="neo-input w-full text-xl md:text-2xl font-bold text-main dark:text-gray-100 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 rounded px-2 py-0.5 -ml-2" />
          </div>
        </div>
        
        <div class="flex items-center gap-1.5 shrink-0 p-1 rounded-lg">
          <button v-if="!isEditing && canEdit" @click="startEditing" class="p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors" title="Modifier">
            <Icon name="heroicons:pencil" class="w-4 h-4" />
          </button>
          <button v-if="!isEditing && canEdit" @click="handleDelete" class="p-2 text-secondary hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Supprimer">
            <Icon name="heroicons:trash" class="w-4 h-4" />
          </button>
          <button v-if="isEditing" @click="saveEdit" class="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white neo-emboss rounded transition-all text-xs font-bold hover:brightness-110 active:neo-inset"><Icon name="heroicons:check" class="w-3.5 h-3.5" /> Enregistrer</button>
          <button v-if="isEditing" @click="cancelEdit" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#2D2D2F] text-main dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-xs font-bold"><Icon name="heroicons:x-mark" class="w-3.5 h-3.5" /> Annuler</button>
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>
          <button @click="goBack" class="flex items-center gap-1.5 p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors">
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            <span class="text-sm font-medium hidden sm:inline">Retour</span>
          </button>
        </div>
      </header>

      <!-- Content Two-Column Layout -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden z-10">
        
        <!-- Main Content (Left) -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 flex flex-col gap-8 bg-white dark:bg-[#1D1D1D]">
          
          <!-- Description -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <Icon name="heroicons:document-text" class="w-5 h-5 text-secondary dark:text-gray-400" />
              <h3 class="text-base font-bold text-main dark:text-gray-200">Description</h3>
            </div>
            <div v-if="!isEditing" @click="startEditing" class="p-4 rounded-xl neo-input bg-gray-50/50 dark:bg-[#222224] text-secondary dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A2D] cursor-text transition-colors min-h-[100px] shadow-inner prose dark:prose-invert max-w-none focus:outline-none" v-html="unescapeHtml(projectDescription) || 'Ajouter une description...'">
            </div>
            <RichTextEditor v-else v-model="editDescription" class="w-full shadow-inner" />
          </div>

          <!-- Tasks List -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <Icon name="heroicons:check-square" class="w-5 h-5 text-secondary dark:text-gray-400" />
                <h3 class="text-base font-bold text-main dark:text-gray-200">Tâches du projet</h3>
              </div>
              <NuxtLink :to="`/organization/${route.params.org_id || activeOrganization?.id}/tasks`" class="text-xs font-bold text-primary dark:text-blue-400 hover:underline">Voir tout le tableau</NuxtLink>
            </div>
            
            <div v-if="projectTasks.length > 0" class="flex flex-col gap-2">
              <NuxtLink
                v-for="task in projectTasks.slice(0, 5)" :key="task.id"
                :to="`/organization/${route.params.org_id || activeOrganization?.id}/tasks/${task.id}`"
                class="flex items-center justify-between p-3 bg-white dark:bg-[#222224] rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary/50 dark:hover:border-blue-500/50 shadow-sm hover:shadow transition-all group cursor-pointer"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <div
                    class="w-2.5 h-2.5 rounded-full shrink-0"
                    :class="{
                      'bg-orange-400': task.status === 'not done' || task.status === 'à faire',
                      'bg-emerald-500': task.status === 'done' || task.status === 'terminé',
                      'bg-blue-500': task.status !== 'à faire' && task.status !== 'terminé' && task.status !== 'done' && task.status !== 'not done'
                    }"
                  ></div>
                  <span
                    class="text-sm text-main dark:text-gray-300 truncate font-medium group-hover:text-primary dark:group-hover:text-blue-400 transition-colors"
                    :class="{ 'line-through text-secondary dark:text-gray-500': task.status === 'done' || task.status === 'terminé' }"
                  >{{ task.title }}</span>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                    :class="{
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400': task.status === 'done' || task.status === 'terminé',
                      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400': task.status !== 'done' && task.status !== 'terminé'
                    }"
                  >{{ task.status === 'done' || task.status === 'terminé' ? 'Terminé' : 'En cours' }}</span>
                </div>
              </NuxtLink>
              <div v-if="projectTasks.length > 5" class="text-center mt-2">
                <span class="text-xs font-bold text-secondary dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-full">+ {{ projectTasks.length - 5 }} autres tâches</span>
              </div>
            </div>
            <div v-else class="text-sm text-secondary dark:text-gray-500 p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center bg-gray-50 dark:bg-transparent">
              <Icon name="heroicons:inbox" class="w-8 h-8 mx-auto mb-2 opacity-50" />
              Aucune tâche dans ce projet pour le moment.
            </div>
          </div>

        </div>

        <!-- Sidebar (Right) -->
        <div class="w-full md:w-[320px] lg:w-[380px] shrink-0 flex flex-col overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-[#151515] p-6 lg:p-8 gap-8 z-10 border-l border-form-border dark:border-gray-800">
          
          <!-- Quick Info Grid -->
          <div class="flex flex-col gap-4">
            
            <!-- Status -->
            <div>
              <span class="block text-[10px] text-secondary dark:text-gray-500 font-bold uppercase tracking-wider mb-1.5">Statut</span>
              <div class="relative">
                <button @click="isStatusDropdownOpen = !isStatusDropdownOpen" :class="['w-full justify-between px-3 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-1.5 hover:brightness-105 transition-colors shadow-sm', statusConfig[projectStatus]?.colorClass || '']">
                  {{ statusConfig[projectStatus]?.label || projectStatus }} <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5" />
                </button>
                <div v-if="isStatusDropdownOpen" @click="isStatusDropdownOpen = false" class="fixed inset-0 z-40"></div>
                <div v-if="isStatusDropdownOpen" class="absolute left-0 right-0 top-full mt-1 bg-card dark:bg-[#252525] rounded-lg shadow-xl border border-form-border dark:border-gray-800 z-50 flex flex-col p-1 gap-1">
                  <button @click="updateStatus(key as string)" v-for="(config, key) in statusConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded-md text-left transition-colors flex items-center justify-between', projectStatus === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', config.colorClass]">
                    {{ config.label }}
                    <Icon v-if="projectStatus === key" name="heroicons:check" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Color Selection (Edit mode) -->
            <div v-if="isEditing">
              <span class="block text-[10px] text-secondary dark:text-gray-500 font-bold uppercase tracking-wider mb-1.5">Couleur du dossier</span>
              <div class="flex items-center flex-wrap gap-2">
                <button 
                  v-for="color in ['purple', 'blue', 'green', 'rose', 'amber', 'slate']" 
                  :key="color"
                  @click="editColor = color"
                  class="w-6 h-6 rounded-full border-2 transition-transform"
                  :class="[
                    editColor === color ? 'border-primary dark:border-blue-500 scale-110 shadow-sm' : 'border-transparent scale-100 hover:scale-105',
                    {
                      'bg-purple-400': color === 'purple',
                      'bg-blue-400': color === 'blue',
                      'bg-emerald-400': color === 'green',
                      'bg-rose-400': color === 'rose',
                      'bg-amber-400': color === 'amber',
                      'bg-slate-400': color === 'slate'
                    }
                  ]"
                ></button>
              </div>
            </div>

            <!-- Dates -->
            <div class="bg-white dark:bg-[#222224] rounded-xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2">
                 <div class="flex items-center gap-1.5">
                   <Icon name="heroicons:calendar" class="w-4 h-4 text-secondary dark:text-gray-400" />
                   <span class="text-[10px] text-secondary dark:text-gray-500 font-bold uppercase tracking-wider">Début</span>
                 </div>
                 <span v-if="!isEditing" class="text-xs text-main dark:text-gray-300 font-bold">{{ formatDate(projectStartDate) || '-' }}</span>
                 <input v-else v-model="editStartDate" type="date" class="text-xs bg-gray-50 dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded px-1.5 py-1 text-main dark:text-gray-300 focus:outline-none" />
              </div>
              <div class="w-full h-px bg-gray-100 dark:bg-gray-800"></div>
              <div class="flex items-center justify-between gap-2">
                 <div class="flex items-center gap-1.5">
                   <Icon name="heroicons:flag" class="w-4 h-4 text-secondary dark:text-gray-400" />
                   <span class="text-[10px] text-secondary dark:text-gray-500 font-bold uppercase tracking-wider">Échéance</span>
                 </div>
                 <div v-if="!isEditing" class="flex items-center gap-1.5">
                   <div v-if="isOverdue" class="flex items-center justify-center w-4 h-4 bg-red-500 text-white rounded-full shadow-sm animate-pulse" title="En retard">
                       <Icon name="heroicons:exclamation-triangle" class="w-2.5 h-2.5 mt-[1px]" />
                   </div>
                   <span class="text-xs font-bold" :class="isOverdue ? 'text-red-500 dark:text-red-400' : 'text-main dark:text-gray-300'">{{ formatDate(projectEndDate) || '-' }}</span>
                 </div>
                 <input v-else v-model="editEndDate" type="date" class="text-xs bg-gray-50 dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded px-1.5 py-1 text-main dark:text-gray-300 focus:outline-none" />
              </div>
            </div>
          </div>

          <!-- Enhanced Progress -->
          <div>
            <div class="bg-white dark:bg-[#222224] rounded-xl p-5 border border-form-border dark:border-gray-800 shadow-sm flex flex-col gap-4">
              <span class="block text-sm text-main dark:text-gray-200 font-bold mb-1">Progression globale</span>
              
              <div>
                <div class="flex justify-between text-sm mb-1.5 font-medium">
                  <span class="text-secondary dark:text-gray-400">Tâches accomplies ({{ doneTasks }}/{{ totalTasks }})</span>
                  <span class="text-main dark:text-gray-200">{{ tasksProgress }}%</span>
                </div>
                <div class="w-full h-2 neo-input bg-[#E5E7EB] dark:bg-[#2A2A2D] rounded-lg overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-600 transition-all duration-500" :class="{ 'rounded-r-lg': tasksProgress < 100 }" :style="{ width: `${tasksProgress}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Team -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="block text-[10px] text-secondary dark:text-gray-500 font-bold uppercase tracking-wider">Équipe</span>
              <div class="relative">
                <button @click="isAddDropdownOpen = !isAddDropdownOpen" class="text-xs font-bold text-primary dark:text-blue-400 hover:underline flex items-center gap-1">
                  <Icon name="heroicons:plus" class="w-3 h-3" /> Ajouter
                </button>
                
                <div v-if="isAddDropdownOpen" @click="isAddDropdownOpen = false" class="fixed inset-0 z-40"></div>
                <div v-if="isAddDropdownOpen" class="absolute right-0 top-6 mt-1 w-56 bg-card dark:bg-[#252525] rounded-lg shadow-xl border border-form-border dark:border-gray-800 z-50 flex flex-col max-h-[300px] overflow-hidden">
                  <div class="p-2 border-b border-form-border dark:border-gray-800 shrink-0">
                    <input v-model="assignSearchQuery" type="text" placeholder="Rechercher..." class="w-full bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 rounded px-3 py-2 text-sm text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div class="overflow-y-auto custom-scrollbar flex-1 p-1">
                    <div v-if="filteredAssignees.teams.length > 0">
                      <div class="px-2 py-1 text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Équipes</div>
                      <button v-for="team in filteredAssignees.teams" :key="team.id" @click="assignTeam(team)" class="w-full text-left px-2 py-1.5 rounded hover:bg-canvas dark:hover:bg-gray-800 flex items-center gap-2 group transition-colors">
                        <div class="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Icon name="heroicons:user-group" class="w-3 h-3" />
                        </div>
                        <span class="text-xs font-medium text-main dark:text-gray-300 truncate">{{ team.name }}</span>
                      </button>
                    </div>
                    <div v-if="filteredAssignees.members.length > 0" :class="{'mt-1 pt-1 border-t border-form-border dark:border-gray-800': filteredAssignees.teams.length > 0}">
                      <div class="px-2 py-1 text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Membres</div>
                      <button v-for="member in filteredAssignees.members" :key="member.id" @click="assignMember(member)" class="w-full text-left px-2 py-1.5 rounded hover:bg-canvas dark:hover:bg-gray-800 flex items-center gap-2 group transition-colors">
                        <div class="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-[9px] shrink-0">
                          {{ member.name.charAt(0) }}
                        </div>
                        <span class="text-xs font-medium text-main dark:text-gray-300 truncate">{{ member.name }}</span>
                      </button>
                    </div>
                    <div v-if="filteredAssignees.teams.length === 0 && filteredAssignees.members.length === 0" class="p-3 text-center text-xs text-secondary dark:text-gray-500">
                      Aucun résultat
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex flex-col gap-2">
              <!-- Teams -->
              <div v-if="assignedTeams.length > 0" class="flex flex-wrap gap-1.5 mb-1">
                  <div v-for="team in assignedTeams" :key="'t-'+team.id" class="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-md text-xs font-bold">
                    <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />
                    {{ team.name }}
                    <button @click="removeTeam(team)" class="hover:text-blue-900 dark:hover:text-blue-200 ml-0.5">
                      <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
                    </button>
                  </div>
              </div>
              
              <!-- Members Stack & List -->
              <div v-if="assignedMembers.length > 0" class="flex flex-col gap-2">
                <div v-for="(member, idx) in assignedMembers" :key="'m-'+member.id" class="flex items-center justify-between group bg-white dark:bg-[#222224] p-1.5 pr-2 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div class="flex items-center gap-2.5 cursor-pointer flex-1 overflow-hidden" @click="navigateTo(`/profile/${member.id}`)">
                      <div :class="['w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[10px] shadow-sm overflow-hidden shrink-0', !member.profile_picture ? ['bg-orange-500', 'bg-teal-500', 'bg-blue-500', 'bg-rose-500', 'bg-emerald-500', 'bg-purple-500'][idx % 6] : 'bg-canvas dark:bg-gray-800']">
                        <img v-if="member.profile_picture" :src="member.profile_picture.startsWith('http') ? member.profile_picture : `http://localhost:8000${member.profile_picture}`" class="w-full h-full object-cover" />
                        <span v-else>{{ member.name.substring(0, 2).toUpperCase() }}</span>
                      </div>
                      <div class="flex flex-col truncate">
                          <span class="text-xs font-bold text-main dark:text-gray-200 truncate group-hover:text-primary transition-colors">{{ member.name }}</span>
                          <span class="text-[10px] text-secondary dark:text-gray-500 truncate leading-none">{{ member.role || 'Membre' }}</span>
                      </div>
                  </div>
                  <button @click.stop="removeMember(member)" class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                    <Icon name="heroicons:x-mark" class="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div v-if="assignedTeams.length === 0 && assignedMembers.length === 0" class="text-xs text-secondary dark:text-gray-500 italic p-3 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-center bg-white dark:bg-transparent">
                Aucun membre assigné
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    
    <!-- Delete Project Modal -->
    <DeleteProjectModal
      :is-open="isDeleteModalOpen"
      :project-name="projectTitle"
      @close="isDeleteModalOpen = false"
      @confirm="executeDeleteProject"
    />
  </div>
</template>
