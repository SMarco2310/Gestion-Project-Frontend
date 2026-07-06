<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import useTasks from '~/composables/useTasks'
import useProjets from '~/composables/useProjets'

definePageMeta({
  layout: 'custom',
})

const { tasks, getTasks, updateTask } = useTasks()
const { projets, getProjets } = useProjets()

const isSidebarOpen = ref(false)
const externalEventsRef = ref<HTMLElement | null>(null)
const calendarRef = ref<any>(null)
let draggableInstance: any = null

const currentTitle = ref('')
const activeFilter = ref('All')

// Navigation methods
const goPrev = () => calendarRef.value?.getApi().prev()
const goNext = () => calendarRef.value?.getApi().next()
const goToday = () => calendarRef.value?.getApi().today()

const activeView = ref('timeGridWeek')
const isViewDropdownOpen = ref(false)

const viewOptions = [
  { value: 'dayGridMonth', label: 'Ce mois' },
  { value: 'timeGridWeek', label: 'Cette semaine' },
  { value: 'timeGridDay', label: 'Aujourd\'hui' }
]

const changeView = (viewValue: string) => {
  activeView.value = viewValue
  calendarRef.value?.getApi().changeView(viewValue)
  isViewDropdownOpen.value = false
}

const currentViewLabel = computed(() => {
  const view = viewOptions.find(v => v.value === activeView.value)
  return view ? view.label : 'Cette semaine'
})

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.view-dropdown')) {
      isViewDropdownOpen.value = false
    }
  })
})

const activeFilters = ref({
  priorities: [] as (string | number)[],
  projects: [] as (string | number)[],
  statuses: [] as (string | number)[],
  tags: [] as (string | number)[],
  dateSort: 'recent'
})

const activeFilterCount = computed(() => {
  return activeFilters.value.priorities.length + 
         activeFilters.value.projects.length + 
         activeFilters.value.statuses.length + 
         activeFilters.value.tags.length
})

const handleFiltersUpdate = (newFilters: any) => {
  activeFilters.value = newFilters
}

const unscheduledTasks = computed(() => {
  return tasks.value.filter((task: any) => !task.due_date)
})

const calendarEvents = computed(() => {
  const taskEvents = tasks.value
    .filter((task: any) => {
      if (!task.due_date) return false
      if (activeFilters.value.priorities.length > 0 && !activeFilters.value.priorities.includes(task.priority)) return false
      const statusMap: Record<string, string> = { 'TO_DO': 'à faire', 'IN_PROGRESS': 'en cours', 'DONE': 'terminé' }
      const normalizedStatus = statusMap[task.status] || task.status
      if (activeFilters.value.statuses.length > 0 && !activeFilters.value.statuses.includes(normalizedStatus)) return false
      if (activeFilters.value.projects.length > 0 && !activeFilters.value.projects.includes(task.projet_id)) return false
      return true
    })
    .map((task: any) => {
      let color = '#3b82f6'
      if (task.priority === 'haute') color = '#ef4444'
      if (task.priority === 'basse') color = '#10b981'

      return {
        id: 't-' + String(task.id),
        title: task.title,
        start: task.due_date,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          type: 'task',
          status: task.status,
          description: task.description
        }
      }
    })

  const projectEvents = projets.value
    .filter((projet: any) => {
      if (activeFilters.value.projects.length > 0 && !activeFilters.value.projects.includes(projet.id)) return false
      return true
    })
    .map((projet: any) => {
    const endDate = new Date(projet.end_date)
    endDate.setDate(endDate.getDate() + 1)

    return {
      id: 'p-' + String(projet.id),
      title: projet.name,
      start: projet.start_date,
      end: endDate.toISOString().split('T')[0],
      allDay: true,
      display: 'background',
      backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue background
      borderColor: 'rgba(59, 130, 246, 0.2)',
      textColor: '#3b82f6',
      extendedProps: {
        type: 'project',
        description: projet.description
      }
    }
  })

  if (activeFilter.value === 'Projects') {
    return projectEvents
  } else if (activeFilter.value === 'Tasks') {
    return taskEvents
  }

  return [...projectEvents, ...taskEvents]
})

// Load tasks and projects on mount
onMounted(async () => {
  await Promise.all([getTasks(), getProjets()])
  
  if (externalEventsRef.value) {
    draggableInstance = new Draggable(externalEventsRef.value, {
      itemSelector: '.fc-event',
      eventData: function(eventEl) {
        return {
          title: eventEl.innerText,
          id: 't-' + eventEl.dataset.taskId,
          backgroundColor: eventEl.dataset.color,
          borderColor: eventEl.dataset.color
        }
      }
    })
  }
})

onUnmounted(() => {
  if (draggableInstance) {
    draggableInstance.destroy()
  }
})

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: activeView.value,
  headerToolbar: false as any, // using custom toolbar
  events: calendarEvents.value,
  editable: true,
  droppable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  slotMinTime: "00:00:00",
  slotMaxTime: "24:00:00",
  allDaySlot: true,
  height: '100%',
  datesSet: (arg: any) => {
    // Attempt to format like '01-07 January 2025' or fallback to default title
    if (arg.view.type === 'timeGridWeek') {
      const start = arg.start
      const end = new Date(arg.end)
      end.setDate(end.getDate() - 1) // end is exclusive in FC
      
      const formatMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
      const startMonth = formatMonth.format(start)
      const endMonth = formatMonth.format(end)
      
      if (startMonth === endMonth) {
         currentTitle.value = `${String(start.getDate()).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')} ${startMonth}`
      } else {
         currentTitle.value = arg.view.title
      }
    } else {
      currentTitle.value = arg.view.title
    }
  },
  eventClick: (clickInfo: any) => {
    // In a real app, open the task side sheet
    console.log('Event clicked:', clickInfo.event)
  },
  drop: async (info: any) => {
    const taskId = info.draggedEl.dataset.taskId
    if (taskId) {
      await updateTask(taskId, { due_date: info.dateStr })
      await getTasks() // Refresh list to remove from sidebar and confirm in calendar
    }
  },
  eventDrop: async (info: any) => {
    if (info.event.extendedProps.type === 'task') {
      const taskId = info.event.id.replace('t-', '')
      await updateTask(taskId, { due_date: info.event.startStr })
      // No refetch needed, local UI handles the drop successfully
    }
  }
}))

</script>

<template>
  <div class="h-full min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-40px)] flex flex-col pt-4 pb-12 md:pb-4">
    <header class="pb-4 flex justify-between items-center">
      <div class="flex items-center gap-2 text-sm font-semibold text-secondary dark:text-gray-400">
        <span class="hover:text-main dark:hover:text-gray-200 cursor-pointer transition-colors">Projets</span>
        <Icon name="heroicons:chevron-right" class="w-4 h-4" />
        <span class="text-main dark:text-gray-200 font-bold">Planning</span>
      </div>
      <button 
        @click="isSidebarOpen = !isSidebarOpen" 
        class="px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3 relative group font-bold text-white bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-95"
        :class="{'ring-2 ring-primary dark:ring-blue-500': isSidebarOpen}"
      >
        <Icon name="heroicons:calendar-days" class="w-5 h-5 relative z-10 drop-shadow-md shrink-0" />
        <span class="relative z-10 tracking-wide hidden sm:inline">Backlog</span>
      </button>
    </header>

    <div class="flex-1 flex gap-4 overflow-hidden h-full">
      <div class="flex-1 bg-white dark:bg-[#1D1D1D] rounded-3xl border border-form-border dark:border-gray-800 p-6 shadow-sm overflow-hidden flex flex-col calendar-wrapper gap-4">
        
        <!-- Custom Toolbar -->
        <div class="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-6 flex-wrap">
            <h2 class="text-2xl font-bold text-main dark:text-gray-200 tracking-tight">{{ currentTitle }}</h2>
            
            <div class="relative flex items-center bg-gray-50 dark:bg-black/20 p-1 rounded-full border border-gray-100 dark:border-gray-800 w-max isolate">
              <!-- Bouncy Slider Background -->
              <div 
                class="absolute top-1 bottom-1 rounded-full bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] -z-10"
                :class="{
                  'left-1 w-[64px]': activeFilter === 'All',
                  'left-[68px] w-[96px]': activeFilter === 'Projects',
                  'left-[164px] w-[80px]': activeFilter === 'Tasks'
                }"
              ></div>
              
              <button 
                @click="activeFilter = 'All'"
                :class="activeFilter === 'All' ? 'text-white drop-shadow-md' : 'text-gray-500 hover:text-main dark:hover:text-gray-300'"
                class="py-1.5 rounded-full text-sm font-bold transition-colors duration-300 w-[64px]"
              >All</button>
              <button 
                @click="activeFilter = 'Projects'"
                :class="activeFilter === 'Projects' ? 'text-white drop-shadow-md' : 'text-gray-500 hover:text-main dark:hover:text-gray-300'"
                class="py-1.5 rounded-full text-sm font-bold transition-colors duration-300 w-[96px]"
              >Projects</button>
              <button 
                @click="activeFilter = 'Tasks'"
                :class="activeFilter === 'Tasks' ? 'text-white drop-shadow-md' : 'text-gray-500 hover:text-main dark:hover:text-gray-300'"
                class="py-1.5 rounded-full text-sm font-bold transition-colors duration-300 w-[80px]"
              >Tasks</button>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="relative view-dropdown z-20">
              <div 
                @click="isViewDropdownOpen = !isViewDropdownOpen"
                class="flex items-center gap-2 text-sm font-bold text-secondary dark:text-gray-400 cursor-pointer hover:text-main dark:hover:text-gray-300 transition-colors bg-white dark:bg-[#1D1D1D] px-3 py-1.5 rounded-lg border border-form-border dark:border-gray-800 shadow-sm"
              >
                <span>{{ currentViewLabel }}</span>
                <Icon name="heroicons:chevron-down" class="w-4 h-4 transition-transform duration-200" :class="{'rotate-180': isViewDropdownOpen}" />
              </div>
              
              <transition name="fade">
                <div v-if="isViewDropdownOpen" class="absolute top-full mt-2 right-0 w-40 bg-white dark:bg-[#252525] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden py-1">
                  <div 
                    v-for="view in viewOptions" 
                    :key="view.value"
                    @click="changeView(view.value)"
                    class="px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1D1D1D] transition-colors flex items-center justify-between"
                    :class="{'font-bold text-primary dark:text-blue-400': activeView === view.value, 'text-main dark:text-gray-300': activeView !== view.value}"
                  >
                    {{ view.label }}
                    <Icon v-if="activeView === view.value" name="heroicons:check" class="w-4 h-4" />
                  </div>
                </div>
              </transition>
            </div>
            
            <div class="flex items-center gap-1">
              <button @click="goPrev" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><Icon name="heroicons:chevron-left" class="w-4 h-4" /></button>
              <button @click="goToday" class="px-2 py-1 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors uppercase">Auj.</button>
              <button @click="goNext" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><Icon name="heroicons:chevron-right" class="w-4 h-4" /></button>
            </div>
            
            <FilterDropdown 
              :showDateSort="false" 
              :showPriority="true" 
              :showStatus="true"
              :showProjects="true"
              :projectOptions="projets.map(p => ({ id: p.id, label: p.name }))"
              @update:filters="handleFiltersUpdate"
              class="z-50"
            >
              <template #trigger>
                <button class="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-bold text-main dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors pointer-events-none">
                  <Icon name="heroicons:adjustments-horizontal" class="w-4 h-4" />
                  Filter
                  <span v-if="activeFilterCount > 0" class="w-5 h-5 bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] text-white rounded-full flex items-center justify-center text-[10px]">{{ activeFilterCount }}</span>
                </button>
              </template>
            </FilterDropdown>
            
            <button class="flex items-center gap-2 px-5 py-2 bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] text-white rounded-full text-sm font-bold hover:scale-[1.02] active:scale-95 transition-all">
              <Icon name="heroicons:plus" class="w-4 h-4 drop-shadow-md" />
              <span class="tracking-wide drop-shadow-sm">Add Event</span>
            </button>
          </div>
        </div>

        <FullCalendar ref="calendarRef" class="flex-1 h-full" :options="calendarOptions">
          <template v-slot:dayHeaderContent="arg">
            <div class="flex items-center justify-center py-2">
              <div 
                v-if="arg.isToday"
                class="bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] text-white px-5 py-1.5 rounded-full text-sm font-bold tracking-wide"
              >
                {{ arg.date.getDate() }} - {{ arg.date.toLocaleDateString('en-US', { weekday: 'short' }) }}
              </div>
              <div 
                v-else
                class="text-sm font-bold text-secondary dark:text-gray-400 tracking-wide"
              >
                {{ arg.date.getDate() }} - {{ arg.date.toLocaleDateString('en-US', { weekday: 'short' }) }}
              </div>
            </div>
          </template>

          <template v-slot:slotLabelContent="arg">
            <div class="text-[11px] font-bold text-secondary dark:text-gray-500 py-1 pr-3 w-full text-right">
              {{ String(arg.date.getHours()).padStart(2, '0') }}:{{ String(arg.date.getMinutes()).padStart(2, '0') }}
            </div>
          </template>

          <template v-slot:eventContent="arg">
            <!-- Background Project Event -->
            <div v-if="arg.event.display === 'background'" class="w-full h-full opacity-50">
              <!-- Empty to prevent overlapping text with tasks on the same day -->
            </div>

            <!-- Month View Task Event -->
            <div v-else-if="arg.view.type === 'dayGridMonth'"
                 class="flex items-center gap-1.5 w-full px-1.5 py-1 rounded-md overflow-hidden shadow-sm border border-black/5 dark:border-white/5"
                 :class="{
                   'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300': arg.event.backgroundColor === '#3b82f6',
                   'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300': arg.event.backgroundColor === '#ef4444',
                   'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300': arg.event.backgroundColor === '#10b981',
                   'bg-gray-100 dark:bg-gray-800/40 text-gray-900 dark:text-gray-100': arg.event.backgroundColor === 'rgba(59, 130, 246, 0.1)'
                 }"
            >
              <div v-if="arg.event.extendedProps.status === 'terminé'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
              <div v-else-if="arg.event.extendedProps.status === 'en cours'" class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
              <div v-else class="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 border border-gray-500"></div>
              <span class="text-[10px] font-bold truncate leading-none">{{ arg.event.title }}</span>
            </div>

            <!-- TimeGrid Event (Week/Day) -->
            <div v-else
              class="flex flex-col w-full h-full p-2.5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-black/5 dark:border-white/5 transition-all overflow-hidden"
              :class="{
                'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100': arg.event.backgroundColor === '#3b82f6',
                'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100': arg.event.backgroundColor === '#ef4444',
                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100': arg.event.backgroundColor === '#10b981',
                'bg-gray-100 dark:bg-gray-800/40 text-gray-900 dark:text-gray-100': arg.event.backgroundColor === 'rgba(59, 130, 246, 0.1)'
              }"
            >
              <div class="flex justify-between items-start gap-1">
                <span class="text-xs font-bold leading-tight truncate">{{ arg.event.title }}</span>
                <button class="p-0.5 rounded-full hover:bg-black/10 transition-colors shrink-0">
                  <Icon name="heroicons:ellipsis-horizontal" class="w-4 h-4 opacity-70" />
                </button>
              </div>
              
              <div class="text-[10px] opacity-70 mt-1 font-medium truncate" v-if="!arg.event.allDay">
                {{ String(arg.event.start?.getHours()).padStart(2, '0') }}:{{ String(arg.event.start?.getMinutes()).padStart(2, '0') }}am - 
                {{ arg.event.end ? String(arg.event.end.getHours()).padStart(2, '0') + ':' + String(arg.event.end.getMinutes()).padStart(2, '0') + 'am' : '' }}
              </div>
              
              <div class="mt-auto pt-2" v-if="arg.event.extendedProps.status">
                <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-white/70 dark:bg-black/30 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  <Icon name="heroicons:check-circle" class="w-3 h-3 text-emerald-500" v-if="arg.event.extendedProps.status === 'terminé'" />
                  <Icon name="heroicons:clock" class="w-3 h-3 text-blue-500" v-else-if="arg.event.extendedProps.status === 'en cours'" />
                  <Icon name="heroicons:minus-circle" class="w-3 h-3 text-gray-400" v-else />
                  {{ arg.event.extendedProps.status }}
                </div>
              </div>
            </div>
          </template>
        </FullCalendar>
      </div>

      <!-- Unscheduled Tasks Sidebar -->
      <Transition 
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-x-12 opacity-0"
        enter-to-class="transform translate-x-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-x-0 opacity-100"
        leave-to-class="transform translate-x-12 opacity-0"
      >
        <div v-show="isSidebarOpen" class="w-80 shrink-0 bg-white dark:bg-[#1D1D1D] rounded-xl border border-form-border dark:border-gray-800 flex flex-col neo-shadow overflow-hidden h-full">
          <div class="p-4 border-b border-form-border dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex justify-between items-center">
            <h3 class="font-bold text-main dark:text-white">Tâches non planifiées</h3>
            <span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">{{ unscheduledTasks.length }}</span>
          </div>
          
          <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar" ref="externalEventsRef">
            <div 
              v-for="task in unscheduledTasks" 
              :key="task.id" 
              :data-task-id="task.id"
              :data-color="task.priority === 'haute' ? '#ef4444' : task.priority === 'basse' ? '#10b981' : '#3b82f6'"
              class="fc-event bg-canvas dark:bg-[#151515] p-3 rounded-lg border border-form-border dark:border-gray-800 cursor-grab active:cursor-grabbing hover:border-primary transition-colors group relative"
            >
              <div class="flex items-center gap-2 mb-1">
                 <Icon name="heroicons:bolt" class="w-4 h-4 shrink-0" :class="task.priority === 'haute' ? 'text-red-500' : task.priority === 'basse' ? 'text-emerald-500' : 'text-blue-500'" />
                 <span class="text-sm font-semibold text-main dark:text-gray-200 line-clamp-1 flex-1">{{ task.title }}</span>
              </div>
              <div class="flex items-center justify-between mt-2 pl-6">
                <span class="text-xs text-secondary dark:text-gray-500 font-mono">{{ task.reference_code || `TSK-${task.id}` }}</span>
                <span class="text-[10px] uppercase font-bold border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 whitespace-nowrap" :class="{'bg-gray-100 dark:bg-gray-800 text-gray-500': task.status === 'à faire'}">{{ task.status }}</span>
              </div>
            </div>
            
            <div v-if="unscheduledTasks.length === 0" class="text-center p-8 text-secondary dark:text-gray-500 flex flex-col items-center gap-2 mt-10">
              <Icon name="heroicons:check-badge" class="w-10 h-10 text-emerald-500/50" />
              <p class="text-sm font-medium">Toutes les tâches sont planifiées !</p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style>
/* 
  FullCalendar Custom Premium Theme Overrides 
*/
.calendar-wrapper {
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  --fc-list-event-hover-bg-color: rgba(0, 0, 0, 0.02);
  --fc-theme-standard-border-color: #f3f4f6;
  --fc-border-color: #f3f4f6;
  --fc-today-bg-color: transparent;
  --fc-now-indicator-color: #1f2937;
}

.dark .calendar-wrapper {
  --fc-border-color: #27272a;
  --fc-theme-standard-border-color: #27272a;
  --fc-now-indicator-color: #f3f4f6;
}

/* Remove default grid styling */
.fc-theme-standard .fc-scrollgrid {
  border: none !important;
}

.fc-scrollgrid-section-header > th {
  border: none !important;
}

.fc-col-header-cell {
  border: none !important;
  border-bottom: 1px solid var(--fc-border-color) !important;
}

.fc-timegrid-slot-minor {
  border-top-style: dashed !important;
}

.fc-timegrid-slot {
  border-bottom: 1px solid var(--fc-border-color);
}

/* Remove default event styling to rely on our custom content */
.fc-event {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
.fc-v-event .fc-event-main-frame {
  display: block;
  height: 100%;
}
.fc-timegrid-event-harness {
  padding: 1px 4px !important;
}
.fc-timegrid-event {
  border-radius: 0 !important;
  box-shadow: none !important;
}
.fc-event-main {
  height: 100%;
  padding: 0 !important;
}

/* Remove time axis background and borders */
.fc .fc-timegrid-axis {
  border: none !important;
}
.fc .fc-timegrid-slot-label {
  border: none !important;
}

.fc-timegrid-slot-label-frame {
  justify-content: flex-end;
}

.fc-timegrid-axis-cushion {
  display: none !important;
}

/* Fix FullCalendar focus outlines */
.fc-event:focus::after, 
.fc-event:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* Current time indicator */
.fc-timegrid-now-indicator-line {
  border-width: 1px;
  border-style: solid;
  border-color: var(--fc-now-indicator-color);
}
.fc-timegrid-now-indicator-arrow {
  display: none; /* We use a custom pill in nowIndicatorContent */
}

/* Expand time axis column to make room for our custom time labels */
.fc .fc-timegrid-axis,
.fc .fc-timegrid-slot-label,
.fc-timegrid-slot-label-frame {
  width: 70px !important;
  min-width: 70px !important;
}

/* FullCalendar height constraints */
.fc-view-harness {
  min-height: 600px;
}
</style>
