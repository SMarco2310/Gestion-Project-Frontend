<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useToast } from '~/composables/useToast'
import draggable from 'vuedraggable'

export interface TaskTag {
  label: string
  colorClass: string
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
  assignee: TaskAssignee
}

const props = defineProps<{
  title: string
  isDone?: boolean // Used for column checkmark and crossed-out text
  allowCreate?: boolean // Used to show the '+ Create' button when empty
}>()

const items = defineModel<Task[]>('items', { default: () => [] })

const itemCount = computed(() => items.value.length)

const activeDropdownId = ref<string | null>(null)
const emit = defineEmits(['editTask', 'deleteTask', 'taskClick', 'createTask'])

const isCreating = ref(false)
const newTaskTitle = ref('')

const submitNewTask = () => {
  if (!newTaskTitle.value.trim()) return
  
  items.value.push({
    id: Date.now().toString(),
    title: newTaskTitle.value.trim(),
    tag: {
      label: 'NOUVEAU',
      colorClass: 'bg-[#3A3A3D] text-gray-300',
      icon: 'ph:file-duotone'
    },
    reference: 'SAMS-NEW',
    issueTypeIcon: 'ph:bookmark-simple-fill',
    issueTypeColorClass: 'text-emerald-600',
    assignee: {
      initials: '?',
      colorClass: 'bg-gray-600'
    }
  })
  
  // Fire a toast notification!
  const { addToast } = useToast()
  addToast({
    type: 'success',
    title: 'Tâche créée',
    message: `La tâche "${newTaskTitle.value.trim()}" a été ajoutée avec succès.`,
  })
  
  newTaskTitle.value = ''
  isCreating.value = false
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
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div class="flex flex-col w-[340px] bg-canvas dark:bg-[#161618] border border-form-border dark:border-[#2A2A2D] rounded-lg overflow-hidden shadow-md shadow-shadow-color dark:shadow-none h-full max-h-[85vh]">
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
            <!-- Checkbox with chevron -->
            <button class="flex items-center gap-0.5 text-primary dark:text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 px-1 py-0.5 rounded transition-colors">
              <Icon name="ph:check-square-fill" class="w-4 h-4" />
              <Icon name="heroicons:chevron-down" class="w-3 h-3" />
            </button>
            
            <!-- Calendar -->
            <button class="text-secondary dark:text-gray-500 hover:text-main dark:hover:text-gray-300 transition-colors">
              <Icon name="ph:calendar-blank" class="w-4 h-4" />
            </button>
            
            <!-- User -->
            <button class="w-5 h-5 rounded-full bg-form-border dark:bg-[#3A3A3D] text-secondary dark:text-gray-400 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              <Icon name="ph:user" class="w-3.5 h-3.5" />
            </button>
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
      >
        <template #item="{ element: item }">
          <div 
            class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] p-4 rounded-xl cursor-pointer hover:brightness-105 transition-all group"
            @click="emit('taskClick', item.id)"
          >
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
               <div :class="['inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider neo-badge', item.tag.colorClass]">
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

               <!-- Assignee & Status -->
               <div class="flex items-center gap-2.5">
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