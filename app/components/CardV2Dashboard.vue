<script setup lang="ts">
// Data for Status Overview
const statusMetrics = [
  { label: 'Done', percentage: '65%', colorClass: 'bg-[#A6C4FF]', dotColor: '#A6C4FF' },
  { label: 'In Prog', percentage: '20%', colorClass: 'bg-[#8CA8F9]', dotColor: '#8CA8F9' },
  { label: 'To Do', percentage: '15%', colorClass: 'bg-[#FFB78C]', dotColor: '#FFB78C' }
]

// Data for Priority Breakdown
const priorities = [
  { label: 'Highest', count: 32, icon: 'ph:caret-double-up', iconColor: 'text-rose-400', barColor: 'bg-rose-300', percent: (32/50)*100 },
  { label: 'High', count: 45, icon: 'ph:caret-up', iconColor: 'text-amber-500', barColor: 'bg-[#3A3A3D]', percent: (45/50)*100 },
  { label: 'Medium', count: 50, icon: 'ph:equals', iconColor: 'text-blue-400', barColor: 'bg-[#3A3A3D]', percent: (50/50)*100 },
  { label: 'Low', count: 15, icon: 'ph:caret-down', iconColor: 'text-gray-400', barColor: 'bg-[#3A3A3D]', percent: (15/50)*100 },
]

// Data for Epic Progress
const epics = [
  { 
    id: 'ZEN-90', 
    title: 'Performance Optimization', 
    progress: 78, 
    badgeBg: 'bg-blue-500/10', 
    badgeText: 'text-blue-400',
    barColor: 'bg-[#A6C4FF]' 
  },
  { 
    id: 'ZEN-104', 
    title: 'User Authentication', 
    progress: 42, 
    badgeBg: 'bg-blue-500/10', 
    badgeText: 'text-blue-400',
    barColor: 'bg-[#A6C4FF]' 
  },
  { 
    id: 'ZEN-118', 
    title: 'Data Migration', 
    progress: 15, 
    badgeBg: 'bg-orange-500/10', 
    badgeText: 'text-orange-400',
    barColor: 'bg-[#FFB78C]' 
  },
]
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
    <!-- Status Overview -->
    <div class="bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl p-6 flex flex-col h-[300px]">
      <h3 class="text-sm font-semibold text-gray-200 mb-6">Status Overview</h3>
      
      <div class="flex-1 flex flex-col items-center justify-center gap-8">
        <!-- Donut Chart (CSS Conic Gradient) -->
        <div 
          class="w-32 h-32 rounded-full relative flex-shrink-0" 
          style="background: conic-gradient(
            #A6C4FF 0% 65%, 
            #8CA8F9 65% 85%, 
            #FFB78C 85% 100%
          );"
        >
          <!-- Inner circle to create donut hole -->
          <div class="absolute inset-[12px] bg-[#1A1A1C] rounded-full flex flex-col items-center justify-center">
            <span class="text-2xl font-bold text-white leading-tight">142</span>
            <span class="text-[10px] text-gray-400">Total Issues</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center justify-between w-full px-2">
          <div v-for="metric in statusMetrics" :key="metric.label" class="flex flex-col items-center gap-1.5">
            <div :class="['w-2.5 h-2.5 rounded-full', metric.colorClass]"></div>
            <span class="text-[11px] text-gray-400">{{ metric.percentage }} {{ metric.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Priority Breakdown -->
    <div class="bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl p-6 flex flex-col h-[300px]">
      <h3 class="text-sm font-semibold text-gray-200 mb-6">Priority Breakdown</h3>
      
      <div class="flex-1 flex flex-col justify-end gap-5">
        <div v-for="priority in priorities" :key="priority.label" class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 text-gray-200">
              <Icon :name="priority.icon" :class="['text-sm', priority.iconColor]" />
              <span>{{ priority.label }}</span>
            </div>
            <span class="text-gray-400">{{ priority.count }}</span>
          </div>
          <!-- Progress Bar -->
          <div class="h-1.5 w-full bg-[#222224] rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-500" 
              :class="priority.barColor"
              :style="{ width: `${priority.percent}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Epic Progress -->
    <div class="bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl p-6 flex flex-col h-[300px]">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-sm font-semibold text-gray-200">Epic Progress</h3>
        <button class="text-gray-400 hover:text-gray-200">
          <Icon name="ph:dots-three" class="text-lg" />
        </button>
      </div>

      <div class="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
        <div 
          v-for="epic in epics" 
          :key="epic.id"
          class="bg-[#202022] rounded-lg p-4 flex flex-col gap-3"
        >
          <div class="flex items-center gap-3">
            <span :class="['text-[10px] font-bold px-2 py-0.5 rounded', epic.badgeBg, epic.badgeText]">
              {{ epic.id }}
            </span>
            <span class="text-sm text-gray-200 truncate flex-1">{{ epic.title }}</span>
            <span class="text-xs text-gray-400">{{ epic.progress }}%</span>
          </div>
          <!-- Progress Bar -->
          <div class="h-1.5 w-full bg-[#2A2A2D] rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-500" 
              :class="epic.barColor"
              :style="{ width: `${epic.progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 10px;
}
</style>
