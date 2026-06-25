<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue';
import AppFooter from '~/components/AppFooter.vue';
</script>

<template>
  <div class="min-h-screen w-screen bg-canvas dark:bg-[#1D1D1D] pt-24 md:pl-64 overflow-x-hidden flex flex-col text-main dark:text-gray-200">
    <AppHeader />
    <main class="p-8 flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>