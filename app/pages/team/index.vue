<script setup lang="ts">
definePageMeta({
  layout: 'custom'
})
</script>

<template>
  <div>
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Équipe</h1>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1">Gérez les membres de votre équipe.</p>
      </div>
    </section>

    <div class="flex-1 flex items-center justify-center p-8 mt-20">
      <div class="text-center">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon name="heroicons:user-group" class="w-8 h-8" />
        </div>
        <h2 class="text-xl font-bold text-main dark:text-white mb-2">Bientôt disponible</h2>
        <p class="text-secondary dark:text-gray-400 max-w-md mx-auto">
          La page de gestion d'équipe est en cours de construction. Vous pourrez bientôt inviter des membres et gérer leurs permissions ici.
        </p>
      </div>
    </div>
  </div>
</template>
