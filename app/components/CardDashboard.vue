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

const cards: DashboardCard[] = [
  {
    title: 'COMPLETED',
    value: '24',
    subtitle: '+12% this week',
    subtitleIcon: 'ph:trend-up',
    icon: 'ph:check-circle',
    iconClass: 'text-blue-400',
    type: 'default'
  },
  {
    title: 'UPDATED',
    value: '112',
    subtitle: 'Last 24 hours',
    icon: 'ph:clock-counter-clockwise',
    iconClass: 'text-blue-400',
    type: 'default'
  },
  {
    title: 'CREATED',
    value: '18',
    subtitle: 'Since Monday',
    icon: 'ph:plus-circle',
    iconClass: 'text-gray-400',
    type: 'default'
  },
  {
    title: 'DUE SOON',
    value: '5',
    subtitle: 'Needs attention',
    icon: 'ph:warning',
    iconClass: 'text-rose-300',
    type: 'danger'
  }
]
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
    <div 
      v-for="(card, index) in cards" 
      :key="index"
      class="relative bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl p-5 flex flex-col gap-3 overflow-hidden shadow-sm hover:border-[#3A3A3D] transition-colors"
    >

      <!-- Header: Title and Icon -->
      <div class="flex items-center justify-between z-10">
        <h3 
          class="text-[11px] font-bold tracking-wider uppercase"
          :class="card.type === 'danger' ? 'text-rose-200' : 'text-gray-400'"
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
        :class="card.type === 'danger' ? 'text-rose-300' : 'text-white'"
      >
        {{ card.value }}
      </div>

      <!-- Subtitle -->
      <div 
        class="flex items-center gap-1.5 text-xs font-medium z-10"
        :class="card.type === 'danger' ? 'text-rose-400' : 'text-gray-400'"
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
