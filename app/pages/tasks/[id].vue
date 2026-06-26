<script setup lang="ts">
definePageMeta({
//   middleware: 'auth',
})

const route = useRoute()
const isOpen = ref(true)

const task = computed(() => {
  const tasks = useState<any[]>('tasks-detail-data', () => [])
  return tasks.value.find((item) => item.id === route.params.id) || null
})

const handleClose = () => {
  isOpen.value = false
  navigateTo('/tasks')
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60" @click.self="handleClose">
      <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-[#161618] shadow-2xl p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white">
              <Icon name="heroicons:clipboard-document-list" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-sm text-secondary dark:text-gray-400">TÂCHE {{ task?.id }}</p>
              <h2 class="text-xl font-bold text-main dark:text-gray-200">{{ task?.title || 'Détails de la tâche' }}</h2>
            </div>
          </div>
          <button class="text-secondary hover:text-main dark:hover:text-gray-200" @click="handleClose">
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <section class="mt-8 space-y-6">
          <div>
            <h3 class="font-bold text-main dark:text-gray-200 mb-3">Description</h3>
            <p class="text-secondary dark:text-gray-400 whitespace-pre-line">
              {{ task?.description || 'Aucune description fournie pour cette tâche.' }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-lg border border-form-border dark:border-gray-700 p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-secondary dark:text-gray-400 mb-2">Statut</p>
              <p class="text-main dark:text-gray-200">{{ task?.status || 'à faire' }}</p>
            </div>
            <div class="rounded-lg border border-form-border dark:border-gray-700 p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-secondary dark:text-gray-400 mb-2">Priorité</p>
              <p class="text-main dark:text-gray-200">{{ task?.priority || 'moyen' }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>