<script setup lang="ts">

definePageMeta({
    layout: "custom",
    // middleware: "auth"
})

const todoItems = ref<any[]>([])
const inProgressItems = ref<any[]>([])

const isTaskModalOpen = ref(false)
const selectedTaskId = ref<string | null>(null)

const handleTaskClick = (taskId: string) => {
  selectedTaskId.value = taskId
  isTaskModalOpen.value = true
}

const handleCloseTaskModal = () => {
  isTaskModalOpen.value = false
  selectedTaskId.value = null
}

const doneItems = ref([
  {
    id: '1',
    title: 'Write Sprint 2 report — goal, completed stories, velocity, retrospective notes',
    tag: {
      label: 'AGILE DOCUMENTATION',
      colorClass: 'bg-[#3A3A3D] text-gray-300',
      icon: 'ph:file-duotone'
    },
    reference: 'SAMS-69',
    issueTypeIcon: 'ph:bookmark-simple-fill',
    issueTypeColorClass: 'text-emerald-600',
    statusIcon: 'ph:check',
    statusColorClass: 'text-emerald-500',
    assignee: {
      initials: 'SY',
      colorClass: 'bg-orange-600'
    }
  },
  {
    id: '2',
    title: 'Write Sprint 3 report — goal, completed stories, velocity, retrospective notes',
    tag: {
      label: 'AGILE DOCUMENTATION',
      colorClass: 'bg-[#3A3A3D] text-gray-300',
      icon: 'ph:file-duotone'
    },
    reference: 'SAMS-70',
    issueTypeIcon: 'ph:bookmark-simple-fill',
    issueTypeColorClass: 'text-emerald-600',
    statusIcon: 'ph:check',
    statusColorClass: 'text-emerald-500',
    assignee: {
      initials: 'SY',
      colorClass: 'bg-orange-600'
    }
  },
  {
    id: '3',
    title: 'Write Sprint 1 report — goal, completed stories, velocity, retrospective notes',
    tag: {
      label: 'AGILE DOCUMENTATION',
      colorClass: 'bg-[#3A3A3D] text-gray-300',
      icon: 'ph:file-duotone'
    },
    reference: 'SAMS-68',
    issueTypeIcon: 'ph:bookmark-simple-fill',
    issueTypeColorClass: 'text-emerald-600',
    statusIcon: 'ph:check',
    statusColorClass: 'text-emerald-500',
    assignee: {
      initials: 'SY',
      colorClass: 'bg-orange-600'
    }
  },
  {
    id: '4',
    title: 'Write Sprint 0 report — goal, completed stories, velocity, retrospective notes',
    tag: {
      label: 'AGILE DOCUMENTATION',
      colorClass: 'bg-[#3A3A3D] text-gray-300',
      icon: 'ph:file-duotone'
    },
    reference: 'SAMS-67',
    issueTypeIcon: 'ph:bookmark-simple-fill',
    issueTypeColorClass: 'text-emerald-600',
    statusIcon: 'ph:check',
    statusColorClass: 'text-emerald-500',
    assignee: {
      initials: 'SY',
      colorClass: 'bg-orange-600'
    }
  },
  {
    id: '5',
    title: 'Write integration tests for emergency and contacts endpoints',
    tag: {
      label: 'TESTING & QUALITY',
      colorClass: 'bg-amber-500 text-black',
      icon: 'ph:pencil-simple-duotone'
    },
    reference: 'SAMS-58',
    issueTypeIcon: 'ph:bookmark-simple-fill',
    issueTypeColorClass: 'text-emerald-600',
    statusIcon: 'ph:check',
    statusColorClass: 'text-emerald-500',
    assignee: {
      initials: 'F',
      colorClass: 'bg-cyan-600'
    }
  },
  {
    id: '6',
    title: 'Record a backup demo video in case of live demo technical issues',
    tag: {
      label: 'DEPLOYMENT & DEMO PREP',
      colorClass: 'bg-sky-300 text-black',
      icon: 'ph:rocket-launch-duotone'
    },
    reference: 'SAMS-78',
    issueTypeIcon: 'ph:bookmark-simple-fill',
    issueTypeColorClass: 'text-emerald-600',
    statusIcon: 'ph:check',
    statusColorClass: 'text-emerald-500',
    assignee: {
      icon: 'ph:user',
      colorClass: 'bg-gray-600'
    }
  },
  {
    id: '7',
    title: 'Prepare demo script — 5 minute walkthrough of all key features',
    tag: {
      label: 'DEPLOYMENT & DEMO PREP',
      colorClass: 'bg-sky-300 text-black',
      icon: 'ph:rocket-launch-duotone'
    },
    reference: 'SAMS-77',
    issueTypeIcon: 'ph:bookmark-simple-fill',
    issueTypeColorClass: 'text-emerald-600',
    statusIcon: 'ph:check',
    statusColorClass: 'text-emerald-500',
    assignee: {
      initials: 'SY',
      colorClass: 'bg-orange-600'
    }
  },
  {
    id: '8',
    title: 'Deploy frontend to Vercel or Netlify — connected to live backend',
    tag: {
      label: 'DEPLOYMENT & DEMO PREP',
      colorClass: 'bg-sky-300 text-black',
      icon: 'ph:rocket-launch-duotone'
    },
    reference: 'SAMS-74',
    issueTypeIcon: 'ph:bookmark-simple-fill',
    issueTypeColorClass: 'text-emerald-600',
    statusIcon: 'ph:check',
    statusColorClass: 'text-emerald-500',
    assignee: {
      initials: 'D',
      colorClass: 'bg-indigo-500'
    }
  }
]);
</script>

<template>
  <div class="flex flex-col h-full w-full max-h-full">
    <header class="flex flex-col md:flex-row md:justify-between w-full flex-shrink-0">
    <div class="py-2">
      <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-300">Tasks Overview</h1>
      <p class="text-secondary dark:text-gray-400 py-3 text-sm md:text-base">Gérer et suivre l'avancement de toutes vos tâches.</p>
    </div>
    <div id="search-bar" class="py-4 md:py-10 flex flex-row justify-between md:justify-end items-center gap-2 md:gap-4 w-full">
            <div class="relative flex items-center flex-1 md:flex-none">
                <Icon name="heroicons:magnifying-glass" class="w-5 h-5 text-secondary dark:text-gray-400 absolute left-4 pointer-events-none" />
                <input type="text" placeholder="Rechercher" class="bg-[#F4F5F7] dark:bg-[#1A1A1D] neo-input text-main dark:text-gray-300 placeholder-form-placeholder px-4 py-2.5 rounded-md pl-11 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 w-full md:w-96">
            </div>
            <FilterDropdown :showProjects="true" :showStatus="false" class="shrink-0" />
        </div>
  </header>
    <!-- Kanban Board Columns -->
    <div class="flex gap-4 md:gap-6 flex-1 min-h-0 pb-4 overflow-x-auto snap-x snap-mandatory flex-nowrap custom-scrollbar">
      <!-- Empty State Column -->
      <BoardColumn 
        title="À faire" 
        v-model:items="todoItems" 
        :allowCreate="true"
        @taskClick="handleTaskClick"
      />
      
      <!-- In Progress State Column -->
      <BoardColumn 
        title="En cours" 
        v-model:items="inProgressItems" 
        :allowCreate="false"
        @taskClick="handleTaskClick"
      />
    
      <!-- Loaded State Column -->
      <BoardColumn 
        title="Terminé" 
        v-model:items="doneItems" 
        :isDone="true" 
        @taskClick="handleTaskClick"
      />
    </div>
    <!-- Task Modal -->
    <TaskModal 
      :isOpen="isTaskModalOpen" 
      :task-id="selectedTaskId" 
      @close="handleCloseTaskModal" 
    />
  </div>
</template>