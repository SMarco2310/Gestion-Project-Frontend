<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'

const { isOwner, user } = useAuth()
const isDropdownOpen = ref(false)
const emit = defineEmits(['edit', 'delete', 'cardClick', 'archive', 'unarchive'])
const isEditModalOpen = ref(false)

const props = defineProps({
    id: {
        type: Number,
        required: true
    },
    user_id: {
        type: Number,
        required: false
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
    is_archived: {
        type: Boolean,
        default: false
    },
    metrics: {
        type: Object,
        default: () => ({ totalTasks: 0, doneTasks: 0, inProgressTasks: 0, todoTasks: 0, tasksProgress: 0 })
    },
    users: {
        type: Array as PropType<Array<{id: number, last_name: string, first_name: string, profile_picture?: string|null}>>,
        default: () => []
    }
})

const canEdit = computed(() => {
  return isOwner.value || (props.user_id && user.value && props.user_id === user.value.id)
})

const isOverdue = computed(() => {
  if (props.status.toLowerCase() === 'terminé' || !props.end_date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(props.end_date)
  endDate.setHours(0, 0, 0, 0)
  return endDate < today
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
  emit('delete', props.id)
}

const handleEdit = () => {
  
  
  isEditModalOpen.value = false
  emit('edit', props.id)
}

const handleArchive = () => {
  isDropdownOpen.value = false
  emit('archive', props.id)
}

const handleUnarchive = () => {
  isDropdownOpen.value = false
  emit('unarchive', props.id)
}

const tabThemeClasses = computed(() => {
    const base = 'shadow-[inset_0_2px_3px_rgba(255,255,255,0.3),_0_-2px_4px_rgba(0,0,0,0.02)] border-t border-l border-r border-white/20 backdrop-blur-md'
    switch(props.color) {
        case 'blue': return `${base} bg-gradient-to-b from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600`
        case 'green': return `${base} bg-gradient-to-b from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600`
        case 'rose': return `${base} bg-gradient-to-b from-rose-400 to-rose-500 dark:from-rose-500 dark:to-rose-600`
        case 'amber': return `${base} bg-gradient-to-b from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500`
        case 'slate': return `${base} bg-gradient-to-b from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600`
        case 'purple':
        default: return `${base} bg-gradient-to-b from-indigo-400 to-purple-500 dark:from-indigo-500 dark:to-purple-600`
    }
})

const bodyThemeClasses = computed(() => {
    const base = 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_8px_20px_-4px_rgba(0,0,0,0.15)] border-t border-white/20 text-white backdrop-blur-xl'
    switch(props.color) {
        case 'blue': return `${base} bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-700 ring-1 ring-white/10`
        case 'green': return `${base} bg-gradient-to-br from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-700 ring-1 ring-white/10`
        case 'rose': return `${base} bg-gradient-to-br from-rose-400 to-rose-500 dark:from-rose-500 dark:to-rose-700 ring-1 ring-white/10`
        case 'amber': return `${base} bg-gradient-to-br from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-600 ring-1 ring-white/10`
        case 'slate': return `${base} bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-700 ring-1 ring-white/10`
        case 'purple':
        default: return `${base} bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-500 dark:to-purple-700 ring-1 ring-white/10`
    }
})

</script>

<template>
    <!-- ProjetCard Component -->
    <!-- ProjetCard Component -->
    <div id="project-card" class="relative flex flex-col w-full group transition-transform duration-300 hover:-translate-y-1" :class="isDropdownOpen ? 'z-[100]' : 'z-10'" @click="emit('cardClick', props.id)">
        
        <!-- Flat Folder Shape -->
        <div class="relative w-full pt-[18px] cursor-pointer">
            
            <!-- Folder Tab (z-0) -->
            <div class="absolute top-0 left-0 h-6 w-[55%] rounded-tl-2xl rounded-tr-[24px] transition-colors duration-300 z-0" :class="tabThemeClasses"></div>
            
            <!-- Paper inside (z-10) -->
            <div v-if="props.metrics.totalTasks > 0" class="absolute top-1 left-4 right-4 h-6 bg-white rounded-t-xl shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] z-10 transition-transform duration-300 group-hover:-translate-y-2.5">
                <div class="w-16 h-1 bg-gray-200 rounded-full mt-1.5 ml-3"></div>
            </div>

            <!-- Folder Body (z-20) -->
            <div class="relative z-20 w-full rounded-3xl rounded-tl-none p-5 transition-all duration-300 flex flex-col gap-4" :class="[bodyThemeClasses, isOverdue ? 'ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : '']">
                
                <!-- Top Right Options Menu -->
                <div class="absolute top-5 right-4 z-20" v-if="canEdit">
                    <div @click.stop="isDropdownOpen = !isDropdownOpen" class="cursor-pointer w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm">
                        <Icon name="heroicons:ellipsis-vertical" class="w-5 h-5 text-white/90" />
                    </div>
                    
                    <!-- Overlay for closing -->
                    <div v-if="isDropdownOpen" @click.stop="isDropdownOpen = false" class="fixed inset-0 z-40"></div>
                    
                    <!-- Dropdown Menu -->
                    <div v-if="isDropdownOpen" class="absolute right-0 mt-2 w-40 bg-card dark:bg-[#1D1D1D] rounded-xl shadow-xl border border-form-border dark:border-gray-800 z-50 overflow-hidden text-main dark:text-gray-300">
                        <button @click.stop="isDropdownOpen = false; emit('edit', props.id)" class="w-full text-left px-4 py-3 text-sm font-medium hover:bg-canvas dark:hover:bg-gray-800 hover:text-main dark:hover:text-white transition-colors flex items-center gap-2">
                            <Icon name="heroicons:pencil" class="w-4 h-4" /> Modifier
                        </button>
                        <button v-if="!props.is_archived" @click.stop="handleArchive" class="w-full text-left px-4 py-3 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2">
                            <Icon name="heroicons:archive-box" class="w-4 h-4" /> Archiver
                        </button>
                        <button v-else @click.stop="handleUnarchive" class="w-full text-left px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2">
                            <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" /> Désarchiver
                        </button>
                        <button @click.stop="handleDelete" class="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                            <Icon name="heroicons:trash" class="w-4 h-4" /> Supprimer
                        </button>
                    </div>
                </div>

                <!-- Tags ON the folder card -->
                <div class="flex justify-between items-center w-full pr-10">
                    <span class="text-white/90 font-bold text-sm tracking-wide flex items-center gap-1.5 drop-shadow-sm">
                        <Icon name="heroicons:folder" class="w-4 h-4 text-white/80" />
                        {{ props.reference_code }}
                    </span>
                    <span :class="{ 
                        'px-2.5 py-0.5 rounded-full bg-orange-400/90 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1)]' : props.status === 'à faire' , 
                        'px-2.5 py-0.5 rounded-full bg-white/25 border border-white/30 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.1)]' : props.status === 'en cours' , 
                        'px-2.5 py-0.5 rounded-full bg-emerald-400/90 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.1)]' : props.status === 'terminé'
                    }">{{ props.status }}</span>
                </div>

                <!-- Title -->
                <h1 class="text-xl font-bold text-white tracking-wide pr-10 mt-1 truncate drop-shadow-md">{{ props.name }}</h1>

                <!-- Progress Bars -->
                <div class="flex flex-col gap-5 pt-2">
                    <!-- Tasks Progress -->
                    <div class="flex flex-col gap-1.5">
                        <div class="flex justify-between items-center">
                            <span class="text-white/80 text-xs font-mono tracking-tight drop-shadow-sm">Tâches accomplies</span>
                            <span class="text-white/90 text-xs font-mono tracking-tight font-bold drop-shadow-sm">{{ props.metrics.tasksProgress }}%</span>
                        </div>
                        <div class="w-full h-1.5 bg-black/20 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                            <div class="h-full bg-white transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" :style="{ width: `${props.metrics.tasksProgress}%` }"></div>
                        </div>
                    </div>
                </div>

                <!-- Divider & Footer -->
                <div class="flex items-center justify-between pt-4 mt-2 border-t border-white/20">
                    <div class="flex items-center -space-x-2">
                        <template v-if="props.users && props.users.length > 0">
                            <div v-for="(u, index) in props.users.slice(0, 3)" :key="u.id" 
                                 class="w-7 h-7 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] border border-white/20 text-white backdrop-blur-sm relative"
                                 :style="{ zIndex: 10 - index }"
                                 :title="u.first_name + ' ' + u.last_name">
                                <img v-if="u.profile_picture" :src="u.profile_picture.startsWith('http') ? u.profile_picture : `http://localhost:8000${u.profile_picture}`" class="w-full h-full object-cover" />
                                <span v-else class="text-[10px] font-bold">{{(u.last_name || '').charAt(0).toUpperCase() + (u.first_name || '').charAt(0).toUpperCase()}}</span>
                            </div>
                            <div v-if="props.users.length > 3" 
                                 class="w-7 h-7 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] border border-white/20 text-white backdrop-blur-sm text-[10px] font-bold relative z-0"
                                 :title="`+${props.users.length - 3} autres`">
                                +{{ props.users.length - 3 }}
                            </div>
                        </template>
                        <template v-else>
                            <div class="w-7 h-7 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] border border-white/20 text-white backdrop-blur-sm relative z-0">
                                <Icon name="heroicons:user" class="w-3.5 h-3.5" />
                            </div>
                        </template>
                    </div>
                    <div class="flex items-center gap-2">
                        <div v-if="isOverdue" class="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full shadow-sm animate-pulse" title="En retard">
                            <Icon name="heroicons:exclamation-triangle" class="w-3.5 h-3.5 mt-[1px]" />
                        </div>
                        <div class="flex items-center gap-1.5 text-white/90 text-xs font-medium bg-black/20 px-3 py-1.5 rounded-full shadow-inner backdrop-blur-sm" :class="isOverdue ? 'ring-1 ring-red-400' : ''">
                            <Icon name="heroicons:calendar" class="w-3.5 h-3.5 text-white/80" />
                            <span>{{ formatDate(props.end_date) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>