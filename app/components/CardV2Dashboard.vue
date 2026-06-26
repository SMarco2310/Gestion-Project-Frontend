<script setup lang="ts">
const props = defineProps<{
  statusMetrics: Array<{ label: string; percentage: string; colorClass: string }>
  priorities: Array<{ label: string; count: number; icon: string; iconColor: string; barColor: string; percent: number }>
  epics: Array<{ id: string; title: string; progress: number; badgeBg: string; badgeText: string; barColor: string }>
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
    <!-- Status Overview -->
    <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-6 flex flex-col h-[300px]">
      <h3 class="text-sm font-semibold text-main dark:text-gray-200 mb-6">Status Overview</h3>
      
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
          <div class="absolute inset-[12px] bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-full flex flex-col items-center justify-center shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]">
            <span class="text-2xl font-bold text-main dark:text-white leading-tight">142</span>
            <span class="text-[10px] text-secondary dark:text-gray-400">Total Issues</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center justify-between w-full px-2">
          <div v-for="metric in statusMetrics" :key="metric.label" class="flex flex-col items-center gap-1.5">
            <div :class="['w-2.5 h-2.5 rounded-full', metric.colorClass]"></div>
            <span class="text-[11px] text-secondary dark:text-gray-400">{{ metric.percentage }} {{ metric.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Priority Breakdown -->
    <div class="neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-6 flex flex-col h-[300px]">
      <h3 class="text-sm font-semibold text-main dark:text-gray-200 mb-6">Priority Breakdown</h3>
      
      <div class="flex-1 flex flex-col justify-end gap-5">
        <div v-for="priority in priorities" :key="priority.label" class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 text-main dark:text-gray-200">
              <Icon :name="priority.icon" :class="['text-sm', priority.iconColor]" />
              <span>{{ priority.label }}</span>
            </div>
            <span class="text-secondary dark:text-gray-400">{{ priority.count }}</span>
          </div>
          <!-- Progress Bar -->
          <div class="h-1.5 w-full neo-input bg-[#E5E7EB] dark:bg-[#1A1A1D] rounded-full overflow-hidden">
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
          :key="epic.id"
          class="bg-white dark:bg-[#323235] shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-lg p-4 flex flex-col gap-3 border border-black/5 dark:border-white/5"
        >
          <div class="flex items-center gap-3">
            <span :class="['text-[10px] font-bold px-2 py-0.5 rounded', epic.badgeBg, epic.badgeText]">
              {{ epic.id }}
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
