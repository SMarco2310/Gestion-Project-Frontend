<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const { getProjet } = useProjets()

const projet = await getProjet(route.params.id as string)

const isOpen = ref(true)

const handleClose = () => {
  isOpen.value = false
  navigateTo('/projets')
}
</script>

<template>
  <Transition name="slide-over">
    <div v-if="isOpen" class="fixed inset-0 z-40 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40" @click="handleClose" />

      <!-- Sheet -->
      <aside class="relative z-50 w-full max-w-2xl h-full bg-white dark:bg-[#161618] shadow-2xl overflow-y-auto p-8">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white">
              <Icon name="heroicons:briefcase" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-sm text-secondary dark:text-gray-400">PROJ-{{ projet?.id }}</p>
              <h2 class="text-xl font-bold text-main dark:text-gray-200">{{ projet?.name }}</h2>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button class="text-secondary hover:text-main dark:hover:text-gray-200">
              <Icon name="heroicons:pencil" class="w-5 h-5" />
            </button>
            <button class="text-secondary hover:text-red-500">
              <Icon name="heroicons:trash" class="w-5 h-5" />
            </button>
            <button class="text-secondary hover:text-main dark:hover:text-gray-200" @click="handleClose">
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <section class="mt-8">
          <h3 class="font-bold text-main dark:text-gray-200 mb-3">Description</h3>
          <p class="text-secondary dark:text-gray-400 whitespace-pre-line">{{ projet?.description }}</p>
        </section>

        <!-- Add Progression globale, Équipe, Activité récente sections here, 
             using real fields once your API returns them -->
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.slide-over-enter-active,
.slide-over-leave-active {
  transition: opacity 0.2s ease;
}
.slide-over-enter-from,
.slide-over-leave-to {
  opacity: 0;
}
</style>