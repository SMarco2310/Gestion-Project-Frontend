<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue';
import AppFooter from '~/components/AppFooter.vue';

const isSidebarCollapsed = useState('sidebarCollapsed', () => false)
</script>

<template>
  <div class="h-[100dvh] w-screen bg-canvas dark:bg-[#1D1D1D] pt-20 overflow-hidden flex flex-col text-main dark:text-gray-200 transition-all duration-300 ease-in-out" :class="isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'">
    <AppHeader />
    <main class="px-4 md:px-8 pt-0 pb-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>