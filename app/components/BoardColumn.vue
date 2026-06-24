<script setup lang="ts">
import { computed } from 'vue'

export interface TaskTag {
  label: string
  colorClass: string
  icon: string
}

export interface TaskAssignee {
  initials?: string
  colorClass: string
  icon?: string
}

export interface Task {
  id: string
  title: string
  tag: TaskTag
  reference: string
  issueTypeIcon?: string
  issueTypeColorClass?: string
  statusIcon?: string
  statusColorClass?: string
  assignee: TaskAssignee
}

const props = defineProps<{
  title: string
  items?: Task[]
  isDone?: boolean // Used for column checkmark and crossed-out text
  allowCreate?: boolean // Used to show the '+ Create' button when empty
}>()

const itemCount = computed(() => props.items?.length || 0)
</script>

<template>
  <div class="flex flex-col w-[340px] bg-[#161618] rounded-lg overflow-hidden shadow-sm h-full max-h-[85vh]">
    <!-- Header -->
    <div class="px-4 py-4 flex items-center gap-3">
      <h2 class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ title }}</h2>
      <span v-if="itemCount > 0" class="bg-[#27272A] text-gray-300 text-xs font-bold px-2 py-0.5 rounded flex items-center justify-center min-w-[24px]">
        {{ itemCount }}
      </span>
      <Icon v-if="isDone" name="ph:check" class="text-emerald-500 ml-auto text-lg font-bold" />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
      <!-- Empty State with Create Button -->
      <div v-if="itemCount === 0 && allowCreate" class="pt-2 pl-1">
        <button class="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm font-medium w-full text-left">
          <Icon name="ph:plus" class="text-lg" />
          Create
        </button>
      </div>

      <!-- Loaded State -->
      <div v-else-if="itemCount > 0" class="flex flex-col gap-2.5">
        <div 
          v-for="item in items" 
          :key="item.id"
          class="bg-[#222224] hover:bg-[#2A2A2D] transition-colors rounded-lg p-3.5 cursor-pointer border border-transparent hover:border-[#3A3A3D] flex flex-col gap-3 group"
        >
          <!-- Title -->
          <h3 class="text-gray-200 text-[15px] leading-snug">
            {{ item.title }}
          </h3>

          <!-- Tag -->
          <div class="flex items-start">
             <div :class="['inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider', item.tag.colorClass]">
                <Icon :name="item.tag.icon" class="text-sm" />
                {{ item.tag.label }}
             </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between mt-1">
             <!-- Reference -->
             <div class="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                <Icon :name="item.issueTypeIcon || 'ph:bookmark-simple-fill'" :class="['text-sm', item.issueTypeColorClass || 'text-emerald-600']" />
                <span :class="{ 'line-through text-gray-500': isDone }">{{ item.reference }}</span>
             </div>

             <!-- Assignee & Status -->
             <div class="flex items-center gap-2.5">
                <Icon 
                  v-if="item.statusIcon" 
                  :name="item.statusIcon" 
                  :class="['text-sm', item.statusColorClass]" 
                />
                
                <!-- Assignee Avatar -->
                <div 
                  v-if="item.assignee.initials"
                  :class="['w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white', item.assignee.colorClass]"
                >
                  {{ item.assignee.initials }}
                </div>
                <div v-else-if="item.assignee.icon" class="w-6 h-6 rounded-full bg-[#3A3A3D] flex items-center justify-center text-gray-400">
                  <Icon :name="item.assignee.icon" class="text-xs" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar styling for a cleaner look */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #52525b;
}
</style>