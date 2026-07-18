<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: ''
  },
  options: {
    type: Array as () => Array<{ label: string, value: any, icon?: string, iconColor?: string }>,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Sélectionner'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  buttonClass: {
    type: String,
    default: 'w-full px-4 py-2.5 rounded-lg bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 flex justify-between items-center'
  },
  dropdownClass: {
    type: String,
    default: 'w-full mt-1 bg-white dark:bg-[#1D1D1D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

const selectedOption = computed(() => {
  return props.options.find(option => option.value === props.modelValue)
})

const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

const selectOption = (option: any) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative" ref="selectRef">
    <button 
      type="button"
      :class="[buttonClass, disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']"
      @click="toggleDropdown"
      :disabled="disabled"
    >
      <div class="flex items-center gap-2 truncate">
        <template v-if="selectedOption">
          <Icon v-if="selectedOption.icon" :name="selectedOption.icon" :class="['w-4 h-4', selectedOption.iconColor || 'text-secondary']" />
          <span class="truncate">{{ selectedOption.label }}</span>
        </template>
        <span v-else class="text-secondary dark:text-gray-400 truncate">{{ placeholder }}</span>
      </div>
      <Icon name="ph:caret-down" :class="['w-4 h-4 text-secondary dark:text-gray-400 transition-transform duration-200', isOpen ? 'rotate-180' : '']" />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="isOpen" :class="['absolute left-0 right-0 overflow-hidden', dropdownClass]">
        <ul class="max-h-60 overflow-y-auto custom-scrollbar p-1">
          <li 
            v-for="option in options" 
            :key="String(option.value)"
            @click="selectOption(option)"
            :class="[
              'px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-colors',
              modelValue === option.value 
                ? 'bg-primary/10 text-primary font-medium dark:bg-primary/20 dark:text-blue-400' 
                : 'text-main dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
          >
            <Icon v-if="option.icon" :name="option.icon" :class="['w-4 h-4', option.iconColor || 'text-secondary']" />
            <span class="truncate">{{ option.label }}</span>
            <Icon v-if="modelValue === option.value" name="ph:check" class="w-4 h-4 ml-auto" />
          </li>
          <li v-if="options.length === 0" class="px-3 py-2 text-sm text-secondary text-center italic">
            Aucune option
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
