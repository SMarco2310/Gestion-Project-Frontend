<script setup lang="ts">
import authGlobal from '~/middleware/auth.global';

definePageMeta({
  // middleware: [authGlobal]
})
</script>

<template>
  <div class="h-screen w-screen flex items-center justify-center bg-canvas dark:bg-[#1D1D1D]">
    <div class="animate-pulse text-secondary font-mono text-sm">Redirection vers la page de connexion...</div>
  </div>
</template>