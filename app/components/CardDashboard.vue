<script setup lang="ts">
export interface DashboardCard {
  title: string
  value: string | number
  subtitle: string
  subtitleIcon?: string
  icon: string
  iconClass?: string
  type?: 'default' | 'danger'
}


const props = defineProps<{ cards: DashboardCard[] }>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
    <div 
      v-for="(card, index) in cards" 
      :key="index"
      class="relative neo-card bg-gradient-to-b from-white to-gray-50 dark:from-[#2A2A2D] dark:to-[#222224] rounded-xl p-5 flex flex-col gap-3 overflow-hidden transition-colors shadow-md"
    >

      <!-- Header: Title and Icon -->
      <div class="flex items-center justify-between z-10">
        <h3 
          class="text-[11px] font-bold tracking-wider uppercase"
          :class="card.type === 'danger' ? 'text-rose-600 dark:text-rose-200' : 'text-secondary dark:text-gray-400'"
        >
          {{ card.title }}
        </h3>
        <Icon 
          :name="card.icon" 
          class="text-[1.35rem]" 
          :class="card.iconClass"
        />
      </div>

      <!-- Value -->
      <div 
        class="text-4xl font-bold mt-1 z-10"
        :class="card.type === 'danger' ? 'text-rose-500 dark:text-rose-300' : 'text-main dark:text-white'"
      >
        {{ card.value }}
      </div>

      <!-- Subtitle -->
      <div 
        class="flex items-center gap-1.5 text-xs font-medium z-10"
        :class="card.type === 'danger' ? 'text-rose-500 dark:text-rose-400' : 'text-secondary dark:text-gray-400'"
      >
        <Icon 
          v-if="card.subtitleIcon" 
          :name="card.subtitleIcon" 
          class="text-sm"
          :class="card.type === 'danger' ? 'text-rose-400' : 'text-amber-600'" 
        />
        <span>{{ card.subtitle }}</span>
      </div>
    </div>
  </div>
</template>
