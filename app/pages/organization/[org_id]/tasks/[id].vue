<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useCommentaire from '~/composables/useCommentaire'
import useAuth from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import useTasks from '~/composables/useTasks'
import useProjets from '~/composables/useProjets'
import useTags from '~/composables/useTags'
import useOrganizations from '~/composables/useOrganizations'

definePageMeta({
  layout: 'custom'
})

const route = useRoute()
const router = useRouter()


const close = () => {
  router.push(`/organization/${route.params.org_id || activeOrganization.value?.id}/tasks`)
}

const { commentaires, getCommentaires, createCommentaire, updateCommentaire, deleteCommentaire, isLoading: commentsLoading, error: commentsError } = useCommentaire()
const { getTask, updateTask, getTasks, createTask, deleteTask, uploadBanner } = useTasks()
const { getProjet } = useProjets()
const { tags, getTags } = useTags()
const { user } = useAuth()
const { addToast } = useToast()
const { activeOrganization } = useOrganizations()
const { $api } = useNuxtApp()

const activeTab = ref('comments')

const isAssigneeDropdownOpen = ref(false)
const taskAssignee = ref<any>(null)
const orgMembers = ref<any[]>([])
const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500']

const fetchOrgMembers = async () => {
  if (!activeOrganization.value) return
  try {
    const res = await $api<any>(`/organizations/${activeOrganization.value.id}/members`, { method: 'GET' })
    const members = res.data?.data ?? res.data ?? []
    orgMembers.value = members.map((m: any, i: number) => ({
      id: m.id,
      name: m.name,
      initials: m.name?.charAt(0)?.toUpperCase() || '?',
      color: avatarColors[i % avatarColors.length],
      profile_picture: m.profile_picture || null
    }))
  } catch (err) {
    console.error('Failed to fetch org members for assignee dropdown:', err)
  }
}

const isEditing = ref(false)
const taskTitle = ref('')
const taskDescription = ref('Ajouter une description...')
const editTitle = ref('')
const editDescription = ref('')
const editDueDate = ref('')
const projectEndDate = ref('')
const taskStatus = ref('')
const taskPriority = ref('')
const taskReference = ref('')
const taskTagIds = ref<(number | string)[]>([])
const taskTags = ref<any[]>([])
const taskDueDate = ref('')
const taskCreatedAt = ref('')
const taskUpdatedAt = ref('')
const taskProjetId = ref<string | number>('')
const taskProjetReference = ref('')
const taskSubtasks = ref<any[]>([])
const taskBannerImage = ref('')

const setTask = async (id: string | number | null) => {
  if (!id) return
  try {
    const task = await getTask(id)
    if (task) {
      taskTitle.value = task.title || 'Sans titre'
      taskDescription.value = task.description || 'Ajouter une description...'
      if (task.status) taskStatus.value = task.status
      if (task.priority) taskPriority.value = task.priority
      if (task.board_column) taskBoardColumn.value = task.board_column
      taskReference.value = task.reference_code || `T-${String(task.id).padStart(2, '0')}`
      taskTagIds.value = task.tag_ids || []
      taskTags.value = task.tags || []
      taskDueDate.value = task.due_date || 'Aucune'
      taskCreatedAt.value = task.created_at || ''
      taskUpdatedAt.value = task.updated_at || ''
      taskUpdatedAt.value = task.updated_at || ''
      taskProjetId.value = task.projet_id || ''
      taskBannerImage.value = task.banner_image || ''
      if (task.projet_id) {
        try {
          const projet = await getProjet(task.projet_id)
          if (projet) {
            taskProjetReference.value = (projet as any).reference_code || `PROJ-${task.projet_id}`
            if ((projet as any).end_date) {
              projectEndDate.value = String((projet as any).end_date).split('T')[0] || ''
            } else {
              projectEndDate.value = ''
            }
          } else {
            projectEndDate.value = ''
            taskProjetReference.value = `PROJ-${task.projet_id}`
          }
        } catch (e) {
          projectEndDate.value = ''
        }
      } else {
        projectEndDate.value = ''
      }
      
      taskSubtasks.value = task.sub_tasks || []
    }
  } catch (e) {
    console.error(e)
  }
}

const startEditing = () => {
  editTitle.value = taskTitle.value
  editDescription.value = taskDescription.value
  editDueDate.value = taskDueDate.value && taskDueDate.value !== 'Aucune' ? (String(taskDueDate.value).split('T')[0] || '') : ''
  isEditing.value = true
}

const saveEdit = async () => {
  if (!(route.params.id as string)) return
  try {
    const payload: any = {
      title: editTitle.value,
      description: editDescription.value
    }
    if (editDueDate.value) {
      payload.due_date = editDueDate.value
    } else {
      payload.due_date = null
    }
    await updateTask((route.params.id as string), payload)
    taskTitle.value = editTitle.value
    taskDescription.value = editDescription.value
    taskDueDate.value = editDueDate.value || 'Aucune'
    isEditing.value = false
    addToast({ title: 'Tâche modifiée', message: 'Les modifications ont été enregistrées.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible d’enregistrer la tâche.', type: 'error' })
  }
}

const cancelEdit = () => {
  isEditing.value = false
}



const handleDelete = async () => {
  if (!(route.params.id as string)) return
  if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
    try {
      await deleteTask((route.params.id as string))
      addToast({ type: 'success', title: 'Tâche supprimée', message: 'La tâche a été supprimée avec succès.' })
      close()
    } catch (e) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer la tâche.' })
    }
  }
}

const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0 && (route.params.id as string)) {
    const file = target.files[0] as File
    if (!file) return
    try {
      const updatedTask = await uploadBanner((route.params.id as string), file)
      taskBannerImage.value = updatedTask.banner_image || ''
      addToast({ type: 'success', title: 'Couverture modifiée', message: 'L\'image a été ajoutée avec succès.' })
    } catch (e) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de télécharger l\'image.' })
    }
  }
}

const removeBanner = async () => {
  if (!route.params.id) return
  if (confirm('Voulez-vous vraiment supprimer cette couverture ?')) {
    try {
      await updateTask((route.params.id as string), { banner_image: null })
      taskBannerImage.value = ''
      addToast({ type: 'success', title: 'Couverture supprimée', message: 'L\'image a été supprimée avec succès.' })
    } catch (e) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'image.' })
    }
  }
}



const isTagDropdownOpen = ref(false)
const isStatusDropdownOpen = ref(false)
const isPriorityDropdownOpen = ref(false)

const isBoardColumnDropdownOpen = ref(false)
const isCreateSubtaskModalOpen = ref(false)
const commentText = ref('')
const commentTextarea = ref<HTMLTextAreaElement | null>(null)
const editingCommentId = ref<number | string | null>(null)
const editingCommentText = ref('')

const taskBoardColumn = ref('')

const updateBoardColumn = async (newColumn: string) => {
  if (!(route.params.id as string)) return
  try {
    const payload: any = { board_column: newColumn }
    if (newColumn.toLowerCase() === 'terminé' || newColumn.toLowerCase() === 'done') {
      payload.status = 'terminé'
      taskStatus.value = 'terminé'
    }
    await updateTask((route.params.id as string), payload)
    taskBoardColumn.value = newColumn
    isBoardColumnDropdownOpen.value = false
    addToast({ title: 'Colonne modifiée', message: 'La tâche a été déplacée.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de déplacer la tâche.', type: 'error' })
  }
}

const updateAssignee = async (member: any) => {
  if (!(route.params.id as string)) return
  try {
    await updateTask((route.params.id as string), { assignee_id: member ? member.id : null })
    taskAssignee.value = member
    isAssigneeDropdownOpen.value = false
    addToast({ title: 'Assignation modifiée', message: 'Le responsable a été mis à jour.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de modifier l\'assignation.', type: 'error' })
  }
}

const updateDueDate = async (event: Event) => {
  if (!(route.params.id as string)) return
  const target = event.target as HTMLInputElement
  const newDate = target.value
  try {
    await updateTask((route.params.id as string), { due_date: newDate || undefined })
    taskDueDate.value = newDate || 'Aucune'
    addToast({ title: 'Échéance modifiée', message: 'La date a été mise à jour.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de modifier la date.', type: 'error' })
  }
}

const showMentionDropdown = ref(false)
const mentionSearchQuery = ref('')
const activeMentions = ref<(number | string)[]>([])
const mentionCursorPosition = ref(0)

const filteredMentionUsers = computed(() => {
  if (!mentionSearchQuery.value) return orgMembers.value
  const q = mentionSearchQuery.value.toLowerCase()
  return orgMembers.value.filter(u => u.name.toLowerCase().includes(q))
})

const handleCommentInput = () => {
  if (!commentTextarea.value) return
  const cursorPosition = commentTextarea.value.selectionStart
  const textBeforeCursor = commentText.value.substring(0, cursorPosition)
  
  const match = textBeforeCursor.match(/@([a-zA-Z0-9_\-]* ?[a-zA-Z0-9_\-]*)$/)
  
  if (match && match[1] !== undefined && match[1].length > 0 && match[1].length < 25) {
    showMentionDropdown.value = true
    mentionSearchQuery.value = match[1]
    mentionCursorPosition.value = match.index || 0
  } else {
    showMentionDropdown.value = false
  }
}

const selectMention = (member: any) => {
  const textBeforeMention = commentText.value.substring(0, mentionCursorPosition.value)
  const textAfterCursor = commentText.value.substring(commentTextarea.value?.selectionStart || 0)
  
  commentText.value = `${textBeforeMention}@${member.name} ${textAfterCursor}`
  
  if (!activeMentions.value.includes(member.id)) {
    activeMentions.value.push(member.id)
  }
  
  showMentionDropdown.value = false
  mentionSearchQuery.value = ''
  
  setTimeout(() => {
    if (commentTextarea.value) {
      commentTextarea.value.focus()
      const newPos = mentionCursorPosition.value + member.name.length + 2
      commentTextarea.value.setSelectionRange(newPos, newPos)
    }
  }, 0)
}

const renderCommentContent = (content: string) => {
  if (!content) return ''
  let html = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  const sortedMembers = [...orgMembers.value].sort((a, b) => b.name.length - a.name.length)
  
  for (const member of sortedMembers) {
    const regex = new RegExp(`@${member.name}\\b`, 'gi')
    html = html.replace(regex, `<span class="text-primary font-bold bg-primary/10 px-1 rounded cursor-pointer">@${member.name}</span>`)
  }
  
  return html
}

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return 'Aucune'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Aucune'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}


const kanbanColumns = computed(() => {
  return activeOrganization.value?.kanban_columns?.length 
    ? activeOrganization.value.kanban_columns 
    : ['À faire', 'En cours', 'Terminé']
})

const kanbanColors = computed(() => {
  return activeOrganization.value?.kanban_colors || {}
})

const statusConfig = computed(() => {
  const config: Record<string, { label: string; colorClass?: string; style?: any }> = {}
  kanbanColumns.value.forEach(col => {
    let colorClass = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    let style: any = undefined
    const lowerCol = col.toLowerCase()
    
    if (kanbanColors.value[col]) {
      colorClass = ''
      style = {
        backgroundColor: kanbanColors.value[col] + '20',
        color: kanbanColors.value[col]
      }
    } else if (lowerCol === 'à faire' || lowerCol === 'to do') {
      colorClass = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-500'
    } else if (lowerCol === 'en cours' || lowerCol === 'in progress') {
      colorClass = 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-500'
    } else if (lowerCol === 'terminé' || lowerCol === 'done') {
      colorClass = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500'
    }
    
    config[col] = {
      label: col.toUpperCase(),
      colorClass,
      style
    }
  })
  
  if (taskStatus.value && !config[taskStatus.value]) {
    config[taskStatus.value] = {
      label: taskStatus.value.toUpperCase(),
      colorClass: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
  }
  
  return config
})

const priorityConfig: Record<string, { label: string; colorClass: string; icon: string }> = {
  faible: { label: 'FAIBLE', colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: 'ph:caret-down-bold' },
  moyen: { label: 'MOYEN', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-500', icon: 'ph:equals-bold' },
  'élevé': { label: 'ÉLEVÉ', icon: 'heroicons:chevron-double-up', colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
}

const updateStatus = async (newStatus: string) => {
  if (!(route.params.id as string)) return
  try {
    await updateTask((route.params.id as string), { status: newStatus })
    taskStatus.value = newStatus
    isStatusDropdownOpen.value = false
    addToast({ title: 'Statut modifié', message: 'Le statut de la tâche a été mis à jour.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de modifier le statut.', type: 'error' })
  }
}

const updatePriority = async (newPriority: string) => {
  if (!(route.params.id as string)) return
  try {
    await updateTask((route.params.id as string), { priority: newPriority })
    taskPriority.value = newPriority
    isPriorityDropdownOpen.value = false
    addToast({ title: 'Priorité modifiée', message: 'La priorité de la tâche a été mise à jour.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de modifier la priorité.', type: 'error' })
  }
}

const toggleTag = async (tag: any) => {
  if (!(route.params.id as string)) return
  try {
    let newTagIds = [...taskTagIds.value]
    if (newTagIds.includes(tag.id)) {
      newTagIds = newTagIds.filter(id => id !== tag.id)
    } else {
      newTagIds.push(tag.id)
    }
    
    await updateTask((route.params.id as string), { tag_ids: newTagIds as any })
    
    taskTagIds.value = newTagIds
    taskTags.value = tags.value.filter(t => newTagIds.includes(t.id))
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de modifier les étiquettes.', type: 'error' })
  }
}

const handleCreateSubtaskSubmit = async (payload: any) => {
  try {
    const createdTask = await createTask(payload)
    taskSubtasks.value.push(createdTask)
    isCreateSubtaskModalOpen.value = false
  } catch (err) {
    console.error('Failed to create subtask', err)
  }
}

const sendComment = async () => {
  if (!commentText.value.trim() || !(route.params.id as string)) {
    addToast({ title: 'Commentaire vide', message: 'Écrivez quelque chose avant d’envoyer.', type: 'warning' })
    return
  }

  // Robustly extract mentions by checking if any @[MemberName] exists in the text
  const extractedMentions = [...activeMentions.value]
  orgMembers.value.forEach(member => {
    if (commentText.value.includes(`@${member.name}`) && !extractedMentions.includes(member.id)) {
      extractedMentions.push(member.id)
    }
  })

  try {
    await createCommentaire({
      content: commentText.value.trim(),
      tache_id: (route.params.id as string),
      mentions: extractedMentions,
    })

    commentText.value = ''
    activeMentions.value = []
    await getCommentaires((route.params.id as string))
    
    // Update the task's comment count locally in the global state
    const { tasks } = useTasks()
    const taskIndex = tasks.value.findIndex(t => String(t.id) === String((route.params.id as string)))
    if (taskIndex !== -1) {
      const task = tasks.value[taskIndex]
      if (task) {
        task.commentaires_count = (task.commentaires_count || 0) + 1
      }
    }

    addToast({ title: 'Commentaire ajouté', message: 'Votre commentaire a été publié.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible d’ajouter le commentaire.', type: 'error' })
    console.error(err)
  }
}

const startEditComment = (comment: any) => {
  editingCommentId.value = comment.id
  editingCommentText.value = comment.content
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editingCommentText.value = ''
}

const saveEditComment = async () => {
  if (!editingCommentId.value || !editingCommentText.value.trim()) return

  try {
    await updateCommentaire(editingCommentId.value, editingCommentText.value.trim())
    cancelEditComment()
    addToast({ title: 'Commentaire modifié', message: 'Votre commentaire a été mis à jour.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de modifier le commentaire.', type: 'error' })
    console.error(err)
  }
}

const handleDeleteComment = async (commentId: string | number) => {
  if (confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
    try {
      await deleteCommentaire(commentId)
      const { tasks } = useTasks()
      const route = useRoute()
      const taskIndex = tasks.value.findIndex(t => String(t.id) === String((route.params.id as string)))
      if (taskIndex !== -1) {
        const taskObj = tasks.value[taskIndex]
        if (taskObj) {
          taskObj.commentaires_count = Math.max(0, (taskObj.commentaires_count || 0) - 1)
        }
      }
      addToast({ title: 'Commentaire supprimé', message: 'Votre commentaire a été supprimé.', type: 'success' })
    } catch (err) {
      addToast({ title: 'Erreur', message: 'Impossible de supprimer le commentaire.', type: 'error' })
      console.error(err)
    }
  }
}

const resetState = () => {
  isEditing.value = false
  taskTitle.value = ''
  taskDescription.value = 'Chargement...'
  editTitle.value = ''
  editDescription.value = ''
  editDueDate.value = ''
  projectEndDate.value = ''
  taskStatus.value = ''
  taskPriority.value = ''
  taskReference.value = ''
  taskTags.value = []
  taskTagIds.value = []
  taskDueDate.value = ''
  taskCreatedAt.value = ''
  taskUpdatedAt.value = ''
  taskProjetId.value = ''
  taskProjetReference.value = ''
  taskBannerImage.value = ''
  taskSubtasks.value = []
  commentText.value = ''
  activeMentions.value = []
  showMentionDropdown.value = false
  editingCommentId.value = null
  editingCommentText.value = ''
  isTagDropdownOpen.value = false
  isStatusDropdownOpen.value = false
  isPriorityDropdownOpen.value = false
  isAssigneeDropdownOpen.value = false
}

watch(() => (route.params.id as string), async (newTaskId) => {
  if (newTaskId) {
    resetState()
    await setTask(newTaskId)
    fetchOrgMembers()
    await getCommentaires(newTaskId)
    if (false) {
      startEditing()
    }
  }
}, { immediate: true })

watch(() => true, (newIsOpen) => {
  if (newIsOpen && false) {
    startEditing()
    fetchOrgMembers()
  }
})
</script>

<template>
  <div class="flex flex-col w-full h-full min-h-screen bg-white dark:bg-[#1A1A1D]">
      <!-- Header -->
          <header class="flex items-center justify-between px-6 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] shrink-0 z-10 relative">
            <div class="flex items-center gap-3 text-secondary dark:text-gray-400 font-medium text-sm">
              <Icon name="ph:bookmark-simple-fill" class="text-emerald-500 w-4 h-4" />
              <NuxtLink v-if="taskProjetId" :to="`/organization/${route.params.org_id || activeOrganization?.id}/projects/${taskProjetId}`" class="hover:underline cursor-pointer">{{ taskProjetReference }}</NuxtLink>
              <span v-if="taskProjetId">/</span>
              <Icon name="ph:bookmark-simple-fill" class="text-emerald-500 w-4 h-4" />
              <span class="hover:underline cursor-pointer">{{ taskReference }}</span>
            </div>
            
            <div class="flex items-center gap-1 sm:gap-2 shrink-0">
              <button v-if="!isEditing" @click="startEditing" class="p-1.5 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors" title="Modifier"><Icon name="heroicons:pencil" class="w-5 h-5" /></button>
              <button v-if="!isEditing" @click="handleDelete" class="p-1.5 text-secondary hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Supprimer"><Icon name="heroicons:trash" class="w-5 h-5" /></button>
              <button v-if="isEditing" @click="saveEdit" class="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white neo-emboss rounded transition-all text-xs sm:text-sm font-medium hover:brightness-110 active:neo-inset"><Icon name="heroicons:check" class="w-4 h-4" /> <span class="hidden sm:inline">Enregistrer</span></button>
              <button v-if="isEditing" @click="cancelEdit" class="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-canvas dark:bg-gray-800 text-main dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-xs sm:text-sm font-medium"><Icon name="heroicons:x-mark" class="w-4 h-4" /> <span class="hidden sm:inline">Annuler</span></button>
              <div class="hidden sm:block w-px h-6 bg-black/10 dark:bg-white/10 mx-1"></div>
              <button @click="close" class="p-1.5 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors"><Icon name="heroicons:x-mark" class="w-6 h-6" /></button>
            </div>
          </header>

          <!-- Banner Image -->
          <div v-if="taskBannerImage" class="w-full h-48 sm:h-72 shrink-0 bg-gray-100 dark:bg-[#1A1A1D] border-b border-black/5 dark:border-white/5 relative group">
            <img :src="taskBannerImage" class="w-full h-full object-cover" alt="Task banner" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button @click="triggerFileInput" class="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm">
                <Icon name="heroicons:camera" class="w-5 h-5" /> Changer la couverture
              </button>
              <button @click="removeBanner" class="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm">
                <Icon name="heroicons:trash" class="w-5 h-5" /> Supprimer
              </button>
            </div>
          </div>
          <div v-else class="w-full h-32 shrink-0 bg-[#F4F5F7] dark:bg-[#1A1A1D] border-b border-black/5 dark:border-white/5 flex items-center justify-center group cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" @click="triggerFileInput">
            <div class="flex flex-col items-center gap-2 text-secondary dark:text-gray-500 group-hover:text-main dark:group-hover:text-gray-300 transition-colors">
              <Icon name="heroicons:photo" class="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
              <span class="text-sm font-medium">Ajouter une couverture</span>
            </div>
          </div>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />

          <!-- Content Layout -->
          <div class="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden custom-scrollbar">
            <!-- Main Column (Left) -->
            <div class="flex-1 md:overflow-y-auto custom-scrollbar shrink-0 flex flex-col p-4 sm:p-8 bg-white dark:bg-[#222224]">
              <h1 v-if="!isEditing" class="text-2xl sm:text-3xl font-bold text-main dark:text-gray-200 mb-4 leading-tight">
                {{ taskTitle }}
              </h1>
              <input v-else v-model="editTitle" type="text" class="neo-input w-full text-2xl sm:text-3xl font-bold text-main dark:text-gray-200 mb-4 bg-transparent focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 rounded-lg py-2 px-3 -ml-3" />
              
              <!-- Quick Actions Row -->
              <div class="flex flex-wrap gap-2 mb-8 items-center">
                <!-- Status -->
                <div class="relative">
                  <button @click="isStatusDropdownOpen = !isStatusDropdownOpen" :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs uppercase transition-colors', statusConfig[taskStatus]?.colorClass || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300']" :style="statusConfig[taskStatus]?.style">
                    {{ statusConfig[taskStatus]?.label || taskStatus }} <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5" />
                  </button>
                  <div v-if="isStatusDropdownOpen" @click="isStatusDropdownOpen = false" class="fixed inset-0 z-40"></div>
                  <div v-if="isStatusDropdownOpen" class="absolute left-0 top-full mt-1 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1">
                    <button @click="updateStatus(key as string)" v-for="(config, key) in statusConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskStatus === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', config.colorClass]" :style="config.style">
                      {{ config.label }}
                      <Icon v-if="taskStatus === key" name="heroicons:check" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Column -->
                <div class="relative">
                  <button @click="isBoardColumnDropdownOpen = !isBoardColumnDropdownOpen" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#2D2D2F] text-gray-700 dark:text-gray-300 rounded-md font-bold text-xs uppercase transition-colors hover:brightness-105">
                    {{ taskBoardColumn || 'À faire' }} <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5" />
                  </button>
                  <div v-if="isBoardColumnDropdownOpen" @click="isBoardColumnDropdownOpen = false" class="fixed inset-0 z-40"></div>
                  <div v-if="isBoardColumnDropdownOpen" class="absolute left-0 top-full mt-1 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                    <button @click="updateBoardColumn(col as string)" v-for="col in kanbanColumns" :key="col" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskBoardColumn === col ? 'bg-canvas dark:bg-gray-700' : 'hover:bg-canvas dark:hover:bg-gray-800']">
                      {{ col }}
                      <Icon v-if="taskBoardColumn === col" name="heroicons:check" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Assignee -->
                <div class="relative">
                  <button @click="isAssigneeDropdownOpen = !isAssigneeDropdownOpen" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#2D2D2F] text-gray-700 dark:text-gray-300 rounded-md font-bold text-xs transition-colors hover:brightness-105">
                    <Icon name="heroicons:user" class="w-3.5 h-3.5" />
                    <span v-if="taskAssignee" class="truncate max-w-[100px]">{{ taskAssignee.name }}</span>
                    <span v-else>Assigner</span>
                  </button>
                  <div v-if="isAssigneeDropdownOpen" @click="isAssigneeDropdownOpen = false" class="fixed inset-0 z-40"></div>
                  <div v-if="isAssigneeDropdownOpen" class="absolute left-0 top-full mt-1 w-56 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col">
                    <div class="p-2 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
                      <p class="text-xs text-secondary font-medium px-2">Assigner à</p>
                      <button class="text-primary dark:text-blue-400 hover:underline text-xs pr-2" @click.stop="updateAssignee(orgMembers.find(m => m.id === user?.id))">M'assigner</button>
                    </div>
                    <ul class="p-1 max-h-48 overflow-y-auto custom-scrollbar">
                      <li class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-sm text-main dark:text-white transition-colors" @click.stop="updateAssignee(null)">
                        <div class="w-6 h-6 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-secondary">
                          <Icon name="ph:user-minus" class="w-3.5 h-3.5" />
                        </div> 
                        <span class="text-secondary dark:text-gray-400">Non assigné</span>
                      </li>
                      <li v-for="member in orgMembers" :key="member.id" class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-sm text-main dark:text-white transition-colors" @click.stop="updateAssignee(member)">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden" :class="member.profile_picture ? '' : member.color">
                          <img v-if="member.profile_picture" :src="member.profile_picture.startsWith('http') ? member.profile_picture : `http://localhost:8000${member.profile_picture}`" class="w-full h-full object-cover" />
                          <span v-else>{{ member.initials }}</span>
                        </div> 
                        {{ member.name }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Tags -->
                <div class="relative">
                  <button @click="isTagDropdownOpen = !isTagDropdownOpen" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#2D2D2F] text-gray-700 dark:text-gray-300 rounded-md font-bold text-xs transition-colors hover:brightness-105">
                    <Icon name="heroicons:tag" class="w-3.5 h-3.5" /> Étiquettes
                    <span v-if="taskTags.length > 0" class="ml-1 px-1.5 py-0.5 rounded-full bg-gray-300 dark:bg-gray-700 text-[10px]">{{ taskTags.length }}</span>
                  </button>
                  <div v-if="isTagDropdownOpen" @click="isTagDropdownOpen = false" class="fixed inset-0 z-40"></div>
                  <div v-if="isTagDropdownOpen" class="absolute left-0 top-full mt-1 w-64 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                    <button @click="toggleTag(tag)" v-for="tag in tags" :key="tag.id" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskTagIds.includes(tag.id) ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800']" :style="{ color: tag.color || '#9CA3AF' }">
                      {{ tag.name }}
                      <Icon v-if="taskTagIds.includes(tag.id)" name="heroicons:check" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Priority -->
                <div class="relative">
                  <button @click="isPriorityDropdownOpen = !isPriorityDropdownOpen" :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs uppercase transition-colors', priorityConfig[taskPriority]?.colorClass || 'bg-gray-100 text-gray-700 dark:bg-[#2D2D2F] dark:text-gray-300']">
                    <Icon v-if="priorityConfig[taskPriority]?.icon" :name="priorityConfig[taskPriority]?.icon || ''" class="w-3.5 h-3.5" />
                    {{ priorityConfig[taskPriority]?.label || taskPriority || 'PRIORITÉ' }} <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5" />
                  </button>
                  <div v-if="isPriorityDropdownOpen" @click="isPriorityDropdownOpen = false" class="fixed inset-0 z-40"></div>
                  <div v-if="isPriorityDropdownOpen" class="absolute left-0 top-full mt-1 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1">
                    <button @click="updatePriority(key as string)" v-for="(config, key) in priorityConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskPriority === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', config.colorClass]">
                      <div class="flex items-center gap-1.5">
                        <Icon :name="config.icon" class="w-4 h-4" /> {{ config.label }}
                      </div>
                      <Icon v-if="taskPriority === key" name="heroicons:check" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Date -->
                <div class="relative flex items-center bg-gray-100 dark:bg-[#2D2D2F] rounded-md hover:brightness-105 transition-colors">
                  <div class="px-3 py-1.5 flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-bold text-xs">
                    <Icon name="heroicons:calendar" class="w-3.5 h-3.5" /> Échéance:
                  </div>
                  <input v-if="isEditing" v-model="editDueDate" type="date" :max="projectEndDate" class="bg-transparent border-none focus:ring-0 text-xs font-bold text-main dark:text-gray-300 cursor-pointer pr-2" />
                  <span v-else class="text-xs font-bold text-main dark:text-gray-300 pr-3">{{ formatDisplayDate(taskDueDate) }}</span>
                </div>
              </div>

              <!-- Display selected labels if any -->
              <div v-if="taskTags.length > 0" class="flex flex-wrap gap-1.5 mb-6">
                <span v-for="tag in taskTags" :key="tag.id" class="px-2 py-0.5 rounded text-[11px] font-bold uppercase shadow-sm" :style="{ backgroundColor: (tag.color || '#9CA3AF') + '20', color: tag.color || '#9CA3AF' }">
                  {{ tag.name }}
                </span>
              </div>
              
              <div class="mb-8">
                <h3 class="text-base font-bold text-main dark:text-gray-200 mb-2">Description</h3>
                <div v-if="!isEditing" @click="startEditing" class="p-4 rounded-lg neo-input bg-[#F4F5F7] dark:bg-[#1A1A1D] text-secondary dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 cursor-text transition-colors min-h-[60px] prose dark:prose-invert max-w-none focus:outline-none" v-html="taskDescription || 'Ajouter une description...'">
                </div>
                <RichTextEditor v-else v-model="editDescription" class="w-full" />
              </div>

              <!-- Sous-tâches -->
              <div class="mb-8">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-bold text-main dark:text-gray-200">Sous-tâches</h3>
                  <button @click="isCreateSubtaskModalOpen = true" class="flex items-center gap-1.5 px-3 py-1.5 bg-canvas dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-main dark:text-gray-300 rounded transition-colors text-xs font-bold shadow-sm">
                    <Icon name="heroicons:plus" class="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
                
                <div v-if="taskSubtasks && taskSubtasks.length > 0" class="flex flex-col gap-2">
                  <div v-for="sub in taskSubtasks" :key="sub.id" class="flex items-center justify-between p-3 bg-canvas dark:bg-[#1A1A1D] rounded-lg border border-form-border dark:border-gray-800 hover:border-primary dark:hover:border-blue-500 transition-colors group cursor-pointer">
                    <div class="flex items-center gap-3 overflow-hidden">
                      <div class="w-4 h-4 rounded-full border-2 border-secondary dark:border-gray-500 shrink-0 flex items-center justify-center">
                        <div v-if="sub.status === 'terminé'" class="w-2 h-2 bg-primary dark:bg-blue-500 rounded-full"></div>
                      </div>
                      <span class="text-sm text-main dark:text-gray-300 truncate font-medium group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" :class="{'line-through text-secondary dark:text-gray-500': sub.status === 'terminé'}">{{ sub.title }}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-secondary dark:text-gray-400 uppercase">{{ sub.reference_code }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-secondary dark:text-gray-500 p-4 border border-dashed border-form-border dark:border-gray-800 rounded-lg text-center bg-canvas dark:bg-transparent">
                  Aucune sous-tâche pour le moment.
                </div>
              </div>
            </div>

            <!-- Sidebar (Right) -->
            <div class="w-full md:w-[450px] lg:w-[500px] xl:w-[600px] shrink-0 bg-[#F4F5F7] dark:bg-[#1A1A1D] md:overflow-y-auto p-4 sm:p-6 custom-scrollbar border-t md:border-t-0 md:border-l border-form-border dark:border-gray-800 flex flex-col">
              
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-2 text-main dark:text-gray-200">
                  <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-5 h-5" />
                  <h3 class="text-base font-bold">Activité</h3>
                </div>
              </div>

              <!-- Add Comment Input -->
              <div class="flex flex-col gap-3 mb-8">
                <div class="relative w-full">
                  <textarea ref="commentTextarea" v-model="commentText" @input="handleCommentInput" class="w-full bg-white dark:bg-[#222224] border border-form-border dark:border-gray-700 focus:border-primary dark:focus:border-blue-500 rounded-lg p-3 text-sm text-main dark:text-gray-200 focus:outline-none resize-none shadow-sm transition-colors" rows="3" placeholder="Écrivez un commentaire..."></textarea>
                  
                  <!-- Mention Dropdown -->
                  <div v-if="showMentionDropdown" class="absolute bottom-full left-0 mb-1 w-full bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col max-h-48">
                    <ul class="p-1 overflow-y-auto custom-scrollbar">
                      <li v-for="user in filteredMentionUsers" :key="user.id" class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-sm text-main dark:text-white transition-colors" @click.stop="selectMention(user)">
                        <div :class="['w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden', user.profile_picture ? '' : user.color]">
                          <img v-if="user.profile_picture" :src="user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`" class="w-full h-full object-cover" />
                          <span v-else>{{ user.initials }}</span>
                        </div> 
                        <span class="truncate">{{ user.name }}</span>
                      </li>
                      <li v-if="filteredMentionUsers.length === 0" class="px-2 py-1.5 text-xs text-secondary text-center italic">
                        Aucun membre trouvé
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="flex justify-end">
                  <button @click="sendComment" class="px-4 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-semibold shadow-sm">
                    Envoyer
                  </button>
                </div>
              </div>

              <!-- Comments List -->
              <div v-if="commentaires && commentaires.length > 0" class="flex flex-col gap-5">
                <div v-for="comment in commentaires" :key="comment.id" class="flex gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-600 shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm mt-0.5">
                    {{ (comment as any).user?.name ? (comment as any).user.name.substring(0, 2).toUpperCase() : 'U' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-baseline gap-2 mb-1">
                      <span class="text-sm font-bold text-main dark:text-gray-200">{{ (comment as any).user?.name || 'Utilisateur' }}</span>
                      <span class="text-xs text-secondary dark:text-gray-500">{{ comment.created_at ? formatDisplayDate(comment.created_at) : '' }}</span>
                    </div>
                    
                    <div class="bg-white dark:bg-[#222224] border border-form-border dark:border-gray-800 rounded-lg p-3 shadow-sm relative group">
                      <div v-if="user?.id && (comment.user_id === user.id || (comment as any).user?.id === user.id)" class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button @click="startEditComment(comment)" class="p-1.5 text-secondary hover:text-blue-500 dark:hover:text-blue-400 bg-gray-50 dark:bg-[#1A1A1D] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors rounded shadow-sm" title="Modifier">
                          <Icon name="heroicons:pencil" class="w-3.5 h-3.5" />
                        </button>
                        <button @click="handleDeleteComment(comment.id)" class="p-1.5 text-secondary hover:text-red-500 dark:hover:text-red-400 bg-gray-50 dark:bg-[#1A1A1D] hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors rounded shadow-sm" title="Supprimer">
                          <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div v-if="editingCommentId === comment.id">
                        <textarea v-model="editingCommentText" class="w-full bg-canvas dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded p-2 text-sm text-main dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 resize-none" rows="2"></textarea>
                        <div class="flex items-center gap-2 mt-2">
                          <button @click="saveEditComment" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors shadow-sm">Enregistrer</button>
                          <button @click="cancelEditComment" class="px-3 py-1 text-xs font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 transition-colors">Annuler</button>
                        </div>
                      </div>
                      <p v-else class="text-sm text-main dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words" v-html="renderCommentContent(comment.content)"></p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-secondary dark:text-gray-500 text-center py-4 border border-dashed border-form-border dark:border-gray-800 rounded-lg">
                Aucun commentaire pour le moment.
              </div>
            </div>
          </div>
  </div>
      <CreateTaskModal
        :is-open="isCreateSubtaskModalOpen"
        :parent-task-id="(route.params.id as string)"
        :projet-id="taskProjetId"
        :create-task="handleCreateSubtaskSubmit"
        @close="isCreateSubtaskModalOpen = false"
      />
</template>


