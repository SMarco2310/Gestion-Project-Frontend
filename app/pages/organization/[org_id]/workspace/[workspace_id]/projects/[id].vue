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

const { getProjet, updateProjet, deleteProjet, uploadProjectAttachment, deleteProjectAttachment, archiveProjet } = useProjets()
const { getTasks } = useTasks()
const { addToast } = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const projectAttachments = ref<any[]>([])

const triggerFileInput = () => {
  if (fileInput.value) fileInput.value.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  
  const file = target.files[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    addToast({ title: 'Fichier trop lourd', message: 'La taille maximum est de 10Mo.', type: 'error' })
    return
  }
  
  isUploading.value = true
  try {
    const res = await uploadProjectAttachment(projectId, file)
    if (res.success && res.attachment) {
      projectAttachments.value.push(res.attachment)
      addToast({ title: 'Fichier ajouté', message: 'Le document a été joint au projet.', type: 'success' })
    }
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de joindre le fichier.', type: 'error' })
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const deleteAttachment = async (attachment: any) => {
  try {
    await deleteProjectAttachment(attachment.id)
    projectAttachments.value = projectAttachments.value.filter(a => a.id !== attachment.id)
    addToast({ title: 'Fichier supprimé', message: 'Le document a été retiré.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de supprimer le document.', type: 'error' })
  }
}

const getFileIcon = (mimeType: string) => {
  if (mimeType?.startsWith('image/')) return 'heroicons:photo'
  if (mimeType?.includes('pdf')) return 'heroicons:document-text'
  return 'heroicons:document'
}

const { goBack: smartBack } = useSmartBack()
const goBack = () => {
  smartBack(`/organization/${route.params.org_id}/workspace/${route.params.workspace_id}/projects`)
}

const isArchiving = ref(false)
const handleArchive = async () => {
  isArchiving.value = true
  try {
    await archiveProjet(projectId, true)
    addToast({ title: 'Projet archivé', message: 'Le projet a été archivé avec succès.', type: 'success' })
    goBack()
  } catch (e) {
    addToast({ title: 'Erreur', message: 'Impossible d\'archiver le projet.', type: 'error' })
  } finally {
    isArchiving.value = false
  }
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

const getProjectColorClass = (color: string) => {
  const colors: Record<string, string> = {
    purple: 'from-purple-400 to-purple-600',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-emerald-400 to-emerald-600',
    rose: 'from-rose-400 to-rose-600',
    amber: 'from-amber-400 to-amber-600',
    slate: 'from-slate-400 to-slate-600',
  }
  return colors[color] || colors['purple']
}


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
    members: availableMembers.value.filter(m => {
      const fullName = `${m.first_name || ''} ${m.last_name || ''}`.trim().toLowerCase()
      return fullName.includes(query) || (m.email?.toLowerCase() || '').includes(query)
    }),
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
    await saveInstant('Équipe retirée', 'L\'équipe a été retirée du projet avec succès.')
  }
}

const projectStatus = ref('à faire')
const isStatusDropdownOpen = ref(false)

const saveInstant = async (customTitle?: string, customMessage?: string) => {
    try {
      await updateProjet(
        Number(projectId),
        projectTitle.value,
        projectDescription.value,
        projectStartDate.value ? String(projectStartDate.value).split('T')[0]?.split(' ')[0] || '' : '',
        projectEndDate.value ? String(projectEndDate.value).split('T')[0]?.split(' ')[0] || '' : '',
        projectStatus.value,
        projectColor.value,
        assignedTeams.value.map(t => t.id),
        assignedMembers.value.map(m => m.id)
      )
      addToast({ 
        title: customTitle || 'Équipe modifiée', 
        message: customMessage || 'L\'équipe du projet a été mise à jour.', 
        type: 'success' 
      })
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
  
  const { projets } = useProjets()
  if (projets.value && projets.value.length > 0) {
    const existing = projets.value.find((p: any) => String(p.id) === String(id))
    if (existing) {
      projectTitle.value = existing.name || 'Sans titre'
      projectDescription.value = existing.description || 'Ajouter une description...'
      projectRef.value = existing.reference_code || `PRJ-${String(id).substring(0, 8)}`
      projectCreatorId.value = (existing as any).user_id || null
      projectStartDate.value = (existing as any).start_date || ''
      projectEndDate.value = (existing as any).end_date || ''
      projectColor.value = (existing as any).color || 'blue'
    }
  } else {
    projectTitle.value = 'Chargement...'
    projectRef.value = '...'
  }

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
      
      projectAttachments.value = (projet as any).attachments || []
      
      if ((projet as any).status) projectStatus.value = (projet as any).status
    }
    
    // Fetch tasks to calculate progress metrics
    const tasksData = await getTasks(id)
    if (tasksData) {
      projectTasks.value = tasksData
      totalTasks.value = tasksData.length
      todoTasks.value = tasksData.filter((t: any) => t.status !== 'done').length
      doneTasks.value = tasksData.filter((t: any) => t.status === 'done').length
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
    projectTitle.value = 'Erreur de chargement'
    projectRef.value = 'ERREUR'
  }
}

const startEditing = () => {
  editTitle.value = projectTitle.value
  editDescription.value = unescapeHtml(projectDescription.value)
  editStartDate.value = projectStartDate.value ? (projectStartDate.value.split('T')[0]?.split(' ')[0] ?? '') : ''
  editEndDate.value = projectEndDate.value ? (projectEndDate.value.split('T')[0]?.split(' ')[0] ?? '') : ''
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
    await deleteProjet(projectId)
    addToast({ title: 'Projet supprimé', message: 'Le projet a été supprimé avec succès.', type: 'success' })
    isDeleteModalOpen.value = false
    goBack()
  } catch (error) {
    addToast({ title: 'Erreur', message: 'Impossible de supprimer le projet.', type: 'error' })
  }
}

const statusConfig: Record<string, { label: string, colorClass: string, dotClass: string }> = {
  'à faire': { label: 'À faire', colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', dotClass: 'bg-orange-500' },
  'en cours': { label: 'En cours', colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', dotClass: 'bg-primary' },
  'terminé': { label: 'Terminé', colorClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', dotClass: 'bg-emerald-500' }
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
      projectStartDate.value ? String(projectStartDate.value).split('T')[0]?.split(' ')[0] || '' : '',
      projectEndDate.value ? String(projectEndDate.value).split('T')[0]?.split(' ')[0] || '' : '',
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
  <div class="h-full flex flex-col bg-transparent dark:bg-transparent items-center -mt-4">
    <div class="w-full max-w-[1400px] flex flex-col h-full relative">
      <!-- Top navigation -->
      <div class="flex gap-2 px-4 md:px-6 lg:px-8 pb-2 shrink-0 z-30 relative bg-transparent dark:bg-transparent">
        <button @click="goBack" class="w-10 h-10 rounded-full border-[3px] border-white dark:border-[#2A2A2D] flex items-center justify-center bg-[#1D1D1D] text-white shadow-md hover:scale-105 transition-all" title="Retour">
          <Icon name="heroicons:chevron-left" class="w-5 h-5 font-bold" />
        </button>
      </div>

      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 lg:px-8 py-4 md:py-5 shrink-0 z-30 relative bg-transparent dark:bg-transparent gap-4 md:gap-0">
        <div class="flex items-start md:items-center gap-4 w-full md:w-auto">
          <div :class="['w-10 h-10 rounded-lg bg-gradient-to-b flex items-center justify-center text-white shrink-0 shadow-sm mt-1 md:mt-0', getProjectColorClass(isEditing ? editColor : projectColor)]">
            <Icon name="heroicons:briefcase" class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">{{ projectRef }}</p>
            <div class="flex items-center justify-between md:justify-start w-full md:w-auto md:flex-shrink-0 gap-2 sm:gap-3 mt-0.5">
              <h1 v-if="!isEditing" class="text-2xl sm:text-3xl md:text-4xl font-bold text-main dark:text-gray-100 leading-tight truncate">{{ projectTitle }}</h1>
              <input v-else v-model="editTitle" type="text" class="neo-input w-full text-2xl sm:text-3xl md:text-4xl font-bold text-main dark:text-gray-100 bg-transparent focus:ring-2 focus:ring-primary rounded px-2 py-0.5" />
              <!-- Status badge inline -->
              <div class="relative shrink-0" v-if="!isEditing">
                <button @click="isStatusDropdownOpen = !isStatusDropdownOpen" :class="['px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 hover:brightness-95 transition-colors w-max', statusConfig[projectStatus]?.colorClass || '']">{{ statusConfig[projectStatus]?.label || projectStatus }}<Icon name="heroicons:chevron-down" class="w-3 h-3" /></button>
                <div v-if="isStatusDropdownOpen" @click="isStatusDropdownOpen = false" class="fixed inset-0 z-40"></div>
                <div v-if="isStatusDropdownOpen" class="absolute right-0 md:left-0 md:right-auto top-full mt-1 bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-form-border dark:border-gray-800 z-50 flex flex-col p-1 gap-1 min-w-[140px]">
                  <button @click="updateStatus(key as string)" v-for="(config, key) in statusConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded-md text-left transition-colors flex items-center justify-between text-main dark:text-gray-300', projectStatus === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800']">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full" :class="config.dotClass"></span>
                      {{ config.label }}
                    </div>
                    <Icon v-if="projectStatus === key" name="heroicons:check" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
          <button v-if="!isEditing && canEdit" @click="startEditing" class="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-700 text-main dark:text-gray-300 bg-white dark:bg-[#2A2A2D] hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium shadow-sm">
            <Icon name="heroicons:pencil" class="w-4 h-4" /> Modifier
          </button>
          <button v-if="!isEditing && canEdit" @click="handleArchive" :disabled="isArchiving" class="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors text-sm font-medium shadow-sm disabled:opacity-60">
            <Icon name="heroicons:archive-box" class="w-4 h-4" /> {{ isArchiving ? '...' : 'Archiver' }}
          </button>
          <button v-if="!isEditing && canEdit" @click="handleDelete" class="p-2 text-secondary hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Icon name="heroicons:trash" class="w-4 h-4" />
          </button>
          <button v-if="isEditing" @click="saveEdit" class="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg transition-all text-sm font-bold hover:brightness-110"><Icon name="heroicons:check" class="w-3.5 h-3.5" /> Enregistrer</button>
          <button v-if="isEditing" @click="cancelEdit" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#2D2D2F] text-main dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-bold"><Icon name="heroicons:x-mark" class="w-3.5 h-3.5" /> Annuler</button>
        </div>
      </header>

      <!-- Content Two-Column Layout -->
      <div class="flex-1 flex flex-col md:flex-row overflow-y-auto z-10 px-4 md:px-6 lg:px-8 gap-6 pb-8 pt-4">

        <!-- Main Content (Left) -->
        <div class="flex-1 flex flex-col gap-5 min-w-0">

          <!-- Description + Progress card -->
          <div class="bg-white dark:bg-[#222224] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5 shadow-sm">
            <p class="text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-2">Description</p>
            <div v-if="!isEditing" @click="startEditing" class="text-sm text-secondary dark:text-gray-400 cursor-text min-h-[48px] hover:text-main transition-colors prose dark:prose-invert max-w-none" v-html="unescapeHtml(projectDescription) || 'Ajouter une description...'"></div>
            <RichTextEditor v-else v-model="editDescription" class="w-full" />
            <!-- Color picker (edit mode) -->
            <div v-if="isEditing" class="mt-4">
              <p class="text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-2">Couleur</p>
              <div class="flex gap-2">
                <button v-for="color in ['purple','blue','green','rose','amber','slate']" :key="color" @click="editColor = color" class="w-6 h-6 rounded-full border-2 transition-transform" :class="[editColor===color?'border-cyan-600 scale-110':'border-transparent hover:scale-105',{'bg-purple-400':color==='purple','bg-blue-400':color==='blue','bg-emerald-400':color==='green','bg-rose-400':color==='rose','bg-amber-400':color==='amber','bg-slate-400':color==='slate'}]"></button>
              </div>
            </div>
            <!-- Progress -->
            <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div class="flex justify-between text-sm mb-1.5 font-medium">
                <span class="text-main dark:text-gray-200 font-bold">Tâches accomplies ({{ doneTasks }}/{{ totalTasks }})</span>
                <span class="text-primary dark:text-blue-400 font-bold">{{ tasksProgress }}%</span>
              </div>
              <div class="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div :class="['h-full bg-gradient-to-r transition-all duration-500 rounded-full', getProjectColorClass(projectColor)]" :style="{ width: `${tasksProgress}%` }"></div>
              </div>
            </div>
          </div>

          <!-- Tasks card -->
          <div class="bg-white dark:bg-[#222224] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-main dark:text-gray-200">Tâches du projet</h3>
              <NuxtLink :to="`/organization/${route.params.org_id}/workspace/${route.params.workspace_id}/tasks`" class="text-xs font-bold text-cyan-600 dark:text-blue-400 flex items-center gap-1 hover:underline"><Icon name="heroicons:plus" class="w-3 h-3" /> AJOUTER</NuxtLink>
            </div>
            <div v-if="projectTasks.length > 0" class="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
              <NuxtLink v-for="task in projectTasks" :key="task.id" :to="`/organization/${route.params.org_id}/workspace/${route.params.workspace_id}/tasks/${task.id}`" class="flex items-center justify-between py-3 group cursor-pointer">
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="w-2.5 h-2.5 rounded-full shrink-0" :class="{'bg-emerald-500':task.status==='done'||task.status==='terminé','bg-orange-400':task.status==='à faire'||task.status==='not done','bg-primary':task.status!=='à faire'&&task.status!=='terminé'&&task.status!=='done'&&task.status!=='not done'}"></div>
                  <span class="text-sm text-main dark:text-gray-300 truncate font-medium" :class="{'line-through text-secondary dark:text-gray-500':task.status==='done'||task.status==='terminé'}">{{ task.title }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase" :class="{'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400':task.status==='done'||task.status==='terminé','bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400':task.status==='à faire'||task.status==='not done','bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400':task.status!=='à faire'&&task.status!=='terminé'&&task.status!=='done'&&task.status!=='not done'}">{{ task.status==='done'||task.status==='terminé'?'TERMINÉ':task.status==='à faire'||task.status==='not done'?'À FAIRE':'EN COURS' }}</span>
                  <span class="text-xs font-bold text-secondary dark:text-gray-500">{{ task.reference_code }}</span>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="text-sm text-secondary dark:text-gray-500 py-6 text-center">
              <Icon name="heroicons:inbox" class="w-7 h-7 mx-auto mb-2 opacity-40" />
              Aucune tâche dans ce projet.
            </div>
          </div>

          <!-- Attachments card -->
          <div class="bg-white dark:bg-[#222224] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-main dark:text-gray-200">Pièces jointes</h3>
              <button @click="triggerFileInput" :disabled="isUploading" class="text-xs font-bold text-cyan-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                <Icon v-if="isUploading" name="heroicons:arrow-path" class="w-3 h-3 animate-spin" />
                <Icon v-else name="heroicons:plus" class="w-3 h-3" />
                {{ isUploading ? 'Ajout...' : 'AJOUTER' }}
              </button>
              <input type="file" ref="fileInput" class="hidden" @change="handleFileUpload" />
            </div>
            <div v-if="projectAttachments.length > 0" class="flex flex-col gap-2">
              <div v-for="attachment in projectAttachments" :key="attachment.id" class="group flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A1A1D] rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-colors">
                <a :href="attachment.file_path.startsWith('http')?attachment.file_path:`http://localhost:8000/storage/${attachment.file_path}`" target="_blank" class="flex items-center gap-3 overflow-hidden flex-1">
                  <div class="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Icon :name="getFileIcon(attachment.mime_type)" class="w-4 h-4" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-bold text-main dark:text-gray-200 truncate group-hover:text-primary transition-colors">{{ attachment.file_name }}</span>
                    <span class="text-xs text-secondary dark:text-gray-500">{{ attachment.size > 1024*1024 ? (attachment.size/(1024*1024)).toFixed(1)+' Mo' : Math.round(attachment.size/1024)+' Ko' }}</span>
                  </div>
                </a>
                <button v-if="canEdit" @click.stop="deleteAttachment(attachment)" class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                  <Icon name="heroicons:trash" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div v-else class="text-sm text-secondary dark:text-gray-500 py-6 text-center flex flex-col items-center gap-2">
              <Icon name="heroicons:paper-clip" class="w-7 h-7 opacity-40" />
              Aucune pièce jointe
            </div>
          </div>
        </div>

        <!-- Sidebar (Right) -->
        <div class="w-full md:w-[300px] lg:w-[340px] shrink-0 flex flex-col gap-5">

          <!-- Team card -->
          <div class="bg-white dark:bg-[#222224] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Équipe du projet</p>
              <div class="relative">
                <button @click="isAddDropdownOpen = !isAddDropdownOpen" class="text-xs font-bold text-cyan-600 dark:text-blue-400 flex items-center gap-1 hover:underline"><Icon name="heroicons:plus" class="w-3 h-3" /> Ajouter</button>
                <div v-if="isAddDropdownOpen" @click="isAddDropdownOpen = false" class="fixed inset-0 z-40"></div>
                <div v-if="isAddDropdownOpen" class="absolute right-0 top-6 mt-1 w-56 bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-form-border dark:border-gray-800 z-50 flex flex-col max-h-[280px] overflow-hidden">
                  <div class="p-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <input v-model="assignSearchQuery" type="text" placeholder="Rechercher..." class="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div class="overflow-y-auto flex-1 p-1">
                    <div v-if="filteredAssignees.teams.length > 0">
                      <div class="px-2 py-1 text-[10px] font-bold text-secondary uppercase tracking-wider">Équipes</div>
                      <button v-for="team in filteredAssignees.teams" :key="team.id" @click="assignTeam(team)" class="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors">
                        <div class="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-400 flex items-center justify-center shrink-0"><Icon name="heroicons:user-group" class="w-3 h-3" /></div>
                        <span class="text-xs font-medium text-main dark:text-gray-300 truncate">{{ team.name }}</span>
                      </button>
                    </div>
                    <div v-if="filteredAssignees.members.length > 0" :class="{'mt-1 pt-1 border-t border-gray-100 dark:border-gray-800':filteredAssignees.teams.length>0}">
                      <div class="px-2 py-1 text-[10px] font-bold text-secondary uppercase tracking-wider">Membres</div>
                      <button v-for="member in filteredAssignees.members" :key="member.id" @click="assignMember(member)" class="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors">
                        <div class="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-[9px] shrink-0">{{ (member?.last_name||'U').charAt(0).toUpperCase()+(member?.first_name||'').charAt(0).toUpperCase() }}</div>
                        <span class="text-xs font-medium text-main dark:text-gray-300 truncate">{{ member.last_name+' '+member.first_name }}</span>
                      </button>
                    </div>
                    <div v-if="filteredAssignees.teams.length===0&&filteredAssignees.members.length===0" class="p-3 text-center text-xs text-secondary">Aucun résultat</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="assignedTeams.length > 0" class="flex flex-wrap gap-1.5 mb-3">
              <div v-for="team in assignedTeams" :key="'t-'+team.id" class="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-md text-xs font-bold">
                <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />{{ team.name }}
                <button @click="removeTeam(team)" class="ml-0.5 hover:text-blue-900"><Icon name="heroicons:x-mark" class="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <div v-for="(member, idx) in assignedMembers" :key="'m-'+member.id" class="flex items-center justify-between group">
                <div class="flex items-center gap-3 cursor-pointer flex-1 overflow-hidden" @click="navigateTo(`/profile/${member.id}`)">
                  <div :class="['w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0 border-2 border-white dark:border-gray-800',!member.profile_picture?['bg-orange-500','bg-teal-500','bg-primary','bg-rose-500','bg-emerald-500','bg-purple-500'][idx%6]:'bg-gray-200']">
                    <img v-if="member.profile_picture" :src="member.profile_picture.startsWith('http')?member.profile_picture:`http://localhost:8000${member.profile_picture}`" class="w-full h-full object-cover" />
                    <span v-else>{{ (member?.last_name||'U').charAt(0).toUpperCase()+(member?.first_name||'').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="flex flex-col truncate">
                    <span class="text-sm font-bold text-main dark:text-gray-200 truncate group-hover:text-primary transition-colors">{{ member.last_name+' '+member.first_name }}</span>
                    <span class="text-xs text-secondary dark:text-gray-500">{{ member.role||'Membre' }}</span>
                  </div>
                </div>
                <button @click.stop="removeMember(member)" class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                  <Icon name="heroicons:x-mark" class="w-4 h-4" />
                </button>
              </div>
              <div v-if="assignedTeams.length===0&&assignedMembers.length===0" class="text-xs text-secondary dark:text-gray-500 italic py-2 text-center">Aucun membre assigné</div>
            </div>
          </div>

          <!-- Dates card -->
          <div class="bg-white dark:bg-[#222224] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5 shadow-sm">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <span class="text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider">Début</span>
                <div v-if="isEditing" class="relative">
                  <Icon name="heroicons:calendar" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 pointer-events-none" />
                  <input 
                    v-model="editStartDate"
                    type="date"
                    class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary transition-all"
                  />
                </div>
                <div v-else class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#1A1A1D]/50 rounded-lg border border-gray-100 dark:border-gray-800/50">
                  <Icon name="heroicons:calendar" class="w-4 h-4 text-secondary dark:text-gray-500" />
                  <span class="text-sm font-medium" :class="projectStartDate ? 'text-main dark:text-gray-300' : 'text-secondary dark:text-gray-500 italic'">{{ projectStartDate ? formatDate(projectStartDate) : 'Non défini' }}</span>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  Fin prévue
                  <span v-if="isOverdue && !isEditing" class="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">En retard</span>
                </span>
                <div v-if="isEditing" class="relative">
                  <Icon name="heroicons:calendar" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 pointer-events-none" />
                  <input 
                    v-model="editEndDate"
                    type="date"
                    class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary transition-all"
                  />
                </div>
                <div v-else class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#1A1A1D]/50 rounded-lg border border-gray-100 dark:border-gray-800/50">
                  <Icon name="heroicons:calendar" class="w-4 h-4 text-secondary dark:text-gray-500" />
                  <span class="text-sm font-medium" :class="projectEndDate ? (isOverdue ? 'text-red-500' : 'text-main dark:text-gray-300') : 'text-secondary dark:text-gray-500 italic'">{{ projectEndDate ? formatDate(projectEndDate) : 'Non défini' }}</span>
                </div>
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
