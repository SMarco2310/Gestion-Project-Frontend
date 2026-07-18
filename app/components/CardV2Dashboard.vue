<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const orgId = computed(() => route.params.org_id)

const props = defineProps<{
  totalIssues: number
  statusMetrics: Array<{ label: string; percentage: string; colorClass: string; colorCode: string; rawPercent: number }>
  projectTaskStats?: Array<{ name: string; Total: number; Complété: number }>
  priorities: Array<{ label: string; count: number; icon: string; iconColor: string; barColor: string; percent: number }>
  epics: Array<{ reference_code: string; title: string; progress: number; badgeBg: string; badgeText: string; barColor: string }>
  upcomingTasks?: Array<any>
  recentComments?: Array<any>
}>()

const emit = defineEmits(['taskClick'])

import { DonutChart, BarChart } from 'vue-chrts'

const donutData = computed(() => {
  if (props.totalIssues === 0 || props.statusMetrics.length === 0) {
    return [100]
  }
  return props.statusMetrics.map(m => m.rawPercent)
})

const donutCategories = computed(() => {
  if (props.totalIssues === 0 || props.statusMetrics.length === 0) {
    return {
      'Vide': { name: 'Vide', color: '#E5E7EB' }
    }
  }
  
  const categories: Record<string, any> = {}
  props.statusMetrics.forEach(m => {
    categories[m.label] = {
      name: m.label,
      color: m.colorCode
    }
  })
  return categories
})

const priorityData = computed(() => {
  return props.priorities.map(p => ({
    name: p.label,
    Tâches: p.count
  }))
})

const priorityCategories = {
  Tâches: {
    name: 'Tâches',
    color: '#0891b2'
  }
}

const xFormatterPriority = (i: number) => priorityData.value[i]?.name || ''

const projectTaskCategories = {
  Total: {
    name: 'Total',
    color: '#9CA3AF'
  },
  Complété: {
    name: 'Complété',
    color: '#10B981'
  }
}

const xFormatterProject = (i: number) => props.projectTaskStats?.[i]?.name || ''
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      <!-- Project Tasks Overview -->
      <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-6 flex flex-col h-[300px]">
        <h3 class="text-sm font-semibold text-main dark:text-gray-200 mb-2">Tâches par Projet</h3>
        
        <div class="flex-1 w-full relative">
          <ClientOnly>
            <BarChart
              v-if="projectTaskStats && projectTaskStats.length > 0"
              :data="projectTaskStats"
              xAxis="name"
              :yAxis="['Total', 'Complété']"
              :categories="projectTaskCategories"
              :xFormatter="xFormatterProject"
              :height="220"
              :hideLegend="false"
              class="w-full h-full"
            />
            <div v-else class="flex items-center justify-center h-full text-secondary">
              Aucun projet
            </div>
          </ClientOnly>
        </div>
      </div>

      <!-- Priority Breakdown -->
      <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-6 flex flex-col h-[300px]">
        <h3 class="text-sm font-semibold text-main dark:text-gray-200 mb-2">Priority Breakdown</h3>
        
        <div class="flex-1 w-full relative">
          <ClientOnly>
            <BarChart
              :data="priorityData"
              xAxis="name"
              :yAxis="['Tâches']"
              :categories="priorityCategories"
              :xFormatter="xFormatterPriority"
              :height="220"
              :hideLegend="true"
              class="w-full h-full"
            />
          </ClientOnly>
        </div>
      </div>

      <!-- Epic Progress -->
      <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-6 flex flex-col h-[300px]">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-sm font-semibold text-main dark:text-gray-200">Epic Progress</h3>
          <button class="text-secondary dark:text-gray-400 hover:text-main dark:hover:text-gray-200">
            <Icon name="ph:dots-three" class="text-lg" />
          </button>
        </div>

        <div class="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          <div 
            v-for="epic in epics" 
            :key="epic.reference_code"
            class="bg-white dark:bg-[#323235] shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-lg p-4 flex flex-col gap-3 border border-black/5 dark:border-white/5"
          >
            <div class="flex items-center gap-3">
              <span :class="['text-[10px] font-bold px-2 py-0.5 rounded', epic.badgeBg, epic.badgeText]">
                {{ epic.reference_code }}
              </span>
              <span class="text-sm text-main dark:text-gray-200 truncate flex-1">{{ epic.title }}</span>
              <span class="text-xs text-secondary dark:text-gray-400">{{ epic.progress }}%</span>
            </div>
            <!-- Progress Bar -->
            <div class="h-1.5 w-full neo-input bg-[#E5E7EB] dark:bg-[#2A2A2D] rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500" 
                :class="epic.barColor"
                :style="{ width: `${epic.progress}%` }"
              ></div>
            </div>
          </div>
          <div v-if="epics.length === 0" class="text-sm text-secondary text-center py-4">
            Aucun projet en cours.
          </div>
        </div>
      </div>
    </div>

    <!-- Second Row -->
    <div class="w-full max-w-[50%]">
      <!-- Upcoming Deadlines -->
      <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-6 flex flex-col h-[320px]">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-sm font-semibold text-main dark:text-gray-200 flex items-center gap-2">
            <Icon name="ph:calendar-blank" class="w-4 h-4 text-orange-400" />
            Échéances proches (7 jours)
          </h3>
        </div>

        <div class="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          <div 
            v-for="task in upcomingTasks" 
            :key="task.id"
            class="bg-white dark:bg-[#323235] shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-lg p-4 border border-black/5 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-orange-400/50 transition-colors"
            @click="emit('taskClick', String(task.id))"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                <Icon name="ph:clock" class="w-4 h-4" />
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-bold text-secondary">{{ task.reference_code }}</span>
                <span class="text-sm font-semibold text-main dark:text-gray-200 truncate max-w-[200px] sm:max-w-[300px]">{{ task.title }}</span>
              </div>
            </div>
            <div class="text-xs font-bold text-orange-500 shrink-0">
              {{ new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }}
            </div>
          </div>
          <div v-if="!upcomingTasks || upcomingTasks.length === 0" class="flex flex-col items-center justify-center h-full text-secondary">
            <Icon name="ph:check-circle" class="w-8 h-8 mb-2 opacity-50" />
            <span class="text-sm">Aucune tâche urgente</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

