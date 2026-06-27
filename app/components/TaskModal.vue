<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import useCommentaire from '~/composables/useCommentaire'
import useAuth from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import useTasks from '~/composables/useTasks'

const props = defineProps<{
  isOpen: boolean
  taskId?: string|any|null
}>()

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

const { commentaires, getCommentaires, createCommentaire, isLoading: commentsLoading, error: commentsError } = useCommentaire()
const { getTask, updateTask } = useTasks()
const { user } = useAuth()
const { addToast } = useToast()

const activeTab = ref('comments')

const isEditing = ref(false)
const taskTitle = ref('')
const taskDescription = ref('Ajouter une description...')
const editTitle = ref('')
const editDescription = ref('')

const setTask = async (id: string | number | null) => {
  if (!id) return
  try {
    const task = await getTask(id)
    if (task) {
      taskTitle.value = task.title || 'Sans titre'
      taskDescription.value = task.description || 'Ajouter une description...'
      if (task.status) taskStatus.value = task.status
      taskReference.value = task.reference_code || `T-${String(task.id).padStart(2, '0')}`
      taskTag.value = task.tag || 'Aucune'
      taskDueDate.value = task.due_date || 'Aucune'
      taskCreatedAt.value = task.created_at || ''
      taskUpdatedAt.value = task.updated_at || ''
      taskProjetId.value = task.projet_id || ''
      taskSubtasks.value = task.sub_tasks || []
    }
  } catch (e) {
    console.error(e)
  }
}

const startEditing = () => {
  editTitle.value = taskTitle.value
  editDescription.value = taskDescription.value
  isEditing.value = true
}

const saveEdit = async () => {
  if (!props.taskId) return
  try {
    await updateTask(props.taskId, {
      title: editTitle.value,
      description: editDescription.value
    })
    taskTitle.value = editTitle.value
    taskDescription.value = editDescription.value
    isEditing.value = false
    addToast({ title: 'Tâche modifiée', message: 'Les modifications ont été enregistrées.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible d’enregistrer la tâche.', type: 'error' })
  }
}

const cancelEdit = () => {
  isEditing.value = false
}

const { deleteTask } = useTasks()

const handleDelete = async () => {
  if (!props.taskId) return
  if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
    try {
      await deleteTask(props.taskId)
      addToast({ type: 'success', title: 'Tâche supprimée', message: 'La tâche a été supprimée avec succès.' })
      close()
    } catch (e) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer la tâche.' })
    }
  }
}

const isTagDropdownOpen = ref(false)
const isCreateSubtaskModalOpen = ref(false)
const taskStatus = ref('TERMINÉ')
const taskReference = ref('')
const taskTag = ref('')
const taskDueDate = ref('')
const taskCreatedAt = ref('')
const taskUpdatedAt = ref('')
const taskProjetId = ref('')
const commentText = ref('')
const taskSubtasks = ref<any[]>([])

const statusConfig: Record<string, { label: string; colorClass: string }> = {
  'à faire': { label: 'À FAIRE', colorClass: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-500' },
  'en cours': { label: 'EN COURS', colorClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-500' },
  'terminé': { label: 'TERMINÉ', colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500' }
}

const tagConfig: Record<string, { label: string; colorClass: string }> = {
  bug: { label: 'BUG', colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  feature: { label: 'FEATURE', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  improvement: { label: 'IMPROVEMENT', colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  documentation: { label: 'DOCUMENTATION', colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  design: { label: 'DESIGN', colorClass: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  testing: { label: 'TESTING', colorClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  deployment: { label: 'DEPLOYMENT', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' }
}

const updateStatus = async (newStatus: string) => {
  if (task.value && task.value.id) {
    try {
      await updateTask(task.value.id, { status: newStatus })
      taskStatus.value = newStatus
      isStatusDropdownOpen.value = false
      addToast({ title: 'Statut modifié', message: 'Le statut de la tâche a été mis à jour.', type: 'success' })
    } catch (err) {
      addToast({ title: 'Erreur', message: 'Impossible de modifier le statut.', type: 'error' })
    }
  }
}

const updateTag = async (newTag: string) => {
  if (task.value && task.value.id) {
    try {
      await updateTask(task.value.id, { tag: newTag })
      taskTag.value = newTag
      isTagDropdownOpen.value = false
      addToast({ title: 'Étiquette modifiée', message: 'L’étiquette a été mise à jour.', type: 'success' })
    } catch (err) {
      addToast({ title: 'Erreur', message: 'Impossible de modifier l’étiquette.', type: 'error' })
    }
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
  if (!commentText.value.trim() || !props.taskId) {
    addToast({ title: 'Commentaire vide', message: 'Écrivez quelque chose avant d’envoyer.', type: 'warning' })
    return
  }

  try {
    await createCommentaire({
      content: commentText.value.trim(),
      tache_id: props.taskId,
      user_id: user.value?.id ?? null,
    })

    commentText.value = ''
    addToast({ title: 'Commentaire ajouté', message: 'Votre commentaire a été publié.', type: 'success' })
  } catch (err) {
    addToast({ title: 'Erreur', message: 'Impossible d’ajouter le commentaire.', type: 'error' })
    console.error(err)
  }
}

watch(() => props.taskId, async (newTaskId) => {
  if (newTaskId) {
    await setTask(newTaskId)
    await getCommentaires(newTaskId)
  }
}, { immediate: true })
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60" @click.self="close">
        <div 
          class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] w-full max-w-[1200px] h-[100dvh] md:h-[90vh] rounded-none md:rounded-xl flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header -->
          <header class="flex items-center justify-between px-6 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] shrink-0 z-10 relative">
            <div class="flex items-center gap-3 text-secondary dark:text-gray-400 font-medium text-sm">
              <Icon name="ph:bookmark-simple-fill" class="text-emerald-500 w-4 h-4" />
              <span class="hover:underline cursor-pointer" v-if="taskProjetId">PROJ-{{ taskProjetId }}</span>
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

          <!-- Content Layout -->
          <div class="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden custom-scrollbar">
            <!-- Main Column (Left) -->
            <div class="flex-1 md:overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar shrink-0">
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
                <div class="flex gap-4">
                  <div class="w-8 h-8 rounded-full bg-red-600 shrink-0 flex items-center justify-center text-xs font-bold text-white mt-1">MS</div>
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
                      <button @click="isTagDropdownOpen = !isTagDropdownOpen" :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all uppercase', tagConfig[taskTag]?.colorClass || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300']">
                        {{ tagConfig[taskTag]?.label || taskTag || 'SANS ÉTIQUETTE' }} <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5" />
                      </button>

                      <!-- Tag Dropdown Menu -->
                      <div v-if="isTagDropdownOpen" @click="isTagDropdownOpen = false" class="fixed inset-0 z-40"></div>
                      <div v-if="isTagDropdownOpen" class="absolute left-0 top-full mt-1 w-48 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden flex flex-col p-1 gap-1">
                        <button @click="updateTag(key as string)" v-for="(config, key) in tagConfig" :key="key" :class="['px-3 py-2 text-xs font-bold rounded text-left transition-colors flex items-center justify-between', taskTag === key ? 'bg-canvas dark:bg-gray-800' : 'hover:bg-canvas dark:hover:bg-gray-800', config.colorClass]">
                          {{ config.label }}
                          <Icon v-if="taskTag === key" name="heroicons:check" class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-secondary dark:text-gray-500 font-medium">Échéance</div>
                    <div class="col-span-2 text-main dark:text-gray-300">{{ taskDueDate ? new Date(taskDueDate).toLocaleDateString() : 'Aucune' }}</div>
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
      </div>
      </Transition>

      <CreateTaskModal
        :is-open="isCreateSubtaskModalOpen"
        :parent-task-id="taskId"
        :projet-id="taskProjetId"
        :create-task="handleCreateSubtaskSubmit"
        @close="isCreateSubtaskModalOpen = false"
      />
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
