<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

const props = defineProps<{
  totalUsers: number
  activeProjects: number
  tasks: any[]
  kanbanColumns: string[]
}>()

const topStats = computed(() => [
  { title: 'TOTAL USERS', value: props.totalUsers.toString(), trendColor: 'text-blue-500' },
  { title: 'PROJETS ACTIFS', value: props.activeProjects.toString(), trendColor: 'text-indigo-400' }
])

const currentYear = new Date().getFullYear()

import { AreaChart } from 'vue-chrts'

const chartData = computed(() => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
  const counts = new Array(12).fill(0)
  props.tasks.forEach(task => {
    if (task.created_at) {
      const d = new Date(task.created_at)
      if (d.getFullYear() === currentYear) {
        counts[d.getMonth()]++
      }
    }
  })
  
  return counts.map((count, index) => ({
    month: months[index],
    tasks: count
  }))
})

const categories = {
  tasks: {
    name: 'Tâches Créées',
    color: '#3b82f6'
  }
}

const xFormatter = (i: number) => chartData.value[i]?.month || ''

const dailyChartData = computed(() => {
  const data: { date: Date; label: string; count: number }[] = []
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  // Last 14 days
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    d.setHours(0, 0, 0, 0)
    data.push({
      date: d,
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      count: 0
    })
  }

  props.tasks.forEach(task => {
    if (task.created_at) {
      const d = new Date(task.created_at)
      d.setHours(0, 0, 0, 0)
      
      const target = data.find(item => item.date.getTime() === d.getTime())
      if (target) {
        target.count++
      }
    }
  })

  return data.map(item => ({
    day: item.label,
    tasks: item.count
  }))
})

const xDailyFormatter = (i: number) => dailyChartData.value[i]?.day || ''

const recentTasks = computed(() => {
  return [...props.tasks]
    .filter(t => t.updated_at)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3)
    .map((t, idx) => {
      let statusBg = 'bg-gray-100 dark:bg-gray-800'
      let statusText = 'text-gray-500 dark:text-gray-300'
      const s = (t.status || '').toLowerCase()
      
      if (s === 'en cours' || s === 'in_progress') {
        statusBg = 'bg-blue-50 dark:bg-blue-900/30'
        statusText = 'text-blue-500'
      } else if (s === 'terminé' || s === 'done') {
        statusBg = 'bg-emerald-50 dark:bg-emerald-900/30'
        statusText = 'text-emerald-500'
      } else if (s === 'revue') {
        statusBg = 'bg-indigo-50 dark:bg-indigo-900/30'
        statusText = 'text-indigo-500'
      } else {
         statusBg = 'bg-slate-50 dark:bg-slate-800'
         statusText = 'text-slate-500'
      }
      
      const user = t.user || t.assignee
      const name = user?.name || 'Unassigned'
      const initials = name !== 'Unassigned' ? name.substring(0, 2).toUpperCase() : '?'
      
      const userColors = ['bg-blue-500', 'bg-indigo-600', 'bg-[#00A3CB]', 'bg-purple-500', 'bg-emerald-500']
      
      return {
        id: t.id,
        title: t.title,
        status: (t.status || 'À faire').toUpperCase(),
        statusBg,
        statusText,
        userInitials: initials,
        userBg: userColors[idx % userColors.length]
      }
    })
})
</script>

<template>
  <div class="flex flex-col gap-6 w-full font-sans tracking-wide">
    <!-- Top Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        v-for="(stat, index) in topStats" 
        :key="index"
        class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-5 flex flex-col gap-3 overflow-hidden transition-colors"
      >
        <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{{ stat.title }}</h3>
        <div class="text-3xl font-medium text-main dark:text-white tracking-tight">{{ stat.value }}</div>
      </div>
    </div>

    <!-- Middle Row: Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Monthly Line Chart Card -->
      <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-5 flex flex-col gap-3 overflow-hidden transition-colors">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-[12px] font-bold text-main dark:text-gray-300 uppercase tracking-widest">ACTIVITÉ MENSUELLE</h3>
          <span class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full font-medium border border-gray-100 dark:border-gray-700">{{ currentYear }}</span>
        </div>
        
        <div class="flex-1 w-full relative h-[250px]">
          <ClientOnly>
            <AreaChart
              :data="chartData"
              :categories="categories"
              :xFormatter="xFormatter"
              :height="240"
              class="w-full h-full"
            />
          </ClientOnly>
        </div>
      </div>

      <!-- Daily Line Chart Card -->
      <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-5 flex flex-col gap-3 overflow-hidden transition-colors">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-[12px] font-bold text-main dark:text-gray-300 uppercase tracking-widest">ACTIVITÉ QUOTIDIENNE</h3>
          <span class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full font-medium border border-gray-100 dark:border-gray-700">14 Jours</span>
        </div>
        
        <div class="flex-1 w-full relative h-[250px]">
          <ClientOnly>
            <AreaChart
              :data="dailyChartData"
              :categories="categories"
              :xFormatter="xDailyFormatter"
              :height="240"
              class="w-full h-full"
            />
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Recent Tasks -->
    <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-5 flex flex-col gap-3 overflow-hidden transition-colors">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-[12px] font-bold text-main dark:text-gray-300 uppercase tracking-widest">TÂCHES RÉCENTES</h3>
        <div class="flex items-center">
          <div class="flex -space-x-2 mr-3">
             <div v-for="(task, idx) in recentTasks" :key="idx" :class="['w-7 h-7 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-[#2A2A2D]', task.userBg]">
                {{ task.userInitials }}
             </div>
          </div>
          <span class="text-xs font-bold text-gray-400">{{ props.tasks.length > 3 ? '+' + (props.tasks.length - 3) : '' }}</span>
        </div>
      </div>

      <div class="flex flex-col">
        <div 
          v-for="(task, idx) in recentTasks" 
          :key="task.id"
          class="flex items-center justify-between py-4 px-2 cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-[#323235] transition-colors -mx-2"
          :class="{ 'border-b border-gray-50 dark:border-gray-800/50': idx !== recentTasks.length - 1 }"
          @click="navigateTo(`/organization/${route.params.org_id}/tasks/${task.id}`)"
        >
          <div class="flex items-center gap-4">
            <div class="w-5 h-5 rounded-full border-2 border-gray-100 dark:border-gray-700"></div>
            <span class="text-[13px] font-medium text-main dark:text-gray-200 font-mono tracking-tight truncate max-w-[200px] sm:max-w-none">{{ task.title }}</span>
          </div>
          <div class="flex items-center gap-4">
            <span :class="['text-[10px] font-bold px-3 py-1 rounded-md tracking-wider', task.statusBg, task.statusText]">
              {{ task.status }}
            </span>
            <div :class="['w-7 h-7 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-sm', task.userBg]">
              {{ task.userInitials }}
            </div>
          </div>
        </div>
        <div v-if="recentTasks.length === 0" class="py-4 text-center text-sm text-gray-400">
          Aucune tâche récente.
        </div>
      </div>
    </div>
  </div>
</template>
