<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useCommentaire from '~/composables/useCommentaire'
import useAuth from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import useTasks from '~/composables/useTasks'
import useProjets from '~/composables/useProjets'
import useTags from '~/composables/useTags'

definePageMeta({
  layout: 'custom'
})

const route = useRoute()
const router = useRouter()


const close = () => {
  window.location.href = '/tasks'
}

const { commentaires, getCommentaires, createCommentaire, updateCommentaire, isLoading: commentsLoading, error: commentsError } = useCommentaire()
const { getTask, updateTask, getTasks, createTask, deleteTask, uploadBanner } = useTasks()
const { getProjet } = useProjets()
const { tags, getTags } = useTags()
const { user } = useAuth()
const { addToast } = useToast()

const activeTab = ref('comments')

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
const taskTagId = ref<number | string | null>(null)
const taskTag = ref<any>(null)
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
      taskReference.value = task.reference_code || `T-${String(task.id).padStart(2, '0')}`
      taskTagId.value = task.tag_id || null
      taskTag.value = task.tag || null
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
const isCreateSubtaskModalOpen = ref(false)
const commentText = ref('')
const editingCommentId = ref<number | string | null>(null)
const editingCommentText = ref('')

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return 'Aucune'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Aucune'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

const statusConfig: Record<string, { label: string; colorClass: string }> = {
  'à faire': { label: 'À FAIRE', colorClass: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-500' },
  'en cours': { label: 'EN COURS', colorClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-500' },
  'terminé': { label: 'TERMINÉ', colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500' }
}

const priorityConfig: Record<string, { label: string; colorClass: string; icon: string }> = {
  faible: { label: 'FAIBLE', colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: 'ph:caret-down-bold' },
  moyen: { label: 'MOYEN', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-500', icon: 'ph:equals-bold' },
  'élevé': { label: 'ÉLEVÉ', colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-500', icon: 'ph:caret-double-up-bold' }
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

const updateTag = async (newTagId: number | string | null) => {
  if (!(route.params.id as string)) return
  try {
    await updateTask((route.params.id as string), { tag_id: newTagId })
    taskTagId.value = newTagId
    taskTag.value = tags.value.find(t => t.id === newTagId) || null
    isTagDropdownOpen.value = false
    addToast({ title: 'Étiquette modifiée', message: 'L\'étiquette a été mise à jour.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible de modifier l\'étiquette.', type: 'error' })
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

  try {
    await createCommentaire({
      content: commentText.value.trim(),
      tache_id: (route.params.id as string),
    })

    commentText.value = ''
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
  taskTag.value = ''
  taskDueDate.value = ''
  taskCreatedAt.value = ''
  taskUpdatedAt.value = ''
  taskProjetId.value = ''
  taskProjetReference.value = ''
  taskBannerImage.value = ''
  taskSubtasks.value = []
  commentText.value = ''
  editingCommentId.value = null
  editingCommentText.value = ''
  isTagDropdownOpen.value = false
  isStatusDropdownOpen.value = false
  isPriorityDropdownOpen.value = false
}

watch(() => (route.params.id as string), async (newTaskId) => {
  if (newTaskId) {
    resetState()
    await setTask(newTaskId)
    await getCommentaires(newTaskId)
    if (false) {
      startEditing()
    }
  }
}, { immediate: true })

watch(() => true, (newIsOpen) => {
  if (newIsOpen && false) {
    startEditing()
  }
})
</script>

<template>
  <div class="flex flex-col w-full h-full min-h-screen bg-white dark:bg-[#1A1A1D]">
      <!-- Header -->
          <header class="flex items-center justify-between px-6 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] shrink-0 z-10 relative">
            <div class="flex items-center gap-3 text-secondary dark:text-gray-400 font-medium text-sm">
              <Icon name="ph:bookmark-simple-fill" class="text-emerald-500 w-4 h-4" />
              <span class="hover:underline cursor-pointer" v-if="taskProjetId">{{ taskProjetReference }}</span>
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
            <div class="flex-1 md:overflow-y-auto custom-scrollbar shrink-0 flex flex-col">
              <div class="px-4 sm:px-8 py-6 flex-1">
              <h1 v-if="!isEditing" class="text-2xl sm:text-3xl font-bold text-main dark:text-gray-200 mb-6 leading-tight">
                {{ taskTitle }}
              </h1>
              <input v-else v-model="editTitle" type="text" class="neo-input w-full text-2xl sm:text-3xl font-bold text-main dark:text-gray-200 mb-6 bg-transparent focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 rounded-lg py-2 px-3 -ml-3" />
              


              <div class="mb-8">
                <h3 class="text-base font-bold text-main dark:text-gray-200 mb-2">Description</h3>
                <div v-if="!isEditing" @click="startEditing" class="p-4 rounded-lg neo-input bg-[#F4F5F7] dark:bg-[#1A1A1D] text-secondary dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 cursor-text transition-colors whitespace-pre-wrap min-h-[60px]">
                  {{ taskDescription }}
                </div>
                <textarea v-else v-model="editDescription" class="w-full h-32 p-4 rounded-lg neo-input bg-[#F4F5F7] dark:bg-[#1A1A1D] text-main dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 resize-y custom-scrollbar"></textarea>
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

              <!-- Activity -->
              <div>
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-base font-bold text-main dark:text-gray-200">Activité</h3>
                </div>

                <!-- Add Comment Input -->
                <div class="flex gap-4 mb-6">
                  <div class="w-8 h-8 rounded-full bg-red-600 shrink-0 flex items-center justify-center text-xs font-bold text-white mt-1">
                    {{ user?.name ? user.name.substring(0, 2).toUpperCase() : 'U' }}
                  </div>
                  <div class="flex-1 rounded-lg overflow-hidden neo-input bg-[#F4F5F7] dark:bg-[#1A1A1D] transition-colors focus-within:ring-1 focus-within:ring-primary dark:focus-within:ring-blue-500">
                    <textarea v-model="commentText" class="w-full bg-transparent p-3 text-sm text-main dark:text-gray-200 focus:outline-none resize-none" rows="2" placeholder="Ajouter un commentaire..."></textarea>
                    <div class="px-3 py-2 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-4 text-xs font-medium text-secondary dark:text-gray-400">
                      <button @click="sendComment" class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/10 transition-all duration-200 text-sm font-semibold">
                        <Icon name="heroicons:arrow-up-right" class="w-4 h-4" />
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Comments List -->
                <div v-if="commentaires && commentaires.length > 0" class="flex flex-col gap-4">
                  <div v-for="comment in commentaires" :key="comment.id" class="flex gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-600 shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5">
                      {{ (comment as any).user?.name ? (comment as any).user.name.substring(0, 2).toUpperCase() : 'U' }}
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-semibold text-main dark:text-gray-200">{{ (comment as any).user?.name || 'Utilisateur' }}</span>
                          <span class="text-xs text-secondary dark:text-gray-500">{{ comment.created_at ? formatDisplayDate(comment.created_at) : '' }}</span>
                        </div>
                        <button v-if="user?.id && (comment.user_id === user.id || (comment as any).user?.id === user.id)" @click="startEditComment(comment)" class="p-1 text-secondary hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors rounded hover:bg-canvas dark:hover:bg-gray-800" title="Modifier le commentaire">
                          <Icon name="heroicons:pencil" class="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div v-if="editingCommentId === comment.id" class="mt-2">
                        <textarea v-model="editingCommentText" class="w-full bg-canvas dark:bg-[#1A1A1D] border border-form-border dark:border-gray-800 rounded-lg p-2 text-sm text-main dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 resize-none" rows="2"></textarea>
                        <div class="flex items-center justify-end gap-2 mt-2">
                          <button @click="cancelEditComment" class="px-3 py-1.5 text-xs font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 transition-colors">Annuler</button>
                          <button @click="saveEditComment" class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors shadow-sm">Enregistrer</button>
                        </div>
                      </div>
                      <p v-else class="text-sm text-secondary dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{{ comment.content }}</p>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-secondary dark:text-gray-500 text-center py-4">
                  Aucun commentaire pour le moment.
                </div>
              </div>
              </div>
            </div>

            <!-- Sidebar (Right) -->
            <div class="w-full md:w-[320px] shrink-0 shadow-none md:shadow-[-2px_0_10px_rgba(0,0,0,0.02)] md:overflow-y-auto p-4 sm:p-6 custom-scrollbar border-t md:border-t-0 border-form-border dark:border-gray-800">
              
              <!-- Status Dropdown -->
              <div class="mb-6 flex gap-2">
                <div class="relative w-full">
                  <button @click="isStatusDropdownOpen = !isStatusDropdownOpen" :class="['flex items-center justify-between gap-2 px-3 py-2.5 neo-metallic rounded font-bold text-sm w-full hover:brightness-105 transition-colors', statusConfig[taskStatus]?.colorClass || '']">
                    {{ statusConfig[taskStatus]?.label || taskStatus }} <Icon name="heroicons:chevron-down" class="w-4 h-4" />
                  </button>
                  
                  <!-- Dropdown Menu -->
                  <div v-if="isStatusDropdownOpen" @click="isStatusDropdownOpen = false" class="fixed inset-0 z-40"></div>
                  <div v-if="isStatusDropdownOpen" class="absolute left-0 top-full mt-1 w-full bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1">
                    <button @click="updateStatus(key as string)" v-for="(config, key) in statusConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskStatus === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', config.colorClass]">
                      {{ config.label }}
                      <Icon v-if="taskStatus === key" name="heroicons:check" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>



              <!-- Details Accordion -->
              <div class="mb-6">
                <button class="flex items-center justify-between w-full font-bold text-main dark:text-gray-200 mb-4 group">
                  <span class="flex items-center gap-2"><Icon name="heroicons:chevron-down" class="w-4 h-4 text-secondary dark:text-gray-500" /> Détails</span>
                  <Icon name="heroicons:adjustments-horizontal" class="w-4 h-4 text-secondary dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <div class="flex flex-col gap-4 text-sm">
                  <!-- Property -->
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium pt-1">Assigné à</div>
                    <div class="col-span-2">
                      <div class="flex items-center gap-2 mb-1">
                        <div class="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white">SY</div>
                        <span class="text-main dark:text-gray-300 font-medium">Sarah Yeung</span>
                      </div>
                      <button class="text-primary dark:text-blue-400 hover:underline text-xs">M'assigner</button>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium pt-1">Étiquettes</div>
                    <div class="col-span-2 relative">
                      <button @click="isTagDropdownOpen = !isTagDropdownOpen" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all uppercase" :style="{ backgroundColor: taskTag ? (taskTag.color || '#9CA3AF') + '20' : '#F3F4F6', color: taskTag ? (taskTag.color || '#9CA3AF') : '#374151' }">
                        {{ taskTag?.name || 'SANS ÉTIQUETTE' }} <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5" />
                      </button>

                      <!-- Tag Dropdown Menu -->
                      <div v-if="isTagDropdownOpen" @click="isTagDropdownOpen = false" class="fixed inset-0 z-40"></div>
                      <div v-if="isTagDropdownOpen" class="absolute left-0 top-full mt-1 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1 max-h-60 overflow-y-auto">
                        <button @click="updateTag(null)" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskTagId === null ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', 'text-gray-600 dark:text-gray-400']">
                          SANS ÉTIQUETTE
                          <Icon v-if="taskTagId === null" name="heroicons:check" class="w-4 h-4" />
                        </button>
                        <button @click="updateTag(tag.id)" v-for="tag in tags" :key="tag.id" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskTagId === tag.id ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800']" :style="{ color: tag.color || '#9CA3AF' }">
                          {{ tag.name }}
                          <Icon v-if="taskTagId === tag.id" name="heroicons:check" class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium pt-1">Priorité</div>
                    <div class="col-span-2 relative">
                      <button @click="isPriorityDropdownOpen = !isPriorityDropdownOpen" :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all uppercase', priorityConfig[taskPriority]?.colorClass || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300']">
                        <Icon v-if="priorityConfig[taskPriority]?.icon" :name="priorityConfig[taskPriority]?.icon || ''" class="w-3.5 h-3.5" />
                        {{ priorityConfig[taskPriority]?.label || taskPriority || 'SANS PRIORITÉ' }} <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5" />
                      </button>

                      <!-- Priority Dropdown Menu -->
                      <div v-if="isPriorityDropdownOpen" @click="isPriorityDropdownOpen = false" class="fixed inset-0 z-40"></div>
                      <div v-if="isPriorityDropdownOpen" class="absolute left-0 top-full mt-1 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1">
                        <button @click="updatePriority(key as string)" v-for="(config, key) in priorityConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskPriority === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', config.colorClass]">
                          <div class="flex items-center gap-1.5">
                            <Icon :name="config.icon" class="w-4 h-4" />
                            {{ config.label }}
                          </div>
                          <Icon v-if="taskPriority === key" name="heroicons:check" class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium pt-1">Échéance</div>
                    <div class="col-span-2 text-main dark:text-gray-300">
                      <span v-if="!isEditing" class="pt-1 inline-block">{{ formatDisplayDate(taskDueDate) }}</span>
                      <input v-else v-model="editDueDate" type="date" :max="projectEndDate" class="w-full bg-[#F4F5F7] dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded px-2 py-1.5 text-sm text-main dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium">Rapporteur</div>
                    <div class="col-span-2 flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold text-white">MS</div>
                      <span class="text-main dark:text-gray-300 font-medium">Marc-Etienne SOSSOU</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Divider -->
              <div class="w-full h-px bg-black/5 dark:bg-white/5 my-4"></div>
              
              <!-- Development -->
              <div class="mb-4">
                <button class="flex items-center gap-2 font-bold text-main dark:text-gray-200">
                  <Icon name="heroicons:chevron-right" class="w-4 h-4 text-secondary dark:text-gray-500" /> Développement
                </button>
              </div>

              <!-- Divider -->
              <div class="w-full h-px bg-black/5 dark:bg-white/5 my-4"></div>

              <!-- Timestamps -->
              <div class="text-xs text-secondary dark:text-gray-500 flex flex-col gap-1 mt-6">
                <div v-if="taskCreatedAt">Créé le {{ new Date(taskCreatedAt).toLocaleDateString() }} à {{ new Date(taskCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
                <div v-if="taskUpdatedAt">Mis à jour le {{ new Date(taskUpdatedAt).toLocaleDateString() }} à {{ new Date(taskUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
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
