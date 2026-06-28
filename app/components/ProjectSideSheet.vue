<script setup lang="ts">
import { ref, watch } from 'vue'
import useProjets from '~/composables/useProjets'
import useTasks from '~/composables/useTasks'
import { useToast } from '~/composables/useToast'

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
const editTitle = ref('')
const editDescription = ref('')
const editEndDate = ref('')

const totalTasks = ref(0)
const todoTasks = ref(0)
const inProgressTasks = ref(0)
const doneTasks = ref(0)
const tasksProgress = ref(0)
const projectTasks = ref<any[]>([])

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
      projectRef.value = projet.reference_code || `PROJ-${id}`
      projectStartDate.value = (projet as any).start_date || ''
      projectEndDate.value = (projet as any).end_date || ''
      
      // The API returns the status as defined in ProjectStatus (e.g. 'à faire', 'en cours', 'terminé')
      if ((projet as any).status) projectStatus.value = (projet as any).status
    }
    
    // Fetch tasks to calculate progress metrics
    const tasksData = await getTasks(id)
    if (tasksData) {
      projectTasks.value = tasksData
      totalTasks.value = tasksData.length
      todoTasks.value = tasksData.filter(t => t.status === 'à faire').length
      inProgressTasks.value = tasksData.filter(t => t.status === 'en cours').length
      doneTasks.value = tasksData.filter(t => t.status === 'terminé').length
      
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
      projectStatus.value
    )
    
    projectTitle.value = editTitle.value
    projectDescription.value = editDescription.value
    projectEndDate.value = editEndDate.value
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
    await fetchProject(props.projectId)
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
      status
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
          
          <div class="flex items-center gap-2 shrink-0">
            <button v-if="!isEditing" @click="startEditing" class="p-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 hover:bg-canvas dark:hover:bg-gray-800 rounded transition-colors" title="Modifier">
              <Icon name="heroicons:pencil" class="w-6 h-6" />
            </button>
            <button v-if="!isEditing" @click="handleDelete" class="p-2 text-secondary hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Supprimer">
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
            <span v-if="!isEditing" class="text-sm text-secondary dark:text-gray-500 font-medium">Fin prévue: {{ formatDate(projectEndDate) }}</span>
            <input v-else v-model="editEndDate" type="date" class="text-sm bg-[#F4F5F7] dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded px-2 py-1 text-main dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary" />
            
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
                    <div class="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-l-full transition-all duration-500" :style="{ width: `${(doneTasks / totalTasks) * 100}%` }" title="Terminés"></div>
                    <div class="bg-gradient-to-r from-blue-400 to-blue-500 h-full transition-all duration-500" :style="{ width: `${(inProgressTasks / totalTasks) * 100}%` }" title="En cours"></div>
                    <div class="bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 h-full rounded-r-full transition-all duration-500" :style="{ width: `${(todoTasks / totalTasks) * 100}%` }" title="À faire"></div>
                  </template>
                  <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                </div>
                <div class="flex justify-between text-[11px] font-bold text-secondary dark:text-gray-500 pt-2 uppercase tracking-wider">
                  <span class="text-emerald-600 dark:text-emerald-500">{{ doneTasks }} Terminés</span>
                  <span class="text-blue-600 dark:text-blue-400">{{ inProgressTasks }} En cours</span>
                  <span>{{ todoTasks }} À faire</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tasks List -->
          <div class="mb-8">
            <h3 class="text-sm font-bold text-main dark:text-gray-200 mb-4">Tâches du projet</h3>
            <div v-if="projectTasks.length > 0" class="flex flex-col gap-2">
              <div
                v-for="task in projectTasks" :key="task.id"
                class="flex items-center justify-between p-3 bg-canvas dark:bg-[#1A1A1D] rounded-lg border border-form-border dark:border-gray-800 hover:border-primary dark:hover:border-blue-500 transition-colors group"
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
              </div>
            </div>
            <div v-else class="text-sm text-secondary dark:text-gray-500 p-4 border border-dashed border-form-border dark:border-gray-800 rounded-lg text-center bg-canvas dark:bg-transparent">
              Aucune tâche dans ce projet.
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
