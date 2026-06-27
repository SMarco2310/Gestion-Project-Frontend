<script setup lang="ts">
import { ref } from 'vue'

const isDropdownOpen = ref(false)
const emit = defineEmits(['edit', 'delete', 'cardClick'])

const props = defineProps({
    id: {
        type: Number,
        required: true
    },
    reference_code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    end_date: {
        type: String,
        required: true
    },
    metrics: {
        type: Object,
        default: () => ({ totalTasks: 0, doneTasks: 0, inProgressTasks: 0, todoTasks: 0, tasksProgress: 0 })
    }
})


// A simple native function to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const handleDelete = () => {
  isDropdownOpen.value = false

  if (typeof window !== 'undefined' && window.confirm('Voulez-vous vraiment supprimer ce projet ?')) {
    emit('delete', props.id)
  }
}

</script>

<template>
    <!-- ProjetCard Component -->
    <div id="project-card" @click="emit('cardClick', props.id)" class="neo-card cursor-pointer flex gap-5 flex-col w-full bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-5 hover:brightness-105 transition-all">
        <div id="project-card-header" class="flex justify-between items-center text-secondary dark:text-gray-400 text-sm font-bold">
            <span>{{ props.reference_code }}</span>
            <div class="flex items-center gap-3">
                <span :class="{ 'neo-badge px-3 py-1 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-bold' : props.status === 'à faire' , 'neo-badge px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold' : props.status === 'en cours' , 'neo-badge px-3 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold' : props.status === 'terminé'}">{{ props.status.toUpperCase() }}</span>
                <div class="relative">
                    <div @click.stop="isDropdownOpen = !isDropdownOpen" class="cursor-pointer p-1 -mr-2 hover:bg-canvas dark:hover:bg-gray-700 rounded-md transition-colors">
                        <Icon name="heroicons:ellipsis-vertical" class="w-5 h-5 text-secondary dark:text-gray-400" />
                    </div>
                    
                    <!-- Overlay for closing -->
                    <div v-if="isDropdownOpen" @click.stop="isDropdownOpen = false" class="fixed inset-0 z-40"></div>
                    
                    <!-- Dropdown Menu -->
                    <div v-if="isDropdownOpen" class="absolute right-0 mt-2 w-40 bg-card dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-form-border dark:border-gray-800 z-50 overflow-hidden">
                        <button @click.stop="isDropdownOpen = false; emit('edit', props.id)" class="w-full text-left px-4 py-2.5 text-sm font-medium text-secondary dark:text-gray-300 hover:bg-canvas dark:hover:bg-gray-800 hover:text-main dark:hover:text-white transition-colors flex items-center gap-2">
                            <Icon name="heroicons:pencil" class="w-4 h-4" /> Modifier
                        </button>
                        <button @click.stop="handleDelete" class="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                            <Icon name="heroicons:trash" class="w-4 h-4" /> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div id="project-card-body" class="py-2">
            <h1 class="text-2xl font-bold text-main dark:text-gray-300 pb-5">{{ props.name }}</h1>
            <!-- <p class="text-gray-400 pt-2 text-md">{{ props.description }}</p> -->
        
            <div id="task-progress-bar-container" class="flex flex-col gap-2 pt-3">
                <div class="flex justify-between">
                <span class="text-secondary dark:text-gray-400 flex justify-left text-sm font-mono tracking-tight">Progression des tâches</span>
                <span class="text-secondary dark:text-gray-400 flex justify-left text-sm font-mono tracking-tight">{{ props.metrics.tasksProgress }}%</span>
                </div>
                <div id="task-progress-bar" class="w-full h-2 bg-form-border dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div id="task-progress" class="h-full bg-primary dark:bg-blue-600 transition-all duration-500" :style="{ width: `${props.metrics.tasksProgress}%` }"></div>
                </div>
            </div>
            
            <div id="ticket-status-bar-container" class="flex flex-col gap-2 pt-6">
                <span class="text-secondary dark:text-gray-400 flex justify-left text-sm font-mono tracking-tight">Progression des tickets</span>
                <!-- Multi-segment Progress Bar -->
                <div class="flex h-1.5 w-full gap-1">
                    <template v-if="props.metrics.totalTasks > 0">
                        <div class="bg-[#9BA9CE] h-full rounded-l-full transition-all duration-500" :style="{ width: `${(props.metrics.doneTasks / props.metrics.totalTasks) * 100}%` }" v-if="props.metrics.doneTasks > 0"></div>
                        <div class="bg-[#B3CFFF] h-full transition-all duration-500" :style="{ width: `${(props.metrics.inProgressTasks / props.metrics.totalTasks) * 100}%` }" v-if="props.metrics.inProgressTasks > 0"></div>
                        <div class="bg-[#454A59] h-full rounded-r-full transition-all duration-500" :style="{ width: `${(props.metrics.todoTasks / props.metrics.totalTasks) * 100}%` }" v-if="props.metrics.todoTasks > 0"></div>
                    </template>
                    <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                </div>
                
                <!-- Labels -->
                <div class="flex justify-between text-xs font-semibold text-main dark:text-gray-300 pt-1 font-mono tracking-tight">
                    <span>{{ props.metrics.doneTasks }} Terminés</span>
                    <span>{{ props.metrics.inProgressTasks }} En cours</span>
                    <span>{{ props.metrics.todoTasks }} À faire</span>
                </div>
            </div>
            
        </div>
        <div id="project-card-footer" class="flex items-center justify-between">
            <div id="project-card-footer-right" class="flex items-center gap-2">
                <Icon name="heroicons:users" class="w-5 h-5 text-secondary dark:text-gray-400" />
            </div>
            <div id="project-card-footer-left" class="flex items-center gap-2">
            <span class=" flex text-secondary dark:text-gray-400 text-sm font-bold justify-center"><Icon name="heroicons:calendar" class="w-5 h-5 text-secondary dark:text-gray-400 pr-1" /> <span class="pb-1.5 mx-1">{{ formatDate(props.end_date) }}</span></span>
            </div>
        </div>

    </div>

</template>