<script setup lang="ts">
import { computed } from 'vue'

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

const chartPoints = computed(() => {
  const counts = new Array(12).fill(0)
  props.tasks.forEach(task => {
    if (task.created_at) {
      const d = new Date(task.created_at)
      if (d.getFullYear() === currentYear) {
        counts[d.getMonth()]++
      }
    }
  })
  
  const max = Math.max(...counts, 1)
  
  return counts.map((count, index) => {
    const x = (index / 11) * 550
    const y = 180 - (count / max) * 150
    return `${x},${y}`
  }).join(' ')
})


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
        class="bg-white dark:bg-[#2A2A2D] rounded-xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 flex flex-col justify-between"
      >
        <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{{ stat.title }}</h3>
        <div class="text-3xl font-medium text-main dark:text-white tracking-tight">{{ stat.value }}</div>
      </div>
    </div>

    <!-- Middle Row: Charts -->
    <div class="grid grid-cols-1 gap-6">
      
      <!-- Line Chart Card -->
      <div class="bg-white dark:bg-[#2A2A2D] rounded-xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 flex flex-col h-[350px]">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-[12px] font-bold text-main dark:text-gray-300 uppercase tracking-widest">ACTIVITÉ MENSUELLE</h3>
          <span class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full font-medium border border-gray-100 dark:border-gray-700">{{ currentYear }}</span>
        </div>
        
        <div class="flex-1 w-full relative">
          <!-- Custom SVG Line Chart -->
          <svg viewBox="0 -10 550 180" class="w-full h-[85%] absolute bottom-8 overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.15" />
                <stop offset="100%" stop-color="#3B82F6" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path 
              :d="`M0,180 L${chartPoints} L550,180 Z`" 
              fill="url(#lineGradient)" 
            />
            <polyline 
              :points="chartPoints" 
              fill="none" 
              stroke="#3B82F6" 
              stroke-width="2.5" 
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          
          <!-- X Axis Labels -->
          <div class="absolute bottom-0 w-full flex justify-between text-[10px] font-bold text-gray-300 dark:text-gray-600 px-1">
            <span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span><span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Recent Tasks -->
    <div class="bg-white dark:bg-[#2A2A2D] rounded-xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-800">
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
          class="flex items-center justify-between py-4"
          :class="{ 'border-b border-gray-50 dark:border-gray-800/50': idx !== recentTasks.length - 1 }"
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
