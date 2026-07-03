<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
let draggableInstance: any = null

const unscheduledTasks = computed(() => {
  return tasks.value.filter((task: any) => !task.due_date)
})

const calendarEvents = computed(() => {
  const taskEvents = tasks.value
    .filter((task: any) => task.due_date) // Only show scheduled tasks
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

  const projectEvents = projets.value.map((projet: any) => {
    const endDate = new Date(projet.end_date)
    endDate.setDate(endDate.getDate() + 1)

    return {
      id: 'p-' + String(projet.id),
      title: projet.name,
      start: projet.start_date,
      end: endDate.toISOString().split('T')[0],
      allDay: true,
      backgroundColor: '#1c3d28',
      borderColor: '#1c3d28',
      textColor: '#ffffff',
      extendedProps: {
        type: 'project',
        description: projet.description
      }
    }
  })

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

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
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
})

</script>

<template>
  <div class="h-full min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-40px)] flex flex-col pt-4 pb-12 md:pb-4">
    <header class="pb-5 flex justify-between items-start">
      <div>
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-300 tracking-tight">Planning</h1>
        <p class="text-secondary dark:text-gray-400 pt-3 text-sm md:text-base">Gérer votre emploi du temps et vos tâches.</p>
      </div>
      <button 
        @click="isSidebarOpen = !isSidebarOpen" 
        class="px-3.5 py-2.5 bg-white dark:bg-[#1D1D1D] border border-form-border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-main dark:text-gray-300 shadow-sm flex items-center gap-2 font-medium active:neo-inset"
        :class="{'ring-2 ring-primary dark:ring-blue-500': isSidebarOpen}"
      >
        <Icon name="heroicons:calendar-days" class="w-5 h-5" />
        <span class="hidden sm:inline">Backlog</span>
      </button>
    </header>

    <div class="flex-1 flex gap-4 overflow-hidden h-full">
      <div class="flex-1 bg-white dark:bg-[#1D1D1D] rounded-xl border border-form-border dark:border-gray-800 p-4 neo-shadow overflow-hidden flex flex-col calendar-wrapper">
        <FullCalendar class="flex-1 h-full" :options="calendarOptions" :events="calendarEvents" />
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
  FullCalendar Neo-Brutalist / Dark Mode Theme Overrides 
  Matches the sleek screenshot and general app theme.
*/
.calendar-wrapper {
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  --fc-list-event-hover-bg-color: rgba(255, 255, 255, 0.05);
  --fc-theme-standard-border-color: #e5e7eb;
  --fc-border-color: #e5e7eb;
  
  --fc-button-bg-color: #f3f4f6;
  --fc-button-border-color: #d1d5db;
  --fc-button-text-color: #374151;
  
  --fc-button-hover-bg-color: #e5e7eb;
  --fc-button-hover-border-color: #d1d5db;
  
  --fc-button-active-bg-color: #3b82f6;
  --fc-button-active-border-color: #2563eb;
  --fc-button-active-text-color: #ffffff;
  
  --fc-event-bg-color: #3b82f6;
  --fc-event-border-color: #2563eb;
  
  --fc-today-bg-color: rgba(59, 130, 246, 0.05);
}

.dark .calendar-wrapper {
  --fc-border-color: #27272a;
  --fc-theme-standard-border-color: #27272a;

  --fc-button-bg-color: #252525;
  --fc-button-border-color: #3f3f46;
  --fc-button-text-color: #a1a1aa;
  
  --fc-button-hover-bg-color: #3f3f46;
  --fc-button-hover-border-color: #52525b;
}

/* Container styling */
.fc-theme-standard .fc-scrollgrid {
  border-radius: 0.5rem;
  border-color: var(--fc-border-color);
}

/* Header toolbar styling */
.fc .fc-toolbar {
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center !important;
}

@media (min-width: 768px) {
  .fc .fc-toolbar {
    justify-content: space-between !important;
  }
}

.fc .fc-toolbar-chunk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.fc .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
}

.dark .fc .fc-toolbar-title {
  color: #f3f4f6;
}

/* Buttons */
.fc .fc-button-primary {
  text-transform: capitalize;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: none !important;
}

.fc .fc-button-primary:not(:disabled):active, 
.fc .fc-button-primary:not(:disabled).fc-button-active {
  background-color: var(--fc-button-active-bg-color);
  border-color: var(--fc-button-active-border-color);
}

/* Text colors */
.fc-col-header-cell-cushion,
.fc-daygrid-day-number {
  color: #4b5563;
  padding: 8px !important;
  font-weight: 600;
}

.dark .fc-col-header-cell-cushion,
.dark .fc-daygrid-day-number {
  color: #9ca3af;
}

.fc-timegrid-slot-label-cushion {
  color: #6b7280;
  font-size: 0.75rem;
}

/* Expand time axis column */
.fc .fc-timegrid-axis,
.fc .fc-timegrid-slot-label,
.fc-timegrid-slot-label-frame {
  width: 90px !important;
  min-width: 90px !important;
}

/* Fix all-day text wrap in axis */
.fc-timegrid-axis-cushion {
  white-space: nowrap !important;
  padding: 0 16px !important;
  text-transform: capitalize;
  overflow: visible !important;
}

.dark .fc-timegrid-slot-label-cushion {
  color: #6b7280;
}

/* Events */
.fc-timegrid-event .fc-event-main {
  padding: 2px 6px;
}

.fc-v-event {
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-width: 1px;
}

/* Remove default blue outline on focus */
.fc-event:focus::after, 
.fc-event:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* Current time indicator */
.fc-timegrid-now-indicator-line {
  border-color: #ef4444;
}
.fc-timegrid-now-indicator-arrow {
  border-color: #ef4444;
}

/* FullCalendar height constraints */
.fc-view-harness {
  min-height: 500px;
}
</style>
