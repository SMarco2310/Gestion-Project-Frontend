<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import draggable from 'vuedraggable'
import { useToast } from '~/composables/useToast'
import useProjets from '~/composables/useProjets'

const items = defineModel<any[]>('items', { default: () => [] })
const emit = defineEmits(['createTask', 'taskClick', 'taskMoved', 'toggleStatus'])

const isCreating = ref(false)
const isCollapsed = ref(false)
const newTaskTitle = ref('')
const newTaskDueDate = ref('')
const newTaskProject = ref('')
const newTaskAssignee = ref<any>(null)
const isAssigneeDropdownOpen = ref(false)

const { $api } = useNuxtApp()
const { activeOrganization } = useOrganizations()

const avatarColors = ['bg-primary', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500']
const orgMembers = ref<any[]>([])

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

const handleAddCard = () => {
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

  emit('createTask', {
    title: newTaskTitle.value.trim(),
    projet_id: newTaskProject.value,
    board_column: 'Inbox',
    status: 'not done',
    priority: 'moyen',
    due_date: newTaskDueDate.value || getTodayDate(),
    assignee_id: newTaskAssignee.value?.id || null
  })

  newTaskTitle.value = ''
  isCreating.value = false
}

const createFormRef = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (isCreating.value && createFormRef.value && !createFormRef.value.contains(event.target as Node)) {
    isCreating.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  fetchOrgMembers()
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

const onChange = (evt: any) => {
  if (evt.added) {
    emit('taskMoved', evt.added.element.id)
  }
}
</script>

<template>
  <div :class="[
    'flex flex-col h-full bg-[#16233B] rounded-xl border border-white/5 overflow-hidden shadow-lg transition-all duration-300 shrink-0',
    isCollapsed ? 'w-14' : 'w-[340px]'
  ]">
    <!-- Header -->
    <div :class="['flex items-center text-white shrink-0 group/header', isCollapsed ? 'flex-col py-4 h-full' : 'justify-between p-4']">
      
      <div v-if="!isCollapsed" class="flex items-center gap-2">
        <Icon name="ph:tray" class="text-xl text-gray-300" />
        <h2 class="text-lg font-semibold tracking-wide">Inbox</h2>
      </div>

      <div v-else class="flex flex-col items-center gap-4 mt-2">
        <Icon name="ph:tray" class="text-xl text-gray-300" />
        <h2 class="text-sm font-semibold tracking-wide whitespace-nowrap rotate-180 uppercase" style="writing-mode: vertical-rl;">INBOX</h2>
        <span v-if="items.length > 0" class="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-center min-w-[20px] shrink-0 bg-white/20 text-white mt-2">
          {{ items.length }}
        </span>
      </div>

      <div :class="['flex items-center gap-2', isCollapsed ? 'mt-auto mb-2' : '']">
        <button @click="isCollapsed = !isCollapsed" :class="['p-1.5 rounded transition-colors', isCollapsed ? '' : 'opacity-0 group-hover/header:opacity-100', 'text-gray-400 hover:text-white hover:bg-white/10']" :title="isCollapsed ? 'Développer' : 'Réduire'">
          <Icon :name="isCollapsed ? 'ph:arrows-out-line-horizontal' : 'ph:arrows-in-line-horizontal'" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-show="!isCollapsed" class="flex-1 flex flex-col px-4 pb-4 overflow-y-auto custom-scrollbar gap-2">
      <!-- Create Button -->
      <div v-if="!isCreating" class="mb-2">
        <button @click.stop="isCreating = true" class="flex items-center gap-2 transition-colors text-sm font-medium w-full text-left text-gray-300 hover:text-white hover:bg-white/10 rounded-lg p-2 -ml-2">
          <Icon name="ph:plus" class="text-lg" />
          Ajouter une tâche
        </button>
      </div>

      <!-- Inline Create Form -->
      <div v-if="isCreating" ref="createFormRef" class="bg-[#24334E] rounded-lg p-3 mb-2 border border-cyan-600 shadow-sm flex flex-col gap-2 shrink-0">
        <textarea 
          v-model="newTaskTitle"
          class="w-full bg-transparent text-gray-200 text-[15px] placeholder-gray-400 focus:outline-none resize-none"
          rows="2"
          placeholder="What needs to be done?"
          @keydown.enter.prevent="handleAddCard"
          @keydown.esc="isCreating = false"
        ></textarea>
        
        <div class="flex items-center justify-between mt-1">
          <div class="flex items-center gap-2.5">
            <!-- Project Select -->
            <CustomSelect 
              v-model="newTaskProject"
              :options="availableProjects.map(p => ({ value: p.id, label: p.name }))"
              placeholder="Projet"
              buttonClass="text-[11px] font-medium text-gray-300 bg-[#16233B] border border-white/10 rounded px-1.5 py-1 focus:outline-none focus:border-cyan-600 cursor-pointer w-24 flex justify-between items-center"
              dropdownClass="w-32 mt-1 bg-[#1D1D1D] rounded-xl shadow-lg border border-gray-800 z-50 absolute left-0 top-full"
            />
            
            <!-- Calendar Date Picker -->
            <div class="relative flex items-center">
              <input type="date" :min="minDate" v-model="newTaskDueDate" class="text-xs text-gray-300 bg-[#16233B] border border-white/10 rounded px-1.5 py-1 focus:outline-none focus:border-cyan-600 cursor-pointer" />
            </div>
            
            <!-- User -->
            <div class="relative flex items-center">
              <button @click.stop="isAssigneeDropdownOpen = !isAssigneeDropdownOpen" class="w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-sm overflow-hidden" :class="[
                newTaskAssignee ? (newTaskAssignee.profile_picture ? '' : newTaskAssignee.color + ' text-white text-[10px] font-bold') : 'bg-[#3A3A3D] text-gray-400 hover:bg-gray-600'
              ]">
                <img v-if="newTaskAssignee?.profile_picture" :src="newTaskAssignee.profile_picture.startsWith('http') ? newTaskAssignee.profile_picture : `http://localhost:8000${newTaskAssignee.profile_picture}`" class="w-full h-full object-cover" />
                <span v-else-if="newTaskAssignee">{{ newTaskAssignee.initials }}</span>
                <Icon v-else name="ph:user" class="w-3.5 h-3.5" />
              </button>
              
              <!-- Assignee Dropdown Menu -->
              <div v-if="isAssigneeDropdownOpen" class="absolute top-full right-0 mt-1.5 w-44 bg-[#1D1D1D] rounded-xl shadow-lg border border-gray-800 z-50 overflow-hidden">
                 <div class="px-3 py-2 border-b border-gray-800 bg-black/20">
                    <p class="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Assigner à</p>
                 </div>
                 <ul class="p-1 max-h-40 overflow-y-auto custom-scrollbar">
                    <li class="px-2 py-1.5 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-2.5 text-[13px] font-medium text-white transition-colors" @click.stop="newTaskAssignee = null; isAssigneeDropdownOpen = false">
                       <div class="w-5 h-5 rounded-full border border-dashed border-gray-600 flex items-center justify-center text-gray-400 shrink-0">
                         <Icon name="ph:user-minus" class="w-3 h-3" />
                       </div> 
                       <span class="text-gray-400">Non assigné</span>
                    </li>
                    <li v-for="user in orgMembers" :key="user.id" class="px-2 py-1.5 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-2.5 text-[13px] font-medium text-white transition-colors" @click.stop="newTaskAssignee = user; isAssigneeDropdownOpen = false">
                       <div :class="['w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0 shadow-sm', user.profile_picture ? '' : user.color]">
                         <img v-if="user.profile_picture" :src="user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`" class="w-full h-full object-cover" />
                         <span v-else>{{ user.initials }}</span>
                       </div> 
                       <span class="truncate">{{ user.last_name + ' ' + user.first_name }}</span>
                    </li>
                 </ul>
              </div>
              
              <!-- Overlay to close dropdown -->
              <div v-if="isAssigneeDropdownOpen" @click.stop="isAssigneeDropdownOpen = false" class="fixed inset-0 z-40"></div>
            </div>
          </div>
          
          <button @click="handleAddCard" class="p-1 text-gray-400 hover:text-cyan-600 border border-white/10 hover:border-cyan-600 rounded transition-colors flex items-center justify-center">
            <Icon name="heroicons:paper-airplane" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Task List -->
      <draggable 
        v-model="items" 
        group="tasks" 
        item-key="id" 
        class="flex flex-col gap-2 flex-1 min-h-[100px]"
        ghost-class="opacity-40"
        drag-class="cursor-grabbing"
        :animation="200"
        @change="onChange"
        draggable=".inbox-task-card"
      >
        <template #item="{ element: task }">
          <div 
            @click="emit('taskClick', task.id)"
class="inbox-task-card task-card neo-card group flex flex-row gap-2.5 px-4 py-3.5 bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] border border-black/5 dark:border-white/5 rounded-xl overflow-hidden cursor-pointer hover:brightness-105 transition-all"          >
            <div 
              @click.stop="emit('toggleStatus', task.id)"
              class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              :class="task.status === 'done' ? 'bg-emerald-500 text-white' : 'border-2 border-gray-400 text-transparent hover:border-emerald-500'"
            >
              <Icon v-if="task.status === 'done'" name="ph:check-bold" class="text-xs" />
            </div>
            <span 
              class="text-sm truncate flex-1"
              :class="task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'"
            >
              {{ task.title }}
            </span>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>
