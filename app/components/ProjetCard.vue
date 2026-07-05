<script setup lang="ts">
import { ref, computed } from 'vue'

const { isOwner } = useAuth()
const isDropdownOpen = ref(false)
const emit = defineEmits(['edit', 'delete', 'cardClick'])
const isEditModalOpen = ref(false)

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
    color: {
        type: String,
        default: 'blue'
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

const handleEdit = () => {
  
  
  isEditModalOpen.value = false
  emit('edit', props.id)
}

const themeClasses = computed(() => {
    switch(props.color) {
        case 'blue': return 'bg-blue-50 dark:bg-[#1E293B]'
        case 'green': return 'bg-emerald-50 dark:bg-[#1C2C28]'
        case 'rose': return 'bg-rose-50 dark:bg-[#342025]'
        case 'amber': return 'bg-amber-50 dark:bg-[#33291A]'
        case 'slate': return 'bg-slate-50 dark:bg-[#1E293B]'
        case 'purple':
        default: return 'bg-[#F2F0F9] dark:bg-[#2A2938]'
    }
})

</script>

<template>
    <!-- ProjetCard Component -->
    <div id="project-card" class="relative flex flex-col w-full group transition-transform duration-300 hover:-translate-y-1" @click="emit('cardClick', props.id)">
        
        <!-- Flat Folder Shape -->
        <div class="relative w-full pt-[18px] cursor-pointer">
            
            <!-- Folder Tab (z-0) -->
            <div class="absolute top-0 left-0 h-6 w-[40%] rounded-t-2xl transition-colors duration-300 z-0" :class="themeClasses"></div>
            
            <!-- Paper inside (z-10) -->
            <div v-if="props.metrics.totalTasks > 0" class="absolute top-1 left-4 right-4 h-6 bg-white dark:bg-[#222226] rounded-t-xl shadow-sm border border-black/5 dark:border-white/5 z-10 transition-transform duration-300 group-hover:-translate-y-2.5">
                <div class="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 ml-3"></div>
            </div>

            <!-- Folder Body (z-20) -->
            <div class="relative z-20 w-full rounded-3xl rounded-tl-none p-5 shadow-sm transition-colors duration-300 flex flex-col gap-4" :class="themeClasses">
                
                <!-- Top Right Options Menu -->
                <div class="absolute top-5 right-4 z-20" v-if="isOwner">
                    <div @click.stop="isDropdownOpen = !isDropdownOpen" class="cursor-pointer w-8 h-8 flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
                        <Icon name="heroicons:ellipsis-vertical" class="w-5 h-5 text-secondary dark:text-gray-400" />
                    </div>
                    
                    <!-- Overlay for closing -->
                    <div v-if="isDropdownOpen" @click.stop="isDropdownOpen = false" class="fixed inset-0 z-40"></div>
                    
                    <!-- Dropdown Menu -->
                    <div v-if="isDropdownOpen" class="absolute right-0 mt-2 w-40 bg-card dark:bg-[#1D1D1D] rounded-xl shadow-xl border border-form-border dark:border-gray-800 z-50 overflow-hidden">
                        <button @click.stop="isDropdownOpen = false; emit('edit', props.id)" class="w-full text-left px-4 py-3 text-sm font-medium text-secondary dark:text-gray-300 hover:bg-canvas dark:hover:bg-gray-800 hover:text-main dark:hover:text-white transition-colors flex items-center gap-2">
                            <Icon name="heroicons:pencil" class="w-4 h-4" /> Modifier
                        </button>
                        <button @click.stop="handleDelete" class="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                            <Icon name="heroicons:trash" class="w-4 h-4" /> Supprimer
                        </button>
                    </div>
                </div>

                <!-- Tags ON the folder card -->
                <div class="flex justify-between items-center w-full">
                    <span class="text-secondary dark:text-gray-400 font-bold text-sm tracking-wide flex items-center gap-1.5">
                        <Icon name="heroicons:folder" class="w-4 h-4" />
                        {{ props.reference_code }}
                    </span>
                    <span :class="{ 
                        'px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider' : props.status === 'à faire' , 
                        'px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider' : props.status === 'en cours' , 
                        'px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider' : props.status === 'terminé'
                    }">{{ props.status }}</span>
                </div>

                <!-- Title -->
                <h1 class="text-xl font-bold text-main dark:text-white tracking-wide pr-10 mt-1 truncate">{{ props.name }}</h1>

                <!-- Progress Bars -->
                <div class="flex flex-col gap-5 pt-2">
                    <!-- Tasks Progress -->
                    <div class="flex flex-col gap-1.5">
                        <div class="flex justify-between items-center">
                            <span class="text-secondary dark:text-gray-400 text-xs font-mono tracking-tight">Progression des tâches</span>
                            <span class="text-secondary dark:text-gray-400 text-xs font-mono tracking-tight font-bold">{{ props.metrics.tasksProgress }}%</span>
                        </div>
                        <div class="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-primary dark:bg-blue-500 transition-all duration-500 rounded-full" :style="{ width: `${props.metrics.tasksProgress}%` }"></div>
                        </div>
                    </div>
                    
                    <!-- Tickets Progress -->
                    <div class="flex flex-col gap-1.5">
                        <span class="text-secondary dark:text-gray-400 text-xs font-mono tracking-tight">Progression des tickets</span>
                        <div class="flex h-1.5 w-full gap-1">
                            <template v-if="props.metrics.totalTasks > 0">
                                <div class="bg-[#9BA9CE] dark:bg-[#7A8BB5] h-full rounded-l-full transition-all duration-500" :style="{ width: `${(props.metrics.doneTasks / props.metrics.totalTasks) * 100}%` }" v-if="props.metrics.doneTasks > 0"></div>
                                <div class="bg-[#B3CFFF] dark:bg-[#4C75D3] h-full transition-all duration-500" :style="{ width: `${(props.metrics.inProgressTasks / props.metrics.totalTasks) * 100}%` }" v-if="props.metrics.inProgressTasks > 0"></div>
                                <div class="bg-[#454A59] dark:bg-[#2A2E38] h-full rounded-r-full transition-all duration-500" :style="{ width: `${(props.metrics.todoTasks / props.metrics.totalTasks) * 100}%` }" v-if="props.metrics.todoTasks > 0"></div>
                            </template>
                            <div v-else class="w-full h-full bg-black/5 dark:bg-white/5 rounded-full"></div>
                        </div>
                        
                        <div class="flex justify-between text-[10px] font-semibold text-main dark:text-gray-400 pt-1 font-mono tracking-tight">
                            <span>{{ props.metrics.doneTasks }} Terminés</span>
                            <span>{{ props.metrics.inProgressTasks }} En cours</span>
                            <span>{{ props.metrics.todoTasks }} À faire</span>
                        </div>
                    </div>
                </div>

                <!-- Divider & Footer -->
                <div class="flex items-center justify-between pt-4 mt-2 border-t border-black/5 dark:border-white/5">
                    <div class="w-7 h-7 rounded-full overflow-hidden bg-white dark:bg-black/20 flex items-center justify-center shadow-sm border border-black/5 dark:border-white/5">
                        <Icon name="heroicons:user" class="w-3.5 h-3.5 text-secondary dark:text-gray-400" />
                    </div>
                    <div class="flex items-center gap-1.5 text-secondary dark:text-gray-400 text-xs font-medium bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full">
                        <Icon name="heroicons:calendar" class="w-3.5 h-3.5" />
                        <span>{{ formatDate(props.end_date) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>