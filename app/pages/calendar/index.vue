<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import useTasks from '~/composables/useTasks'

definePageMeta({
  layout: 'custom',
})

const { tasks, getTasks } = useTasks()

// We need a ref for calendar events
const calendarEvents = ref<any[]>([])

// Load tasks on mount
onMounted(async () => {
  await getTasks()
  
  // Map tasks to FullCalendar event format using created_at (as requested)
  // If created_at is missing (like in some mock data), we default to today
  calendarEvents.value = tasks.value.map((task: any) => {
    // If no created_at, just put it on today for demonstration
    const dateToUse = task.created_at || new Date().toISOString()
    
    // Assign color based on priority
    let color = '#3b82f6' // default blue
    if (task.priority === 'haute') color = '#ef4444' // red
    if (task.priority === 'basse') color = '#10b981' // green

    return {
      id: String(task.id),
      title: task.title,
      start: dateToUse,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        status: task.status,
        description: task.description
      }
    }
  })
})

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: calendarEvents,
  editable: true,
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
  }
})

</script>

<template>
  <div class="h-full min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-40px)] flex flex-col pt-4 pb-12 md:pb-4">
    <header class="pb-5">
      <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-300 tracking-tight">Planning</h1>
      <p class="text-secondary dark:text-gray-400 pt-3 text-sm md:text-base">Gérer votre emploi du temps et vos tâches.</p>
    </header>

    <div class="flex-1 bg-white dark:bg-[#1D1D1D] rounded-xl border border-form-border dark:border-gray-800 p-4 neo-shadow overflow-hidden flex flex-col calendar-wrapper">
      <FullCalendar class="flex-1 h-full" :options="calendarOptions" />
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
.fc .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
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

/* Time axis text */
.fc-timegrid-slot-label-cushion {
  color: #6b7280;
  font-size: 0.75rem;
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
