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
  tags: TaskTag[]
  reference: string
  issueTypeIcon?: string
  issueTypeColorClass?: string
  status: string
  statusIcon?: string
  statusColorClass?: string
  commentairesCount?: number
  subtasksTotal?: number
  subtasksCompleted?: number
  assignee: TaskAssignee
  bannerImage?: string
  projetName?: string | null
}

const props = defineProps<{
  title: string
  isDone?: boolean // Used for column checkmark and crossed-out text
  allowCreate?: boolean // Used to show the '+ Create' button when empty
  color?: string
}>()

const items = defineModel<Task[]>('items', { default: () => [] })

const itemCount = computed(() => items.value.length)

const activeDropdownId = ref<string | null>(null)
const emit = defineEmits(['editTask', 'deleteTask', 'taskClick', 'createTask', 'taskMoved', 'rename', 'deleteColumn', 'toggleStatus', 'updateColor'])

const isCollapsed = ref(false)
const isLockedColumn = computed(() => {
  const t = props.title.toLowerCase()
  return ['à faire', 'to do', 'en cours', 'in progress', 'terminé', 'done'].includes(t)
})

const isEditingTitle = ref(false)
const editedTitle = ref(props.title)

const saveTitle = () => {
  if (editedTitle.value.trim() && editedTitle.value !== props.title) {
    emit('rename', editedTitle.value.trim())
  }
  isEditingTitle.value = false
}

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

const predefinedColors = [
  { hex: '#216e4e', name: 'Vert' },
  { hex: '#7f5f01', name: 'Jaune' },
  { hex: '#a54800', name: 'Orange' },
  { hex: '#ae2e24', name: 'Rouge' },
  { hex: '#5e4db2', name: 'Violet' },
  { hex: '#0055cc', name: 'Bleu' },
  { hex: '#206a83', name: 'Sarcelle' },
  { hex: '#4c6b1f', name: 'Vert clair' },
  { hex: '#943d73', name: 'Rose' },
  { hex: '', name: 'Défaut' }
]

const isColorPickerOpen = ref(false)
const colorPickerStyle = ref({ top: '0px', left: '0px' })

const toggleColorPicker = (event: MouseEvent) => {
  if (isColorPickerOpen.value) {
    isColorPickerOpen.value = false
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  colorPickerStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`
  }
  isColorPickerOpen.value = true
}

const { $api } = useNuxtApp()
const { activeOrganization } = useOrganizations()

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500']
const orgMembers = ref<any[]>([])

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
    const isSystemColumn = ['à faire', 'to do', 'en cours', 'in progress', 'terminé', 'done'].includes(props.title.toLowerCase())
    let initialStatus = 'à faire'
    
    if (isSystemColumn) {
      if (['en cours', 'in progress'].includes(props.title.toLowerCase())) initialStatus = 'en cours'
      else if (['terminé', 'done'].includes(props.title.toLowerCase())) initialStatus = 'terminé'
    }

    await createTask({
      title: newTaskTitle.value.trim(),
      projet_id: newTaskProject.value,
      status: initialStatus,
      board_column: props.title,
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

const isItemOverdue = (item: any) => {
  if (item.status === 'terminé' || !item.dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(item.dueDate)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

</script>

<template>
  <div :class="[
    'flex flex-col shrink-0 snap-center md:shrink-0 md:snap-align-none bg-canvas dark:bg-[#161618] border border-form-border dark:border-[#2A2A2D] rounded-lg overflow-hidden shadow-md shadow-shadow-color dark:shadow-none max-h-full transition-all duration-300',
    isCollapsed ? 'w-14 md:w-14 h-full' : 'w-[85vw] md:w-[340px] h-fit'
  ]" :style="color ? { backgroundColor: color, borderColor: color } : {}">
    <!-- Header -->
    <div :class="['px-4 flex items-center group/header', isCollapsed ? 'flex-col gap-4 py-6 h-full' : 'gap-3 py-4']">
      <div v-show="!isCollapsed" :class="['column-drag-handle cursor-grab active:cursor-grabbing p-1 -ml-2 rounded', color ? 'text-white/70 hover:text-white hover:bg-black/10' : 'text-secondary hover:text-main dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800']">
         <Icon name="ph:dots-six-vertical" class="text-lg" />
      </div>
      
      <div v-if="!isCollapsed && !isLockedColumn" class="flex items-center justify-center shrink-0">
         <button @click="toggleColorPicker" :class="['cursor-pointer relative flex items-center justify-center rounded w-4 h-4 shadow-sm border overflow-hidden hover:scale-110 transition-transform', color ? 'border-white/30' : 'border-black/10 dark:border-white/10']" title="Modifier la couleur">
            <div class="absolute inset-0 pointer-events-none" :style="{ backgroundColor: color || '#9CA3AF' }"></div>
         </button>
      </div>

      <div v-if="isEditingTitle && !isLockedColumn" class="flex-1 flex items-center gap-2">
        <input 
          v-model="editedTitle" 
          @keyup.enter="saveTitle"
          @blur="saveTitle"
          :class="['bg-transparent text-xs font-bold uppercase tracking-wider focus:outline-none border-b w-full', color ? 'text-white border-white/50' : 'text-main dark:text-white border-primary']"
          autoFocus
        />
      </div>
      <h2 v-else-if="!isCollapsed" @click="!isLockedColumn && (isEditingTitle = true)" :class="['text-xs font-bold uppercase tracking-wider transition-colors flex-1 truncate', color ? 'text-white' : 'text-secondary dark:text-gray-400', !isLockedColumn ? (color ? 'cursor-text hover:text-white/80' : 'cursor-text hover:text-main dark:hover:text-gray-200') : '']">{{ title }}</h2>
      <h2 v-else :class="['text-xs font-bold uppercase tracking-wider whitespace-nowrap rotate-180', color ? 'text-white' : 'text-secondary dark:text-gray-400']" style="writing-mode: vertical-rl;">{{ title }}</h2>
      
      <div v-if="!isEditingTitle && !isCollapsed && !isLockedColumn" class="flex items-center gap-1.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
        <button @click="$emit('deleteColumn')" :class="['p-1 rounded transition-colors', color ? 'text-white/70 hover:text-white hover:bg-red-500/30' : 'text-secondary hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20']" title="Supprimer la colonne">
           <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
        </button>
      </div>

      <button @click="isCollapsed = !isCollapsed" :class="['p-1.5 rounded transition-colors', isCollapsed ? '' : 'opacity-0 group-hover/header:opacity-100', color ? 'text-white/70 hover:text-white hover:bg-black/10' : 'text-secondary hover:text-main dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800']" :title="isCollapsed ? 'Développer' : 'Réduire'">
        <Icon :name="isCollapsed ? 'ph:arrows-out-line-horizontal' : 'ph:arrows-in-line-horizontal'" class="w-4 h-4" />
      </button>
      
      <span v-if="itemCount > 0" :class="['text-xs font-bold px-2 py-0.5 rounded flex items-center justify-center min-w-[24px] shrink-0', color ? 'bg-white/20 text-white' : 'bg-form-border dark:bg-[#27272A] text-main dark:text-gray-300']">
        {{ itemCount }}
      </span>
      <Icon v-if="isDone && !isCollapsed" name="ph:check" class="text-emerald-500 text-lg font-bold shrink-0" />
    </div>

    <!-- Content -->
    <div v-show="!isCollapsed" class="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
      <!-- Create Button -->
      <div v-if="allowCreate && !isCreating" class="pt-2 pl-1 mb-2">
        <button @click.stop="isCreating = true" :class="['flex items-center gap-2 transition-colors text-sm font-medium w-full text-left', color ? 'text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 -ml-1.5' : 'text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200']">
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
            <CustomSelect 
              v-model="newTaskProject"
              :options="availableProjects.map(p => ({ value: p.id, label: p.name }))"
              placeholder="Projet"
              buttonClass="text-[11px] font-medium text-main dark:text-gray-300 bg-canvas dark:bg-[#1A1A1D] border border-form-border dark:border-gray-700 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 cursor-pointer w-24 flex justify-between items-center"
              dropdownClass="w-32 mt-1 bg-white dark:bg-[#1D1D1D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50 absolute left-0 top-full"
            />
            
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
              <div v-if="isAssigneeDropdownOpen" class="absolute top-full right-0 mt-1.5 w-44 bg-white dark:bg-[#1D1D1D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50 overflow-hidden">
                 <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
                    <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Assigner à</p>
                 </div>
                 <ul class="p-1 max-h-40 overflow-y-auto custom-scrollbar">
                    <li class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-2.5 text-[13px] font-medium text-main dark:text-white transition-colors" @click.stop="newTaskAssignee = null; isAssigneeDropdownOpen = false">
                       <div class="w-5 h-5 rounded-full border border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center text-secondary shrink-0">
                         <Icon name="ph:user-minus" class="w-3 h-3" />
                       </div> 
                       <span class="text-secondary dark:text-gray-400">Non assigné</span>
                    </li>
                    <li v-for="user in orgMembers" :key="user.id" class="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-2.5 text-[13px] font-medium text-main dark:text-white transition-colors" @click.stop="newTaskAssignee = user; isAssigneeDropdownOpen = false">
                       <div :class="['w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0 shadow-sm', user.profile_picture ? '' : user.color]">
                         <img v-if="user.profile_picture" :src="user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`" class="w-full h-full object-cover" />
                         <span v-else>{{ user.initials }}</span>
                       </div> 
                       <span class="truncate">{{ user.name }}</span>
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
        class="flex-1 flex flex-col gap-2.5 min-h-[100px]"
        ghost-class="opacity-40"
        drag-class="cursor-grabbing"
        :animation="200"
        @change="onChange"
      >
        <template #item="{ element: item }">
          <div 
            class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl cursor-pointer hover:brightness-105 transition-all group overflow-hidden flex flex-col"
            :class="isItemOverdue(item) ? 'ring-1 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''"
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

            <!-- Tags -->
            <div v-if="item.tags && item.tags.length > 0" class="flex flex-wrap items-start gap-1.5">
               <div v-for="tag in item.tags" :key="tag.id || tag.label" :style="{ backgroundColor: (tag.colorHex || '#9CA3AF') + '20', color: tag.colorHex || '#9CA3AF' }" class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider neo-badge">
                  {{ tag.label }}
               </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between mt-1">
               <!-- Reference -->
               <div class="flex flex-col gap-0.5 max-w-[55%]">
                 <div v-if="item.projetName" class="text-[9px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider truncate flex items-center gap-1">
                   <Icon name="heroicons:folder" class="w-3 h-3 shrink-0" />
                   <span class="truncate">{{ item.projetName }}</span>
                 </div>
                 <div class="flex items-center gap-1.5 text-secondary dark:text-gray-400 text-xs font-medium">
                    <div @click.stop="emit('toggleStatus', item.id)" class="w-4 h-4 rounded-full border-2 border-secondary dark:border-gray-500 shrink-0 flex items-center justify-center cursor-pointer hover:border-primary dark:hover:border-blue-500 transition-colors">
                      <div v-if="item.status === 'terminé'" class="w-2 h-2 bg-primary dark:bg-blue-500 rounded-full"></div>
                    </div>
                    <Icon :name="item.issueTypeIcon || 'ph:bookmark-simple-fill'" :class="['text-sm shrink-0', item.issueTypeColorClass || 'text-emerald-600']" />
                    <span class="truncate" :class="{ 'line-through text-form-placeholder dark:text-gray-500': isDone }">{{ item.reference }}</span>
                 </div>
               </div>

               <!-- Assignee, Comments & Status -->
               <div class="flex items-center gap-2.5">
                  <div v-if="isItemOverdue(item)" class="flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider neo-badge border border-red-200 dark:border-red-900/50">
                    <Icon name="heroicons:exclamation-triangle" class="w-3 h-3" />
                  </div>
                  <div v-if="item.subtasksTotal && item.subtasksTotal > 0" class="flex items-center gap-1 text-secondary dark:text-gray-400">
                    <Icon name="ph:check-square-offset" class="text-sm" />
                    <span class="text-xs font-medium">{{ item.subtasksCompleted }}/{{ item.subtasksTotal }}</span>
                  </div>
                  <div v-if="item.commentairesCount && item.commentairesCount > 0" class="flex items-center gap-1 text-secondary dark:text-gray-400">
                    <Icon name="ph:chat-teardrop-text" class="text-sm" />
                    <span class="text-xs font-medium">{{ item.commentairesCount }}</span>
                  </div>
                  
                  <!-- Assignee Avatar -->
                  <div 
                    v-if="item.assignee?.profilePicture"
                    class="w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-sm"
                  >
                    <img :src="item.assignee.profilePicture" class="w-full h-full object-cover" />
                  </div>
                  <div 
                    v-else-if="item.assignee?.initials"
                    :class="['w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm', item.assignee.colorClass]"
                  >
                    {{ item.assignee.initials }}
                  </div>
                  <div v-else-if="item.assignee?.icon" class="w-6 h-6 rounded-full bg-form-border dark:bg-[#3A3A3D] flex items-center justify-center text-secondary dark:text-gray-400 shrink-0">
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

  <Teleport to="body">
    <div v-if="isColorPickerOpen" class="fixed inset-0 z-[200]" @click="isColorPickerOpen = false">
      <div 
        class="fixed bg-white dark:bg-[#282E33] shadow-[0_8px_16px_-4px_rgba(9,30,66,0.25),0_0_0_1px_rgba(9,30,66,0.08)] dark:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] rounded p-3 w-[240px]"
        :style="colorPickerStyle"
        @click.stop
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-secondary dark:text-[#B6C2CF]">Couleur de la colonne</span>
          <button @click="isColorPickerOpen = false" class="text-secondary hover:text-main dark:text-[#B6C2CF] dark:hover:text-white transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-[#A6C5E229]">
            <Icon name="ph:x" class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="grid grid-cols-5 gap-1.5">
          <button 
            v-for="c in predefinedColors" 
            :key="c.name"
            @click="$emit('updateColor', c.hex); isColorPickerOpen = false"
            class="h-8 rounded flex items-center justify-center hover:opacity-80 transition-opacity relative group"
            :class="c.hex === '' ? 'bg-[#091E420F] dark:bg-[#A6C5E20A] hover:bg-[#091E4214] dark:hover:bg-[#A6C5E214]' : ''"
            :style="c.hex ? { backgroundColor: c.hex } : {}"
            :title="c.name"
          >
            <Icon v-if="color === c.hex || (!color && c.hex === '')" name="ph:check-bold" class="w-4 h-4 text-white" :class="c.hex === '' ? 'text-[#172B4D] dark:text-[#B6C2CF]' : ''" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
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