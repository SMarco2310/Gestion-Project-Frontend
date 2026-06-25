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
  <header class="flex flex-row justify-between w-full">
    <div class="p-5">
      <h1 class="text-4xl font-bold text-main dark:text-gray-300">Tasks Overview</h1>
      <p class="text-secondary dark:text-gray-400 py-3 ">Gérer et suivre l'avancement de toutes vos tâches.</p>
    </div>
    <div id="search-bar" class="p-5 justify-end py-10 flex items-center gap-4">
            <div class="relative flex items-center w-full md:w-auto">
                <Icon name="heroicons:magnifying-glass" class="w-5 h-5 text-secondary dark:text-gray-400 absolute left-3 pointer-events-none" />
                <input type="text" placeholder="Rechercher" class="bg-card dark:bg-gray-600 text-main dark:text-gray-300 border border-form-border dark:border-transparent placeholder-form-placeholder px-4 py-2 rounded-md pl-10 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-blue-500 w-full md:w-64">
            </div>
            <FilterDropdown :showProjects="true" :showStatus="false" />
        </div>
  </header>
    <!-- Kanban Board Columns -->
    <div class="flex gap-6 h-[85vh]">
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
</template>