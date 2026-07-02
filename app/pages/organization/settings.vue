<script setup lang="ts">
definePageMeta({
  layout: 'custom'
})

// MOCK DATA
const form = ref({
  name: 'Acme Corp',
  description: 'Innovative tech solutions.',
})

const isLoading = ref(false)

const handleSave = () => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}
</script>

<template>
  <div>
    <!-- Header Section -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <NuxtLink to="/organization" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Paramètres de l'Organisation</h1>
        </div>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1 ml-7">Modifiez les informations de votre organisation.</p>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left sidebar navigation for settings (optional, good for future expansion) -->
      <div class="lg:col-span-1 space-y-2">
        <button class="w-full text-left px-4 py-3 rounded-xl bg-canvas dark:bg-gray-800 text-main dark:text-white font-medium border border-form-border dark:border-gray-700 shadow-sm flex items-center justify-between">
          <span class="flex items-center gap-2"><Icon name="heroicons:information-circle" class="w-5 h-5" /> Informations Générales</span>
          <Icon name="heroicons:chevron-right" class="w-4 h-4 opacity-50" />
        </button>
        <button class="w-full text-left px-4 py-3 rounded-xl hover:bg-canvas dark:hover:bg-gray-800/50 text-secondary dark:text-gray-400 font-medium transition-colors flex items-center justify-between">
          <span class="flex items-center gap-2"><Icon name="heroicons:shield-check" class="w-5 h-5" /> Sécurité</span>
        </button>
        <button class="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 font-medium transition-colors flex items-center justify-between mt-4">
          <span class="flex items-center gap-2"><Icon name="heroicons:trash" class="w-5 h-5" /> Zone de danger</span>
        </button>
      </div>

      <!-- Main Settings Form -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- General Info Card -->
        <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 md:p-8 border border-form-border dark:border-gray-800 shadow-sm">
          <h2 class="text-xl font-bold text-main dark:text-white mb-6">Informations Générales</h2>
          
          <form @submit.prevent="handleSave" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Nom de l'organisation</label>
              <input v-model="form.name" type="text" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>

            <div>
              <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Description</label>
              <textarea v-model="form.description" rows="4" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"></textarea>
            </div>

            <div class="pt-4 flex justify-end">
              <button type="submit" class="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2" :disabled="isLoading">
                <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                Sauvegarder
              </button>
            </div>
          </form>
        </div>

        <!-- Danger Zone -->
        <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 md:p-8 border border-red-200 dark:border-red-900/30 shadow-sm">
          <h2 class="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Zone de Danger</h2>
          <p class="text-sm text-secondary dark:text-gray-400 mb-6">
            La suppression d'une organisation est permanente. Tous les projets, tâches et équipes associés seront supprimés.
          </p>
          <button class="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
            Supprimer l'organisation
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
