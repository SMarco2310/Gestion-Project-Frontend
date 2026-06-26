<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to, from) {
      return navigateTo('/auth/login')
    }
  ]
})
</script>

<template>
  <div class="h-screen w-screen flex items-center justify-center bg-canvas dark:bg-[#1D1D1D]">
    <div class="animate-pulse text-secondary font-mono text-sm">Redirection vers la page de connexion...</div>
  </div>
</template>