<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useToast } from '~/composables/useToast'
import useProjets from '~/composables/useProjets'
import useTasks from '~/composables/useTasks'
import draggable from 'vuedraggable'
export interface TaskTag {
  label: string
  colorHex: string
  icon: string
}

export interface TaskAssignee {
  initials?: string
  colorClass: string
  icon?: string
}

export interface Task {
  id: string
  title: string
  tag: TaskTag
  reference: string
  issueTypeIcon?: string
  issueTypeColorClass?: string
  statusIcon?: string
  statusColorClass?: string
  commentairesCount?: number
  assignee: TaskAssignee
  bannerImage?: string
}

const props = defineProps<{
  title: string
  isDone?: boolean // Used for column checkmark and crossed-out text
  allowCreate?: boolean // Used to show the '+ Create' button when empty
}>()

const items = defineModel<Task[]>('items', { default: () => [] })

const itemCount = computed(() => items.value.length)

const activeDropdownId = ref<string | null>(null)
const emit = defineEmits(['editTask', 'deleteTask', 'taskClick', 'createTask', 'taskMoved'])

const onChange = (evt: any) => {
  if (evt.added) {
    emit('taskMoved', evt.added.element.id)
  }
}

const isCreating = ref(false)
const newTaskTitle = ref('')
const newTaskDueDate = ref('')
const newTaskProject = ref('')
const newTaskAssignee = ref<any>(null)
const isAssigneeDropdownOpen = ref(false)

const { $api } = useNuxtApp()
const { activeOrganization } = useOrganizations()

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500']
const orgMembers = ref<any[]>([])

const fetchOrgMembers = async () => {
  if (!activeOrganization.value) return
  try {
    const res = await $api<any>(`/api/organizations/${activeOrganization.value.id}/members`, { method: 'GET' })
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

const getTodayDate = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
const minDate = ref(getTodayDate())

const { projets } = useProjets()

const availableProjects = computed(() => projets.value.map((project) => ({
  id: String(project.id),
  name: project.name,
})))

const { createTask } = useTasks()

const submitNewTask = async () => {
  if (!newTaskTitle.value.trim()) return
  if (!newTaskProject.value) {
    const { addToast } = useToast()
    addToast({
      type: 'warning',
      title: 'Projet requis',
      message: 'Sélectionnez un projet avant de créer la tâche.',
    })
    return
  }
  
  try {
    const statusVal = props.title === 'En cours' ? 'en cours' : (props.title === 'Terminé' ? 'terminé' : 'à faire')
    await createTask({
      title: newTaskTitle.value.trim(),
      projet_id: newTaskProject.value,
      status: statusVal,
      priority: 'moyen',
      due_date: newTaskDueDate.value || getTodayDate(),
    })
    
    const project = availableProjects.value.find((p) => String(p.id) === String(newTaskProject.value))
    const { addToast } = useToast()
    
    let successMsg = `La tâche "${newTaskTitle.value.trim()}" a été ajoutée au projet ${project?.name ?? 'inconnu'}.`
    if (newTaskDueDate.value) successMsg += ` Échéance: ${newTaskDueDate.value}.`
    
    addToast({
      type: 'success',
      title: 'Tâche créée',
      message: successMsg,
    })
    
    newTaskTitle.value = ''
    newTaskDueDate.value = ''
    newTaskProject.value = ''
    newTaskAssignee.value = null
    isAssigneeDropdownOpen.value = false
    isCreating.value = false
  } catch (error) {
    const { addToast } = useToast()
    addToast({
      type: 'error',
      title: 'Erreur',
      message: 'Impossible de créer la tâche. Vérifiez les informations.',
    })
  }
}

const createFormRef = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (isCreating.value && createFormRef.value && !createFormRef.value.contains(event.target as Node)) {
    isCreating.value = false
    // newTaskTitle.value = '' // uncomment if we want to clear text on click away
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  fetchOrgMembers()
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div class="flex flex-col w-[85vw] shrink-0 snap-center md:w-[340px] md:shrink md:snap-align-none bg-canvas dark:bg-[#161618] border border-form-border dark:border-[#2A2A2D] rounded-lg overflow-hidden shadow-md shadow-shadow-color dark:shadow-none h-full">
    <!-- Header -->
    <div class="px-4 py-4 flex items-center gap-3">
      <h2 class="text-xs font-bold text-secondary dark:text-gray-400 uppercase tracking-wider">{{ title }}</h2>
      <span v-if="itemCount > 0" class="bg-form-border dark:bg-[#27272A] text-main dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded flex items-center justify-center min-w-[24px]">
        {{ itemCount }}
      </span>
      <Icon v-if="isDone" name="ph:check" class="text-emerald-500 ml-auto text-lg font-bold" />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
      <!-- Create Button -->
      <div v-if="allowCreate && !isCreating" class="pt-2 pl-1 mb-2">
        <button @click.stop="isCreating = true" class="flex items-center gap-2 text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm font-medium w-full text-left">
          <Icon name="ph:plus" class="text-lg" />
          Créer
        </button>
      </div>

      <!-- Inline Create Form -->
      <div v-if="isCreating" ref="createFormRef" class="bg-card dark:bg-[#222224] rounded-lg p-3 mb-2 border-2 border-primary dark:border-blue-500 shadow-sm flex flex-col gap-2">
        <textarea 
          v-model="newTaskTitle"
          class="w-full bg-transparent text-main dark:text-gray-200 text-[15px] placeholder-secondary dark:placeholder-gray-500 focus:outline-none resize-none"
          rows="2"
          placeholder="What needs to be done?"
          @keydown.enter.prevent="submitNewTask"
          @keydown.esc="isCreating = false"
        ></textarea>
        
        <div class="flex items-center justify-between mt-1">
          <div class="flex items-center gap-2.5">
            <!-- Project Select -->
            <select v-model="newTaskProject" class="text-xs font-medium text-main dark:text-gray-300 bg-canvas dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 cursor-pointer max-w-[100px] truncate">
              <option value="" disabled selected>Projet</option>
              <option v-for="proj in availableProjects" :key="proj.id" :value="proj.id">{{ proj.name }}</option>
            </select>
            
            <!-- Calendar Date Picker -->
            <div class="relative flex items-center">
              <input type="date" :min="minDate" v-model="newTaskDueDate" class="text-xs text-main dark:text-gray-300 bg-canvas dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 cursor-pointer" />
            </div>
            
            <!-- User -->
            <div class="relative flex items-center">
              <button @click.stop="isAssigneeDropdownOpen = !isAssigneeDropdownOpen" class="w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-sm overflow-hidden" :class="[
                newTaskAssignee ? (newTaskAssignee.profile_picture ? '' : newTaskAssignee.color + ' text-white text-[10px] font-bold') : 'bg-form-border dark:bg-[#3A3A3D] text-secondary dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
              ]">
                <img v-if="newTaskAssignee?.profile_picture" :src="newTaskAssignee.profile_picture.startsWith('http') ? newTaskAssignee.profile_picture : `http://localhost:8000${newTaskAssignee.profile_picture}`" class="w-full h-full object-cover" />
                <span v-else-if="newTaskAssignee">{{ newTaskAssignee.initials }}</span>
                <Icon v-else name="ph:user" class="w-3.5 h-3.5" />
              </button>
              
              <!-- Assignee Dropdown Menu -->
              <div v-if="isAssigneeDropdownOpen" class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-card dark:bg-[#1D1D1D] rounded-xl shadow-xl border border-form-border dark:border-gray-800 z-50 overflow-hidden">
                 <div class="p-2 border-b border-form-border dark:border-gray-800">
                    <p class="text-xs text-secondary font-medium px-2">Assigner à</p>
                 </div>
                 <ul class="p-1 max-h-40 overflow-y-auto custom-scrollbar">
                    <li class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-sm text-main dark:text-white transition-colors" @click.stop="newTaskAssignee = null; isAssigneeDropdownOpen = false">
                       <div class="w-6 h-6 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-secondary">
                         <Icon name="ph:user-minus" class="w-3.5 h-3.5" />
                       </div> 
                       <span class="text-secondary dark:text-gray-400">Non assigné</span>
                    </li>
                    <li v-for="user in orgMembers" :key="user.id" class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-sm text-main dark:text-white transition-colors" @click.stop="newTaskAssignee = user; isAssigneeDropdownOpen = false">
                       <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden', user.profile_picture ? '' : user.color]">
                         <img v-if="user.profile_picture" :src="user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`" class="w-full h-full object-cover" />
                         <span v-else>{{ user.initials }}</span>
                       </div> 
                       {{ user.name }}
                    </li>
                 </ul>
              </div>
              
              <!-- Overlay to close dropdown -->
              <div v-if="isAssigneeDropdownOpen" @click.stop="isAssigneeDropdownOpen = false" class="fixed inset-0 z-40"></div>
            </div>
          </div>
          
          <button @click="submitNewTask" class="p-1 text-secondary dark:text-gray-600 hover:text-primary dark:hover:text-blue-500 border border-form-border dark:border-gray-700 hover:border-primary dark:hover:border-blue-500 rounded transition-colors flex items-center justify-center">
            <Icon name="heroicons:paper-airplane" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Draggable Items Container -->
      <draggable 
        v-model="items" 
        group="tasks" 
        item-key="id" 
        class="flex flex-col gap-2.5 min-h-[100px] h-full"
        ghost-class="opacity-40"
        @change="onChange"
      >
        <template #item="{ element: item }">
          <div 
            class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl cursor-pointer hover:brightness-105 transition-all group overflow-hidden flex flex-col"
            @click="emit('taskClick', item.id)"
          >
            <!-- Banner Image -->
            <div v-if="item.bannerImage" class="w-full h-28 shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img :src="item.bannerImage" class="w-full h-full object-cover" alt="Task banner" />
            </div>

            <!-- Content -->
            <div class="p-4 flex flex-col gap-2">
              <!-- Header (Title & Actions) -->
            <div class="flex justify-between items-start gap-2">
              <!-- Title -->
              <h3 class="text-main dark:text-gray-200 text-[15px] leading-snug flex-1">
                {{ item.title }}
              </h3>
              
              <!-- Actions Dropdown -->
              <div class="relative">
                  <div @click.stop="activeDropdownId = activeDropdownId === item.id ? null : item.id" class="cursor-pointer p-0.5 -mt-1 -mr-1 hover:bg-canvas dark:hover:bg-gray-700 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <Icon name="heroicons:ellipsis-horizontal" class="w-5 h-5 text-secondary dark:text-gray-400" />
                  </div>
                  
                  <!-- Overlay for closing -->
                  <div v-if="activeDropdownId === item.id" @click.stop="activeDropdownId = null" class="fixed inset-0 z-40"></div>
                  
                  <!-- Dropdown Menu -->
                  <div v-if="activeDropdownId === item.id" class="absolute right-0 mt-1 w-36 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden">
                      <button @click.stop="activeDropdownId = null; emit('editTask', item.id)" class="w-full text-left px-4 py-2.5 text-sm font-medium text-secondary dark:text-gray-300 hover:bg-canvas dark:hover:bg-gray-800 hover:text-main dark:hover:text-white transition-colors flex items-center gap-2">
                          <Icon name="heroicons:pencil" class="w-4 h-4" /> Modifier
                      </button>
                      <button @click.stop="activeDropdownId = null; emit('deleteTask', item.id)" class="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                          <Icon name="heroicons:trash" class="w-4 h-4" /> Supprimer
                      </button>
                  </div>
              </div>
            </div>

            <!-- Tag -->
            <div class="flex items-start">
               <div :style="{ backgroundColor: (item.tag.colorHex || '#9CA3AF') + '20', color: item.tag.colorHex || '#9CA3AF' }" class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider neo-badge">
                  {{ item.tag.label }}
               </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between mt-1">
               <!-- Reference -->
               <div class="flex items-center gap-1.5 text-secondary dark:text-gray-400 text-xs font-medium">
                  <Icon :name="item.issueTypeIcon || 'ph:bookmark-simple-fill'" :class="['text-sm', item.issueTypeColorClass || 'text-emerald-600']" />
                  <span :class="{ 'line-through text-form-placeholder dark:text-gray-500': isDone }">{{ item.reference }}</span>
               </div>

               <!-- Assignee, Comments & Status -->
               <div class="flex items-center gap-2.5">
                  <div v-if="item.commentairesCount && item.commentairesCount > 0" class="flex items-center gap-1 text-secondary dark:text-gray-400">
                    <Icon name="ph:chat-teardrop-text" class="text-sm" />
                    <span class="text-xs font-medium">{{ item.commentairesCount }}</span>
                  </div>
                  
                  <Icon 
                    v-if="item.statusIcon" 
                    :name="item.statusIcon" 
                    :class="['text-sm', item.statusColorClass]" 
                  />
                  
                  <!-- Assignee Avatar -->
                  <div 
                    v-if="item.assignee.initials"
                    :class="['w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white', item.assignee.colorClass]"
                  >
                    {{ item.assignee.initials }}
                  </div>
                  <div v-else-if="item.assignee.icon" class="w-6 h-6 rounded-full bg-form-border dark:bg-[#3A3A3D] flex items-center justify-center text-secondary dark:text-gray-400">
                    <Icon :name="item.assignee.icon" class="text-xs" />
                  </div>
               </div>
            </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar styling for a cleaner look */
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