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
const { goBack: smartBack } = useSmartBack()
const goBack = () => {
  smartBack(`/organization/${route.params.org_id}/workspace/${route.params.workspace_id}/tasks`)
}




const { commentaires, getCommentaires, createCommentaire, updateCommentaire, deleteCommentaire, isLoading: commentsLoading, error: commentsError } = useCommentaire()
const { getTask, updateTask, getTasks, createTask, deleteTask, uploadBanner, createChecklist, deleteChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem, uploadAttachment, deleteAttachment } = useTasks()
const { getProjet } = useProjets()
const { tags, getTags, createTag, updateTag: apiUpdateTag } = useTags()
const { user } = useAuth()
const { addToast } = useToast()
const { activeOrganization } = useOrganizations()
const { activeWorkspace } = useWorkspaces()
const { $api } = useNuxtApp()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const backendBaseUrl = config.public.apiBase ? config.public.apiBase.replace(/\/api\/?$/, '') : 'http://localhost:8000'
const storageBaseUrl = `${backendBaseUrl}/storage/`

const activeTab = ref('comments')

const isAssigneeDropdownOpen = ref(false)
const taskAssignee = ref<any>(null)
const orgMembers = ref<any[]>([])
const avatarColors = ['bg-primary', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500']

const fetchOrgMembers = async () => {
  if (!activeOrganization.value) return
  try {
    const res = await $api<any>(`/organizations/${activeOrganization.value.id}/members`, { method: 'GET' })
    const members = res.data?.data ?? res.data ?? []
    orgMembers.value = members.map((m: any, i: number) => ({
      id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      initials: (m.last_name || '?').charAt(0).toUpperCase() + (m.first_name || '').charAt(0).toUpperCase(),
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
const editStatus = ref('')
const editPriority = ref('')
const editAssigneeId = ref<number | string | null>(null)
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
const taskChecklists = ref<any[]>([])
const taskAttachments = ref<any[]>([])
const taskBannerImage = ref('')
const taskCreator = ref<any>(null)

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
      taskProjetReference.value = task.projet?.reference_code || task.projet?.name || (task.projet_id ? `PROJ-${task.projet_id}` : '')
      
      if (task.assignee) {
        taskAssignee.value = {
          id: task.assignee.id,
          first_name: task.assignee.first_name,
          last_name: task.assignee.last_name,
          initials: (task.assignee.last_name || '?').charAt(0).toUpperCase() + (task.assignee.first_name || '').charAt(0).toUpperCase(),
          color: 'bg-primary',
          profile_picture: task.assignee.profile_picture || null
        }
      } else {
        taskAssignee.value = null
      }
      
      if (task.projet?.end_date) {
        projectEndDate.value = String(task.projet.end_date).split('T')[0] || ''
      } else {
        projectEndDate.value = ''
      }
      
      taskSubtasks.value = task.sub_tasks || []
      taskChecklists.value = task.checklists || []
      taskAttachments.value = task.attachments || []
      taskCreator.value = (task as any).user || null
    }
  } catch (e) {
    console.error(e)
  }
}

const startEditing = () => {
  editTitle.value = taskTitle.value
  editDescription.value = taskDescription.value
  editDueDate.value = taskDueDate.value && taskDueDate.value !== 'Aucune' ? (String(taskDueDate.value).split('T')[0] || '') : ''
  editStatus.value = taskStatus.value
  editPriority.value = taskPriority.value
  editAssigneeId.value = taskAssignee.value?.id || null
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
    if (editStatus.value) payload.status = editStatus.value
    if (editPriority.value) payload.priority = editPriority.value
    payload.assignee_id = editAssigneeId.value
    await updateTask((route.params.id as string), payload)
    taskTitle.value = editTitle.value
    taskDescription.value = editDescription.value
    taskDueDate.value = editDueDate.value || 'Aucune'
    taskStatus.value = editStatus.value
    taskPriority.value = editPriority.value
    if (editAssigneeId.value) {
      taskAssignee.value = orgMembers.value.find(m => m.id === editAssigneeId.value) || null
    } else {
      taskAssignee.value = null
    }
    isEditing.value = false
    addToast({ title: 'Tâche modifiée', message: 'Les modifications ont été enregistrées.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible d’enregistrer la tâche.', type: 'error' })
  }
}

const cancelEdit = () => {
  isEditing.value = false
}



const isConfirmModalOpen = ref(false)
const confirmModalTitle = ref('')
const confirmModalMessage = ref('')
const pendingDeleteAction = ref<(() => void) | null>(null)

const handleDelete = () => {
  if (!(route.params.id as string)) return
  
  confirmModalTitle.value = 'Supprimer la tâche'
  confirmModalMessage.value = 'Voulez-vous vraiment supprimer cette tâche ?'
  
  pendingDeleteAction.value = () => {
    isConfirmModalOpen.value = false
    const taskId = route.params.id as string
    
    let isCancelled = false
    
    const timeoutId = setTimeout(async () => {
      if (isCancelled) return
      try {
        await deleteTask(taskId)
      } catch (e) {
        addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer la tâche.' })
      }
    }, 5000)

    addToast({
      type: 'success',
      title: 'Tâche supprimée',
      message: 'La suppression sera définitive dans 5 secondes.',
      duration: 5000,
      action: {
        label: 'Annuler',
        onClick: () => {
          isCancelled = true
          clearTimeout(timeoutId)
          addToast({ type: 'info', title: 'Annulé', message: 'La suppression a été annulée.' })
        }
      }
    })
    goBack()
  }
  isConfirmModalOpen.value = true
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

const labelSearchQuery = ref('')
const filteredLabels = computed(() => {
  if (!labelSearchQuery.value) return tags.value
  const q = labelSearchQuery.value.toLowerCase()
  return tags.value.filter(t => t.name.toLowerCase().includes(q))
})

const isCreatingLabel = ref(false)
const editingLabelId = ref<number | string | null>(null)
const labelFormName = ref('')
const labelFormColor = ref('#10B981')
const defaultColors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#64748B', '#06B6D4', '#EAB308']

const openCreateLabel = () => {
    isCreatingLabel.value = true
    editingLabelId.value = null
    labelFormName.value = ''
    labelFormColor.value = defaultColors[0] || '#10B981'
}

const openEditLabel = (label: any) => {
    isCreatingLabel.value = true
    editingLabelId.value = label.id
    labelFormName.value = label.name
    labelFormColor.value = label.color || defaultColors[0]
}

const saveLabelForm = async () => {
    if (!labelFormName.value.trim()) return
    try {
        if (editingLabelId.value) {
            await apiUpdateTag(editingLabelId.value, { name: labelFormName.value, color: labelFormColor.value })
            addToast({ title: 'Étiquette modifiée', message: 'L\'étiquette a été mise à jour.', type: 'success' })
        } else {
            await createTag({ name: labelFormName.value, color: labelFormColor.value })
            addToast({ title: 'Étiquette créée', message: 'La nouvelle étiquette a été ajoutée.', type: 'success' })
        }
        isCreatingLabel.value = false
    } catch (e) {
        addToast({ title: 'Erreur', message: 'Impossible de sauvegarder l\'étiquette.', type: 'error' })
    }
}
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
  return orgMembers.value.filter(u => ((u.last_name || '') + ' ' + (u.first_name || '')).toLowerCase().includes(q))
})

const isOverdue = computed(() => {
  if (!taskDueDate.value || taskDueDate.value === 'Aucune') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(taskDueDate.value)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
})

const handleCommentInput = () => {
  if (!commentTextarea.value) return
  const cursorPosition = commentTextarea.value.selectionStart
  const textBeforeCursor = commentText.value.substring(0, cursorPosition)
  
  const match = textBeforeCursor.match(/@([a-zA-Z0-9_\-]* ?[a-zA-Z0-9_\-]*)$/)
  
  if (match && match[1] !== undefined && match[1].length < 25) {
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
  
  commentText.value = `${textBeforeMention}@${(member.last_name || '') + ' ' + (member.first_name || '').trim()} ${textAfterCursor}`
  
  if (!activeMentions.value.includes(member.id)) {
    activeMentions.value.push(member.id)
  }
  
  showMentionDropdown.value = false
  mentionSearchQuery.value = ''
  
  setTimeout(() => {
    if (commentTextarea.value) {
      commentTextarea.value.focus()
      const insertedText = (member.last_name || '') + ' ' + (member.first_name || '').trim()
      const newPos = mentionCursorPosition.value + insertedText.length + 2
      commentTextarea.value.setSelectionRange(newPos, newPos)
    }
  }, 0)
}

const renderCommentContent = (content: string) => {
  if (!content) return ''
  let html = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  const sortedMembers = [...orgMembers.value].sort((a, b) => {
    const lenA = ((a.last_name || '') + ' ' + (a.first_name || '')).length
    const lenB = ((b.last_name || '') + ' ' + (b.first_name || '')).length
    return lenB - lenA
  })
  
  for (const member of sortedMembers) {
    const regex = new RegExp(`@${member.last_name + ' ' + member.first_name}\\b`, 'gi')
    html = html.replace(regex, `<span class="text-primary font-bold bg-primary/10 px-1 rounded cursor-pointer">@${member.last_name + ' ' + member.first_name}</span>`)
  }
  
  return html
}


const timeAgo = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return `il y a ${Math.floor(interval)} ans`
  interval = seconds / 2592000
  if (interval > 1) return `il y a ${Math.floor(interval)} mois`
  interval = seconds / 86400
  if (interval > 1) return `il y a ${Math.floor(interval)} jours`
  interval = seconds / 3600
  if (interval > 1) return `il y a ${Math.floor(interval)} heures`
  interval = seconds / 60
  if (interval > 1) return `il y a ${Math.floor(interval)} minutes`
  return `à l'instant`
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
      colorClass = 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-primary'
    } else if (lowerCol === 'terminé' || lowerCol === 'done') {
      colorClass = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500'
    }
    
    config[col] = {
      label: col.toUpperCase(),
      colorClass,
      style
    }
  })
  
  if (taskBoardColumn.value && !config[taskBoardColumn.value]) {
    config[taskBoardColumn.value] = {
      label: taskBoardColumn.value.toUpperCase(),
      colorClass: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
  }
  
  return config
})

const priorityConfig: Record<string, { label: string; colorClass: string; icon: string }> = {
  faible: { label: 'FAIBLE', colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: 'ph:caret-down-bold' },
  moyen: { label: 'MOYEN', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-primary', icon: 'ph:equals-bold' },
  'élevé': { label: 'ÉLEVÉ', icon: 'heroicons:chevron-double-up', colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
}

const toggleTaskStatus = async () => {
  if (!(route.params.id as string)) return
  const newStatus = taskStatus.value === 'done' ? 'not done' : 'done'
  try {
    await updateTask((route.params.id as string), { status: newStatus })
    taskStatus.value = newStatus
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

const toggleSubtaskStatus = async (sub: any) => {
  const oldStatus = sub.status
  const newStatus = oldStatus === 'done' ? 'todo' : 'done'
  sub.status = newStatus // Optimistic update
  try {
    await updateTask(sub.id, { status: newStatus })
  } catch (err) {
    sub.status = oldStatus // Revert on failure
    addToast({ title: 'Erreur', message: 'Impossible de modifier le statut de la sous-tâche.', type: 'error' })
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
    if (commentText.value.includes(`@${member.first_name}`) && !extractedMentions.includes(member.id)) {
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

// --- Checklists ---
const isAddingChecklist = ref(false)
const newChecklistTitle = ref('')

const handleAddChecklist = async () => {
  if (!(route.params.id as string) || !newChecklistTitle.value.trim()) return
  try {
    const checklist = await createChecklist((route.params.id as string), newChecklistTitle.value.trim())
    checklist.items = []
    taskChecklists.value.push(checklist)
    newChecklistTitle.value = ''
    isAddingChecklist.value = false
    addToast({ title: 'Checklist créée', message: 'La checklist a été ajoutée avec succès.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de créer la checklist.', type: 'error' })
  }
}

const handleDeleteChecklist = async (checklistId: string | number) => {
  if (confirm('Voulez-vous vraiment supprimer cette checklist ?')) {
    try {
      await deleteChecklist(checklistId)
      taskChecklists.value = taskChecklists.value.filter(c => c.id !== checklistId)
      addToast({ title: 'Checklist supprimée', message: 'La checklist a été supprimée avec succès.', type: 'success' })
    } catch (err) {
      addToast({ title: 'Erreur', message: 'Impossible de supprimer la checklist.', type: 'error' })
    }
  }
}

const newChecklistItemContent = ref<Record<string, string>>({})

const handleAddChecklistItem = async (checklistId: string | number) => {
  const content = newChecklistItemContent.value[checklistId]
  if (!content || !content.trim()) return
  try {
    const item = await createChecklistItem(checklistId, content.trim())
    const checklist = taskChecklists.value.find(c => c.id === checklistId)
    if (checklist) checklist.items.push(item)
    newChecklistItemContent.value[checklistId] = ''
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible d\'ajouter l\'élément.', type: 'error' })
  }
}

const toggleChecklistItem = async (item: any) => {
  if (item._isUpdating) return
  item._isUpdating = true

  const oldStatus = item.is_done
  const newStatus = !oldStatus

  // Optimistic update
  item.is_done = newStatus

  try {
    await updateChecklistItem(item.id, { is_done: newStatus })
  } catch (err) {
    item.is_done = oldStatus // Revert on error
    addToast({ title: 'Erreur', message: 'Impossible de modifier l\'état.', type: 'error' })
  } finally {
    item._isUpdating = false
  }
}

const handleDeleteChecklistItem = async (checklist: any, itemId: string | number) => {
  try {
    await deleteChecklistItem(itemId)
    checklist.items = checklist.items.filter((i: any) => i.id !== itemId)
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de supprimer l\'élément.', type: 'error' })
  }
}

// --- Attachments ---
const attachmentInput = ref<HTMLInputElement | null>(null)

const triggerAttachmentUpload = () => {
  attachmentInput.value?.click()
}

const handleAttachmentUploadForm = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0 && (route.params.id as string)) {
    const file = target.files[0] as File
    if (!file) return
    try {
      const attachment = await uploadAttachment((route.params.id as string), file)
      taskAttachments.value.push(attachment)
      addToast({ type: 'success', title: 'Fichier ajouté', message: 'Le fichier a été ajouté avec succès.' })
    } catch (e: any) {
      if (e.status === 413 || e.response?.status === 413) {
        addToast({ type: 'error', title: 'Fichier trop volumineux', message: 'La taille du fichier dépasse la limite autorisée.' })
      } else {
        addToast({ type: 'error', title: 'Erreur', message: 'Impossible de télécharger le fichier.' })
      }
    }
  }
}

const handleDeleteAttachmentFile = async (attachmentId: string | number) => {
  if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
    try {
      await deleteAttachment(attachmentId)
      taskAttachments.value = taskAttachments.value.filter(a => a.id !== attachmentId)
      addToast({ title: 'Fichier supprimé', message: 'Le fichier a été supprimé avec succès.', type: 'success' })
    } catch (err) {
      addToast({ title: 'Erreur', message: 'Impossible de supprimer le fichier.', type: 'error' })
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
  taskChecklists.value = []
  taskAttachments.value = []
  taskCreator.value = null
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
    getTags()
    await getCommentaires(newTaskId)
    if (route.query.edit === 'true') {
      startEditing()
    }
  }
}, { immediate: true })

watch(() => activeOrganization.value, (newOrg) => {
  if (newOrg) {
    fetchOrgMembers()
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col w-full px-4 md:px-6 lg:px-8 font-sans pb-12">
    <!-- Top navigation -->
    <div class="flex gap-2 mb-6 shrink-0">
      <button @click="goBack" class="w-10 h-10 rounded-full border-[3px] border-white dark:border-[#2A2A2D] flex items-center justify-center bg-[#1D1D1D] text-white shadow-md hover:scale-105 transition-all" title="Retour">
        <Icon name="heroicons:chevron-left" class="w-5 h-5 font-bold" />
      </button>
    </div>

    <!-- Banner Image (Kept functionality but not forced blue background) -->
    <div v-if="taskBannerImage" class="w-full h-48 sm:h-64 rounded-2xl mb-8 relative group shrink-0 shadow-sm border border-black/5 dark:border-white/5">
      <img :src="taskBannerImage" class="w-full h-full object-cover rounded-2xl" alt="Task banner" />
      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-2xl">
        <button @click="triggerFileInput" class="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm">
          <Icon name="heroicons:camera" class="w-5 h-5" /> Changer la couverture
        </button>
        <button @click="removeBanner" class="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm">
          <Icon name="heroicons:trash" class="w-5 h-5" /> Supprimer
        </button>
      </div>
    </div>
    <div v-else class="w-full h-16 sm:h-24 shrink-0 rounded-2xl mb-8 bg-white dark:bg-[#222224] border border-dashed border-form-border dark:border-gray-700 flex items-center justify-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2d] transition-colors" @click="triggerFileInput">
      <div class="flex items-center gap-2 text-secondary dark:text-gray-500 group-hover:text-main dark:group-hover:text-gray-300 transition-colors">
        <Icon name="heroicons:photo" class="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
        <span class="text-sm font-medium">Ajouter une couverture</span>
      </div>
    </div>
    <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />

    <!-- Task Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
      <div>
        <div class="text-primary dark:text-[#0891b2] text-xs font-bold tracking-widest mb-2 flex items-center gap-2 uppercase">
          <NuxtLink v-if="taskProjetId" :to="`/organization/${route.params.org_id || activeOrganization?.id}/workspace/${route.params.workspace_id || activeWorkspace?.id}/projects/${taskProjetId}`" class="hover:underline cursor-pointer">{{ taskProjetReference }}</NuxtLink>
          <span v-if="taskProjetId">/</span>
          <span>{{ taskReference }}</span>
        </div>
        
        <h1 v-if="!isEditing" class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
          {{ taskTitle }}
        </h1>
        <input v-else v-model="editTitle" type="text" class="neo-input w-full text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white bg-transparent focus:ring-2 focus:ring-primary dark:focus:ring-primary rounded-lg py-1 px-2 -ml-2" />
      </div>
      
      <!-- Action buttons -->
      <div class="flex items-center gap-3 shrink-0">
        <button v-if="!isEditing" @click="startEditing" class="flex items-center gap-2 px-4 py-2 rounded-full border border-form-border dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Icon name="heroicons:pencil" class="w-4 h-4" /> Modifier
        </button>
        <button v-if="isEditing" @click="saveEdit" class="flex items-center gap-2 px-4 py-2 rounded-full border border-transparent bg-cyan-600 text-white text-sm font-bold shadow-sm hover:brightness-110 transition-colors">
          <Icon name="heroicons:check" class="w-4 h-4" /> Enregistrer
        </button>
        <button v-if="isEditing" @click="cancelEdit" class="flex items-center gap-2 px-4 py-2 rounded-full border border-form-border dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Icon name="heroicons:x-mark" class="w-4 h-4" /> Annuler
        </button>
        <button v-if="!isEditing" @click="handleDelete" class="w-10 h-10 rounded-full border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Supprimer">
          <Icon name="heroicons:trash" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Metadata Row -->
    <div class="flex flex-wrap items-center gap-2 mb-4 shrink-0">
      <!-- Status Toggle -->
      <button @click="toggleTaskStatus" :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs uppercase transition-colors hover:brightness-105', taskStatus === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-[#2D2D2F] dark:text-gray-300']">
        <Icon :name="taskStatus === 'done' ? 'ph:check-circle-fill' : 'ph:circle'" class="w-4 h-4" />
        {{ taskStatus === 'done' ? 'Terminé' : 'Pas terminé' }}
      </button>

      <!-- Status/Column -->
      <div class="relative">
        <button @click="isBoardColumnDropdownOpen = !isBoardColumnDropdownOpen" :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs uppercase transition-colors hover:brightness-105', statusConfig[taskBoardColumn]?.colorClass || 'bg-gray-100 text-gray-700 dark:bg-[#2D2D2F] dark:text-gray-300']" :style="statusConfig[taskBoardColumn]?.style">
          {{ statusConfig[taskBoardColumn]?.label || taskBoardColumn || 'À FAIRE' }} <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5" />
        </button>
        <div v-if="isBoardColumnDropdownOpen" @click="isBoardColumnDropdownOpen = false" class="fixed inset-0 z-40"></div>
        <div v-if="isBoardColumnDropdownOpen" class="absolute left-0 top-full mt-1 w-56 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
          <button @click="updateBoardColumn(col as string)" v-for="col in kanbanColumns" :key="col" class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center justify-between text-sm transition-colors">
            <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm', statusConfig[col]?.colorClass]" :style="statusConfig[col]?.style">
              {{ statusConfig[col]?.label || col }}
            </span>
            <Icon v-if="taskBoardColumn === col" name="heroicons:check" class="w-4 h-4 text-primary dark:text-primary" />
          </button>
        </div>
      </div>

      <!-- Assignee -->
      <div class="relative">
        <button @click="isAssigneeDropdownOpen = !isAssigneeDropdownOpen" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#2D2D2F] text-gray-700 dark:text-gray-300 rounded-md font-bold text-xs transition-colors hover:brightness-105">
          <div v-if="taskAssignee" class="flex items-center gap-1.5">
            <div v-if="taskAssignee.profile_picture" class="w-4 h-4 rounded-full overflow-hidden">
              <img :src="taskAssignee.profile_picture.startsWith('http') ? taskAssignee.profile_picture : backendBaseUrl + taskAssignee.profile_picture" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm">
              {{ (taskAssignee.last_name || '').charAt(0).toUpperCase() }}{{ (taskAssignee.first_name || '').charAt(0).toUpperCase() || 'U' }}
            </div>
            <span class="truncate max-w-[100px]">{{ taskAssignee.last_name + ' ' + taskAssignee.first_name }}</span>
          </div>
          <div v-else class="flex items-center gap-1.5">
            <Icon name="heroicons:user" class="w-3.5 h-3.5" />
            <span>Assigner</span>
          </div>
        </button>
        <div v-if="isAssigneeDropdownOpen" @click="isAssigneeDropdownOpen = false" class="fixed inset-0 z-40"></div>
        <div v-if="isAssigneeDropdownOpen" class="absolute left-0 top-full mt-1 w-56 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col">
          <div class="p-2 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
            <p class="text-xs text-secondary font-medium px-2">Assigner à</p>
            <button class="text-cyan-600 dark:text-blue-400 hover:underline text-xs pr-2" @click.stop="updateAssignee(orgMembers.find(m => m.id === user?.id))">M'assigner</button>
          </div>
          <ul class="p-1 max-h-48 overflow-y-auto custom-scrollbar">
            <li class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-sm text-main dark:text-white transition-colors" @click.stop="updateAssignee(null)">
              <div class="w-6 h-6 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-secondary">
                <Icon name="ph:user-minus" class="w-3.5 h-3.5" />
              </div> 
              <span class="text-secondary dark:text-gray-400">Non assigné</span>
            </li>
            <li v-for="member in orgMembers" :key="member.id" class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-sm text-main dark:text-white transition-colors" @click.stop="updateAssignee(member)">
              <div v-if="member?.profile_picture" class="w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-sm border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <img :src="member.profile_picture.startsWith('http') ? member.profile_picture : backendBaseUrl + member.profile_picture" alt="Avatar" class="w-full h-full object-cover" />
              </div> 
              <div v-else class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm border border-transparent">
                {{ (member?.last_name || '').charAt(0).toUpperCase() }}{{ (member?.first_name || '').charAt(0).toUpperCase() || 'U' }}
              </div>
              {{ member.last_name + ' ' + member.first_name }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Labels -->
      <div class="relative">
        <button @click="isTagDropdownOpen = !isTagDropdownOpen" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#2D2D2F] text-gray-700 dark:text-gray-300 rounded-md font-bold text-xs transition-colors hover:brightness-105">
          <Icon name="heroicons:tag" class="w-3.5 h-3.5" /> Étiquettes
          <span v-if="taskTags.length > 0" class="ml-1 px-1.5 py-0.5 rounded-full bg-gray-300 dark:bg-gray-700 text-[10px]">{{ taskTags.length }}</span>
        </button>
        <div v-if="isTagDropdownOpen" @click="isTagDropdownOpen = false" class="fixed inset-0 z-40"></div>
        <div v-if="isTagDropdownOpen" class="absolute left-0 top-full mt-1 w-64 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col">
          <div class="p-3 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
            <button v-if="isCreatingLabel" @click="isCreatingLabel = false" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <Icon name="heroicons:chevron-left" class="w-4 h-4 text-secondary" />
            </button>
            <p class="text-sm font-bold text-main dark:text-gray-200 flex-1 text-center">{{ isCreatingLabel ? (editingLabelId ? 'Modifier l\'étiquette' : 'Créer une étiquette') : 'Étiquettes' }}</p>
            <button @click="isTagDropdownOpen = false" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <Icon name="heroicons:x-mark" class="w-4 h-4 text-secondary" />
            </button>
          </div>
          <div v-if="!isCreatingLabel" class="flex flex-col">
            <div class="p-2">
              <input v-model="labelSearchQuery" type="text" class="w-full bg-canvas dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded p-1.5 text-xs text-main dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-primary" placeholder="Rechercher une étiquette..." />
            </div>
            <div class="max-h-60 overflow-y-auto px-2 pb-2 custom-scrollbar flex flex-col gap-1">
              <div v-for="tag in filteredLabels" :key="tag.id" class="flex items-center gap-2 group/label">
                <button @click="toggleTag(tag)" class="flex-1 flex items-center gap-2 px-2 py-1.5 rounded transition-colors text-left font-bold text-xs uppercase" :style="{ backgroundColor: (tag.color || '#10B981') + '33', color: tag.color || '#10B981' }">
                  <Icon v-if="taskTagIds.includes(tag.id)" name="heroicons:check" class="w-4 h-4" />
                  <span v-else class="w-4"></span>
                  <span class="flex-1 truncate">{{ tag.name }}</span>
                </button>
                <button v-if="!tag.is_default" @click.stop="openEditLabel(tag)" class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-secondary transition-colors" title="Modifier">
                  <Icon name="heroicons:pencil" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div class="p-2 border-t border-form-border dark:border-gray-800">
              <button @click="openCreateLabel" class="w-full py-1.5 bg-canvas dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-bold text-main dark:text-gray-300 transition-colors">
                Créer une étiquette
              </button>
            </div>
          </div>
          <div v-else class="p-3 flex flex-col gap-4">
            <div class="w-full py-2 px-3 rounded font-bold text-xs uppercase flex items-center gap-2 shadow-sm" :style="{ backgroundColor: labelFormColor + '33', color: labelFormColor }"><span class="w-4"></span> {{ labelFormName || 'APERÇU' }}</div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-secondary dark:text-gray-500">Titre</label>
              <input v-model="labelFormName" type="text" class="w-full bg-canvas dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded p-1.5 text-xs text-main dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-primary" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-secondary dark:text-gray-500">Couleur</label>
              <div class="grid grid-cols-4 gap-1.5">
                <button v-for="color in defaultColors" :key="color" @click="labelFormColor = color" class="h-8 rounded transition-all flex items-center justify-center hover:brightness-110" :style="{ backgroundColor: color }">
                  <Icon v-if="labelFormColor === color" name="heroicons:check" class="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <div class="flex gap-2 mt-2">
              <button @click="isCreatingLabel = false" class="flex-1 py-1.5 rounded bg-gray-200 dark:bg-gray-800 text-main dark:text-gray-300 text-xs font-bold transition-colors">Annuler</button>
              <button @click="saveLabelForm" class="flex-1 py-1.5 rounded bg-cyan-600 text-white text-xs font-bold transition-colors shadow-sm">Enregistrer</button>
            </div>
          </div>
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
      <div :class="['relative flex items-center rounded-md hover:brightness-105 transition-colors', isOverdue && !isEditing ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-[#2D2D2F]']">
        <div :class="['px-3 py-1.5 flex items-center gap-1.5 font-bold text-xs', isOverdue && !isEditing ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300']">
          <Icon name="heroicons:calendar" class="w-3.5 h-3.5" /> Échéance:
        </div>
        <input v-if="isEditing" v-model="editDueDate" type="date" :max="projectEndDate" class="bg-transparent border-none focus:ring-0 text-xs font-bold text-main dark:text-gray-300 cursor-pointer pr-2" />
        <span v-else :class="['text-xs font-bold pr-3 uppercase tracking-wider', isOverdue ? 'text-red-600 dark:text-red-400' : 'text-main dark:text-gray-300']">{{ formatDisplayDate(taskDueDate) }}</span>
      </div>

    </div>

    <!-- Display selected labels if any (Next Row) -->
    <div v-if="taskTags.length > 0" class="flex flex-wrap gap-2 mb-8 shrink-0">
      <span v-for="tag in taskTags" :key="tag.id" class="px-3 py-1 rounded-md text-[13px] font-black uppercase shadow-sm" :style="{ backgroundColor: (tag.color || '#9CA3AF') + '33', color: tag.color || '#9CA3AF' }">
        {{ tag.name }}
      </span>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 pb-10">
      
      <!-- Left Column -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        
        <!-- Description -->
        <div class="border border-black/5 dark:border-white/5 rounded-2xl p-6 bg-white dark:bg-[#222224] shadow-sm">
          <h3 class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Description</h3>
          <div v-if="!isEditing" @click="startEditing" class="text-main dark:text-gray-300 text-sm leading-relaxed prose dark:prose-invert max-w-none cursor-text hover:bg-black/5 dark:hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors min-h-[60px]" v-html="taskDescription || 'Aucune description.'"></div>
          <RichTextEditor v-else v-model="editDescription" class="w-full shadow-inner" />
        </div>

        <!-- Sous-tâches -->
        <div class="border border-black/5 dark:border-white/5 rounded-2xl p-6 bg-white dark:bg-[#222224] shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Sous-tâches</h3>
            <button @click="isCreateSubtaskModalOpen = true" class="text-cyan-600 dark:text-[#0891b2] text-[11px] font-bold flex items-center gap-1 hover:opacity-80 transition-opacity tracking-wider uppercase">
              <Icon name="heroicons:plus" class="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          
          <div v-if="taskSubtasks && taskSubtasks.length > 0" class="flex flex-col gap-3">
            <div v-for="sub in taskSubtasks" :key="sub.id" class="flex items-center justify-between p-3.5 border border-[#e4e1db] dark:border-gray-800 rounded-xl bg-transparent hover:border-primary dark:hover:border-gray-600 transition-colors group cursor-pointer">
              <div class="flex items-center gap-3 overflow-hidden">
                <div @click.stop="toggleSubtaskStatus(sub)" class="w-4 h-4 rounded-full border-2 shrink-0 cursor-pointer transition-colors" :class="[sub.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-gray-300 dark:border-gray-600 group-hover:border-primary']"></div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" :class="{'line-through opacity-50': sub.status === 'done'}">{{ sub.title }}</span>
              </div>
              <div class="flex items-center gap-3 shrink-0 pl-2">
                 <span :class="[
                   'px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider',
                   sub.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-[#fef3c7] text-[#d97706] dark:bg-yellow-900/40 dark:text-yellow-500'
                 ]">{{ sub.status === 'done' ? 'Terminé' : 'Pas terminé' }}</span>
                 <span class="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-wider">{{ sub.reference_code }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-secondary dark:text-gray-500 text-center py-6 opacity-70 italic">
            Aucune sous-tâche.
          </div>
        </div>

        <!-- Pièces jointes -->
        <div class="border border-black/5 dark:border-white/5 rounded-2xl p-6 bg-white dark:bg-[#222224] shadow-sm">
          <input type="file" ref="attachmentInput" class="hidden" @change="handleAttachmentUploadForm" />
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pièces jointes</h3>
            <button @click="triggerAttachmentUpload" class="text-cyan-600 dark:text-[#0891b2] text-[11px] font-bold flex items-center gap-1 hover:opacity-80 transition-opacity tracking-wider uppercase">
              <Icon name="heroicons:plus" class="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="attachment in taskAttachments" :key="attachment.id" class="flex items-center gap-3 p-3 border border-[#e4e1db] dark:border-gray-800 rounded-xl bg-transparent group relative hover:border-primary dark:hover:border-gray-600 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#2D2D2F] flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700 overflow-hidden">
                <img v-if="attachment.mime_type?.startsWith('image/')" :src="attachment.file_path.startsWith('http') ? attachment.file_path : `${storageBaseUrl}${attachment.file_path.replace(/^\//, '')}`" class="w-full h-full object-cover" />
                <Icon v-else name="ph:file" class="w-5 h-5 text-secondary" />
              </div>
              <div class="flex flex-col flex-1 overflow-hidden pr-6">
                <a :href="attachment.file_path.startsWith('http') ? attachment.file_path : `${storageBaseUrl}${attachment.file_path.replace(/^\//, '')}`" target="_blank" class="text-sm font-bold text-gray-700 dark:text-gray-300 truncate hover:underline" :title="attachment.file_name">{{ attachment.file_name }}</a>
                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{{ new Date(attachment.created_at).toLocaleDateString() }}</span>
              </div>
              <button @click="handleDeleteAttachmentFile(attachment.id)" class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-secondary opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all">
                <Icon name="heroicons:trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-if="taskAttachments.length === 0" class="text-sm text-secondary dark:text-gray-500 text-center py-6 opacity-70 italic">
            Aucun fichier joint.
          </div>
        </div>

        <!-- Checklists -->
        <div class="border border-black/5 dark:border-white/5 rounded-2xl p-6 bg-white dark:bg-[#222224] shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Checklists</h3>
            <button v-if="!isAddingChecklist" @click="isAddingChecklist = true" class="text-cyan-600 dark:text-[#0891b2] text-[11px] font-bold flex items-center gap-1 hover:opacity-80 transition-opacity tracking-wider uppercase">
              <Icon name="heroicons:plus" class="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          
          <div v-if="isAddingChecklist" class="mb-6 p-4 rounded-xl border border-[#e4e1db] dark:border-gray-800 flex flex-col gap-3">
            <input v-model="newChecklistTitle" type="text" placeholder="Titre de la checklist..." class="w-full bg-transparent border-b border-form-border dark:border-gray-700 p-2 text-sm text-main dark:text-gray-200 focus:outline-none focus:border-primary" @keydown.enter="handleAddChecklist" />
            <div class="flex gap-2 justify-end">
              <button @click="isAddingChecklist = false" class="px-4 py-1.5 rounded-full text-secondary dark:text-gray-400 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Annuler</button>
              <button @click="handleAddChecklist" class="px-4 py-1.5 rounded-full bg-cyan-600 text-white text-xs font-bold shadow-sm hover:brightness-110 transition-colors">Enregistrer</button>
            </div>
          </div>

          <div v-if="taskChecklists.length > 0" class="flex flex-col gap-6">
            <div v-for="checklist in taskChecklists" :key="checklist.id" class="flex flex-col gap-3">
              <div class="flex justify-between items-center group/checklist">
                <h4 class="font-bold text-sm text-gray-900 dark:text-gray-200">{{ checklist.title }}</h4>
                <button @click="handleDeleteChecklist(checklist.id)" class="text-secondary opacity-0 group-hover/checklist:opacity-100 hover:text-red-500 transition-opacity p-1">
                  <Icon name="heroicons:trash" class="w-4 h-4" />
                </button>
              </div>
              
              <!-- Progress bar -->
              <div v-if="checklist.items && checklist.items.length > 0" class="flex items-center gap-3 mb-1">
                <span class="text-[10px] font-bold text-secondary">{{ Math.round((checklist.items.filter((i: any) => i.is_done).length / checklist.items.length) * 100) }}%</span>
                <div class="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div class="h-full bg-primary transition-all duration-300" :style="{ width: `${(checklist.items.filter((i: any) => i.is_done).length / checklist.items.length) * 100}%` }"></div>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <div v-for="item in checklist.items" :key="item.id" class="flex items-center gap-3 group/item p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div @click="toggleChecklistItem(item)" class="w-4 h-4 rounded-md border border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-white dark:bg-[#222224]">
                    <Icon v-if="item.is_done" name="heroicons:check" class="w-3 h-3 text-primary" />
                  </div>
                  <span class="text-sm flex-1 text-gray-700 dark:text-gray-300" :class="{'line-through text-secondary dark:text-gray-500': item.is_done}">{{ item.content }}</span>
                  <button @click="handleDeleteChecklistItem(checklist, item.id)" class="text-secondary opacity-0 group-hover/item:opacity-100 hover:text-red-500 transition-opacity p-1">
                    <Icon name="heroicons:x-mark" class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-3 mt-2 pl-1.5">
                <Icon name="heroicons:plus" class="w-4 h-4 text-gray-400" />
                <input v-model="newChecklistItemContent[checklist.id]" type="text" placeholder="Ajouter un élément..." class="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400" @keydown.enter="handleAddChecklistItem(checklist.id)" />
                <button v-if="newChecklistItemContent[checklist.id]?.trim()" @click="handleAddChecklistItem(checklist.id)" class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-[10px] font-bold uppercase rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Ajouter</button>
              </div>
            </div>
          </div>
          <div v-else-if="!isAddingChecklist" class="text-sm text-secondary dark:text-gray-500 text-center py-6 opacity-70 italic">
            Aucune checklist.
          </div>
        </div>

      </div>

      <!-- Right Column -->
      <div class="lg:col-span-1">
        <div class="border border-black/5 dark:border-white/5 rounded-2xl p-6 bg-white dark:bg-[#222224] shadow-sm h-fit">
          <div class="flex items-center gap-2 mb-6">
            <Icon name="heroicons:chat-bubble-oval-left-ellipsis" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Activité</h3>
          </div>
          
          <!-- Input -->
          <div class="mb-8">
            <textarea v-model="commentText" @input="handleCommentInput" placeholder="Écrivez un commentaire..." class="w-full bg-transparent border border-[#e4e1db] dark:border-gray-700 rounded-xl p-3 text-sm focus:outline-none focus:border-primary dark:focus:border-[#0891b2] resize-none text-main dark:text-gray-200" rows="3"></textarea>
            
            <!-- Mention Dropdown -->
            <div v-if="showMentionDropdown" class="w-full bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 overflow-hidden flex flex-col max-h-48 mt-1">
              <ul class="p-1 overflow-y-auto custom-scrollbar">
                <li v-for="user in filteredMentionUsers" :key="user.id" class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-sm text-main dark:text-white transition-colors" @click.stop="selectMention(user)">
                  <div class="w-5 h-5 rounded-full overflow-hidden shrink-0 shadow-sm border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <img :src="user?.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : apiBase.replace('/api', '') + user.profile_picture) : `https://api.dicebear.com/7.x/initials/svg?seed=${(user?.last_name || '').charAt(0).toUpperCase() + (user?.first_name || '').charAt(0).toUpperCase() || 'U'}&chars=2`" alt="Avatar" class="w-full h-full object-cover" />
                  </div> 
                  <span class="truncate">{{ user.last_name + ' ' + user.first_name }}</span>
                </li>
              </ul>
            </div>

            <div class="flex justify-end mt-3">
              <button @click="sendComment" class="px-5 py-2 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:brightness-110 transition-colors shadow-sm">Envoyer</button>
            </div>
          </div>
          
          <!-- Comments List -->
          <div class="flex flex-col gap-6">
             <div v-for="comment in commentaires" :key="comment.id" class="flex flex-col gap-2 group relative">
               <div class="flex items-center gap-3">
                 <div v-if="(comment as any).user?.profile_picture" class="w-8 h-8 rounded-full border-2 border-primary overflow-hidden shrink-0">
                   <img :src="(comment as any).user.profile_picture.startsWith('http') ? (comment as any).user.profile_picture : apiBase.replace('/api', '') + (comment as any).user.profile_picture" alt="Avatar" class="w-full h-full object-cover" />
                 </div>
                 <div v-else class="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center text-[11px] font-bold text-primary dark:text-[#0891b2] bg-white dark:bg-[#222224] shrink-0 overflow-hidden">
                   {{ ((comment as any).user?.last_name || 'U').charAt(0).toUpperCase() + ((comment as any).user?.first_name || '').charAt(0).toUpperCase() }}
                 </div>
                 <div class="flex items-baseline gap-2">
                   <span class="text-sm font-bold text-gray-900 dark:text-gray-200">{{ (comment as any).user?.last_name || 'Utilisateur' }}</span>
                   <span class="text-[10px] font-bold text-gray-400">{{ timeAgo(comment.created_at) }}</span>
                 </div>
               </div>
               
               <div class="ml-11">
                 <div v-if="editingCommentId === comment.id">
                    <textarea v-model="editingCommentText" class="w-full bg-transparent border border-primary rounded-xl p-3 text-sm focus:outline-none resize-none text-main dark:text-gray-200 mb-2" rows="2"></textarea>
                    <div class="flex items-center gap-2">
                      <button @click="saveEditComment" class="px-3 py-1 bg-cyan-600 hover:brightness-110 text-white text-xs font-bold rounded-lg transition-colors">Enregistrer</button>
                      <button @click="cancelEditComment" class="px-3 py-1 text-xs font-bold text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 transition-colors">Annuler</button>
                    </div>
                 </div>
                 <div v-else class="bg-transparent border border-[#e4e1db] dark:border-gray-800 rounded-xl rounded-tl-sm p-4 text-sm text-gray-600 dark:text-gray-300 break-words leading-relaxed" v-html="renderCommentContent(comment.content)"></div>
               </div>

               <!-- Comment Actions -->
               <div v-if="user?.id && (comment.user_id === user.id || (comment as any).user?.id === user.id) && editingCommentId !== comment.id" class="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button @click="startEditComment(comment)" class="p-1.5 text-secondary hover:text-cyan-600 bg-white dark:bg-[#222224] hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-lg" title="Modifier">
                   <Icon name="heroicons:pencil" class="w-3.5 h-3.5" />
                 </button>
                 <button @click="handleDeleteComment(comment.id)" class="p-1.5 text-secondary hover:text-red-500 bg-white dark:bg-[#222224] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg" title="Supprimer">
                   <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
                 </button>
               </div>
             </div>
             
             <div v-if="!commentaires || commentaires.length === 0" class="text-sm text-secondary dark:text-gray-500 text-center py-4 italic opacity-70">
                Aucun commentaire.
             </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer Dates -->
    <div class="shrink-0 flex items-center gap-6 mt-6 pt-6 border-t border-dashed border-form-border dark:border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-400">
      <span v-if="taskCreator" class="flex items-center gap-1.5">
        <Icon name="heroicons:user" class="w-3.5 h-3.5" /> Rapporteur: {{ taskCreator.last_name }} {{ taskCreator.first_name }}
      </span>
      <span v-if="taskCreatedAt" class="flex items-center gap-1.5">
        <Icon name="heroicons:calendar" class="w-3.5 h-3.5" /> Créé: {{ formatDisplayDate(taskCreatedAt) }}
      </span>
      <span v-if="taskUpdatedAt" class="flex items-center gap-1.5">
        <Icon name="heroicons:clock" class="w-3.5 h-3.5" /> Mis à jour: {{ formatDisplayDate(taskUpdatedAt) }}
      </span>
    </div>

    <!-- Modals -->
    <CreateTaskModal
      :is-open="isCreateSubtaskModalOpen"
      :parent-task-id="(route.params.id as string)"
      :projet-id="taskProjetId"
      :create-task="handleCreateSubtaskSubmit"
      @close="isCreateSubtaskModalOpen = false"
    />
    
    <ConfirmModal
      :is-open="isConfirmModalOpen"
      :title="confirmModalTitle"
      :message="confirmModalMessage"
      confirm-text="Supprimer"
      @close="isConfirmModalOpen = false"
      @confirm="pendingDeleteAction ? pendingDeleteAction() : null"
    />
  </div>
</template>
