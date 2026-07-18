<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import useTasks from '~/composables/useTasks'
import useProjets from '~/composables/useProjets'
import useOrganizations from '~/composables/useOrganizations'
import CreateTaskModal from '~/components/CreateTaskModal.vue'
import CreateProjectModal from '~/components/CreateProjectModal.vue'
import TaskModal from '~/components/TaskModal.vue'
import ProjectModal from '~/components/ProjectModal.vue'

definePageMeta({
  layout: 'custom',
})

const route = useRoute()
const { tasks, getTasks, updateTask } = useTasks()
const { projets, getProjets } = useProjets()
const { activeOrganization } = useOrganizations()

const calendarRef = ref<any>(null)
let draggableInstance: any = null

const currentTitle = ref('')
const activeFilter = ref('All')

// Navigation methods
const goPrev = () => calendarRef.value?.getApi().prev()
const goNext = () => calendarRef.value?.getApi().next()
const goToday = () => calendarRef.value?.getApi().today()

const activeView = ref('dayGridMonth')
const isViewDropdownOpen = ref(false)

const viewOptions = [
  { value: 'dayGridMonth', label: 'Ce mois' },
  { value: 'timeGridDay', label: 'Aujourd\'hui' }
]

const changeView = (viewValue: string) => {
  activeView.value = viewValue
  calendarRef.value?.getApi().changeView(viewValue)
  isViewDropdownOpen.value = false
}

const currentViewLabel = computed(() => {
  const view = viewOptions.find(v => v.value === activeView.value)
  return view ? view.label : 'Ce mois'
})

const isCreateTaskModalOpen = ref(false)
const isCreateProjectModalOpen = ref(false)
const isAddEventDropdownOpen = ref(false)

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<string | null>(null)

const isProjectSheetOpen = ref(false)
const selectedProjectId = ref<string | null>(null)

const openCreateTask = () => {
  isAddEventDropdownOpen.value = false
  isCreateTaskModalOpen.value = true
}

const openCreateProject = () => {
  isAddEventDropdownOpen.value = false
  isCreateProjectModalOpen.value = true
}

// Close dropdowns when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.view-dropdown')) {
      isViewDropdownOpen.value = false
    }
    if (!target.closest('.add-event-dropdown')) {
      isAddEventDropdownOpen.value = false
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

const calendarEvents = computed(() => {
  const taskEvents = tasks.value
    .filter((task: any) => {
      if (!task.due_date) return false
      if (activeFilters.value.priorities.length > 0 && !activeFilters.value.priorities.includes(task.priority)) return false
      
      if (activeFilters.value.statuses.length > 0 && !activeFilters.value.statuses.includes(task.status)) return false
      
      if (activeFilters.value.projects.length > 0 && !activeFilters.value.projects.includes(task.projet_id)) return false
      
      if (activeFilters.value.tags.length > 0 && !(task.tags && task.tags.some((tag: any) => activeFilters.value.tags.includes(String(tag.name || tag).toLowerCase())))) return false
      
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
      backgroundColor: '#8b5cf6', // Violet color for projects
      borderColor: '#7c3aed',
      textColor: '#ffffff',
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
  if (window.innerWidth < 768) {
    activeView.value = 'timeGridDay'
  }
  
  await Promise.all([getTasks(), getProjets()])
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
    currentTitle.value = arg.view.title
  },
  eventClick: (clickInfo: any) => {
    const type = clickInfo.event.extendedProps.type
    if (type === 'task') {
      const taskId = clickInfo.event.id.replace('t-', '')
      selectedTaskId.value = taskId
      isTaskModalOpen.value = true
    } else if (type === 'project') {
      const projectId = clickInfo.event.id.replace('p-', '')
      selectedProjectId.value = projectId
      isProjectSheetOpen.value = true
    }
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
  <div class="h-full min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-40px)] flex flex-col pt-4 pb-12 md:pb-4 max-w-full mx-auto w-full px-4 sm:px-6 lg:px-8">
    <header class="pb-4 flex justify-between items-center">
      <div class="py-2 pb-5">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-300">Planning</h1>
      </div>
    </header>

    <div class="flex-1 flex gap-4 overflow-hidden h-full relative">
      <div class="flex-1 bg-white dark:bg-[#1D1D1D] rounded-3xl border border-form-border dark:border-gray-800 p-3 md:p-6 shadow-sm overflow-hidden flex flex-col calendar-wrapper gap-2 md:gap-4">
        
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
          
          <div class="flex items-center gap-2 md:gap-4 flex-wrap">
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
              class="relative z-30"
            >
              <template #trigger>
                <button class="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-bold text-main dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors pointer-events-none">
                  <Icon name="heroicons:adjustments-horizontal" class="w-4 h-4" />
                  Filter
                  <span v-if="activeFilterCount > 0" class="w-5 h-5 bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] text-white rounded-full flex items-center justify-center text-[10px]">{{ activeFilterCount }}</span>
                </button>
              </template>
            </FilterDropdown>
            
            <div class="relative z-30 add-event-dropdown">
              <button 
                @click="isAddEventDropdownOpen = !isAddEventDropdownOpen"
                class="flex items-center gap-2 px-5 py-2 bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-2px_3px_rgba(0,0,0,0.4)] text-white rounded-full text-sm font-bold hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Icon name="heroicons:plus" class="w-4 h-4 drop-shadow-md" />
                <span class="tracking-wide drop-shadow-sm">Ajouter</span>
              </button>
              
              <transition name="fade">
                <div v-if="isAddEventDropdownOpen" class="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-[#252525] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden py-1">
                  <div 
                    @click="openCreateProject"
                    class="px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1D1D1D] transition-colors flex items-center gap-2 font-bold text-main dark:text-gray-300"
                  >
                    <Icon name="heroicons:briefcase" class="w-4 h-4 text-primary" />
                    Projet
                  </div>
                  <div 
                    @click="openCreateTask"
                    class="px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1D1D1D] transition-colors flex items-center gap-2 font-bold text-main dark:text-gray-300"
                  >
                    <Icon name="heroicons:check-circle" class="w-4 h-4 text-emerald-500" />
                    Tâche
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <FullCalendar ref="calendarRef" class="flex-1 h-full w-full" :options="calendarOptions">
          <template v-slot:dayHeaderContent="arg">
            <div class="flex items-center justify-center py-1 md:py-2 overflow-hidden w-full">
              <div 
                v-if="arg.isToday"
                class="bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] ring-1 ring-[#141415] shadow-md text-white px-1.5 md:px-5 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold tracking-wide flex items-center justify-center min-w-[20px] md:min-w-0"
              >
                <span class="md:hidden uppercase">{{ arg.view.type === 'dayGridMonth' ? arg.date.toLocaleDateString('fr-FR', { weekday: 'narrow' }) : arg.date.getDate() }}</span>
                <span class="hidden md:inline">{{ arg.view.type === 'dayGridMonth' ? arg.date.toLocaleDateString('fr-FR', { weekday: 'long' }) : arg.date.getDate() + ' - ' + arg.date.toLocaleDateString('fr-FR', { weekday: 'short' }) }}</span>
              </div>
              <div 
                v-else
                class="text-[10px] md:text-sm font-bold text-secondary dark:text-gray-400 tracking-wide uppercase"
              >
                <span class="md:hidden uppercase">{{ arg.view.type === 'dayGridMonth' ? arg.date.toLocaleDateString('fr-FR', { weekday: 'narrow' }) : arg.date.getDate() }}</span>
                <span class="hidden md:inline">{{ arg.view.type === 'dayGridMonth' ? arg.date.toLocaleDateString('fr-FR', { weekday: 'long' }) : arg.date.getDate() + ' - ' + arg.date.toLocaleDateString('fr-FR', { weekday: 'short' }) }}</span>
              </div>
            </div>
          </template>

          <template v-slot:slotLabelContent="arg">
            <div class="text-[11px] font-bold text-secondary dark:text-gray-500 py-1 pr-3 w-full text-right">
              {{ String(arg.date.getHours()).padStart(2, '0') }}:{{ String(arg.date.getMinutes()).padStart(2, '0') }}
            </div>
          </template>

          <template v-slot:eventContent="arg">
            <!-- Project Event -->
            <div v-if="arg.event.extendedProps.type === 'project'" class="w-full h-full min-h-[22px] px-1.5 py-0.5 flex items-center rounded-md overflow-hidden shadow-sm" :style="{ backgroundColor: arg.event.backgroundColor, color: arg.event.textColor }">
              <template v-if="arg.isStart">
                <Icon name="heroicons:briefcase" class="w-3.5 h-3.5 mr-1.5 opacity-90 shrink-0" />
                <span class="text-[10px] font-bold truncate leading-none">{{ arg.event.title }}</span>
              </template>
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
              <div v-if="arg.event.extendedProps.status === 'done'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
              <div v-else-if="arg.event.extendedProps.status === 'en cours'" class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
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
                  <Icon name="heroicons:check-circle" class="w-3 h-3 text-emerald-500" v-if="arg.event.extendedProps.status === 'done'" />
                  <Icon name="heroicons:clock" class="w-3 h-3 text-primary" v-else-if="arg.event.extendedProps.status === 'en cours'" />
                  <Icon name="heroicons:minus-circle" class="w-3 h-3 text-gray-400" v-else />
                  {{ arg.event.extendedProps.status }}
                </div>
              </div>
            </div>
          </template>
        </FullCalendar>
      </div>

    </div>

    <CreateTaskModal 
      :isOpen="isCreateTaskModalOpen" 
      @close="isCreateTaskModalOpen = false" 
      @created="getTasks"
    />
    <CreateProjectModal 
      :isOpen="isCreateProjectModalOpen" 
      @close="isCreateProjectModalOpen = false" 
      @created="getProjets"
    />
    <TaskModal
      :is-open="isTaskModalOpen"
      :task-id="selectedTaskId"
      @close="isTaskModalOpen = false"
      @update="getTasks"
    />
    <ProjectModal
      :is-open="isProjectSheetOpen"
      :project-id="selectedProjectId"
      @close="isProjectSheetOpen = false"
      @update="getProjets"
    />
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
  width: 100% !important;
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
