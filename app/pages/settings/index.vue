<script setup lang="ts">
import { ref, onMounted } from 'vue'
import useTags from '~/composables/useTags'

definePageMeta({
  layout: 'custom'
})

const { tags, getTags, createTag, deleteTag, isLoading } = useTags()

const newTagName = ref('')
const newTagColor = ref('#3B82F6') // Default to blue

onMounted(async () => {
  await getTags()
})

const handleCreateTag = async () => {
  if (!newTagName.value.trim()) return
  try {
    await createTag({ name: newTagName.value.trim(), color: newTagColor.value })
    newTagName.value = ''
    newTagColor.value = '#3B82F6'
  } catch (e) {
    console.error(e)
  }
}

const handleDeleteTag = async (id: any) => {
  if (confirm('Voulez-vous vraiment supprimer cette étiquette ?')) {
    await deleteTag(id)
  }
}
</script>

<template>
  <div>
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Paramètres</h1>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1">Gérez vos préférences et paramètres.</p>
      </div>
    </section>

    <div class="max-w-4xl space-y-8">
        
        <!-- Tags Section -->
        <section class="neo-card bg-white dark:bg-[#1A1A1D] rounded-xl p-6 border border-black/5 dark:border-white/5">
          <div class="mb-6">
            <h2 class="text-lg font-bold text-main dark:text-white flex items-center gap-2">
              <Icon name="heroicons:tag" class="w-5 h-5 text-primary" />
              Gestion des Étiquettes
            </h2>
            <p class="text-sm text-secondary dark:text-gray-400 mt-1">Créez et supprimez vos étiquettes personnalisées.</p>
          </div>

          <div class="flex flex-col md:flex-row gap-4 mb-8">
            <div class="flex-1">
              <input 
                v-model="newTagName" 
                type="text" 
                placeholder="Nom de l'étiquette..."
                class="w-full bg-[#F4F5F7] dark:bg-[#121212] neo-input text-main dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                @keyup.enter="handleCreateTag"
              />
            </div>
            <div class="flex items-center gap-3">
              <input 
                v-model="newTagColor" 
                type="color" 
                class="h-10 w-10 p-1 rounded-lg bg-[#F4F5F7] dark:bg-[#121212] border-0 cursor-pointer"
              />
              <button 
                @click="handleCreateTag"
                :disabled="!newTagName.trim() || isLoading"
                class="shrink-0 btn-primary text-white transition-all cursor-pointer flex items-center justify-center px-4 py-2 rounded-md whitespace-nowrap neo-emboss active:neo-inset hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                <Icon v-else name="heroicons:plus" class="w-5 h-5" />
                <span class="px-2 font-bold uppercase tracking-wider">AJOUTER</span>
              </button>
            </div>
          </div>

          <!-- Tags List -->
          <div v-if="isLoading && tags.length === 0" class="flex justify-center py-8">
            <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
          </div>
          
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div 
              v-for="tag in tags" :key="tag.id"
              class="flex items-center justify-between p-3 rounded-lg border border-black/5 dark:border-white/5 bg-[#F4F5F7] dark:bg-[#121212] group"
            >
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: tag.color || '#9CA3AF' }"></div>
                <span class="text-sm font-bold text-main dark:text-gray-200">{{ tag.name }}</span>
              </div>
              <button 
                v-if="!tag.is_default"
                @click="handleDeleteTag(tag.id)"
                class="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                title="Supprimer"
              >
                <Icon name="heroicons:trash" class="w-4 h-4" />
              </button>
              <span v-else class="text-[10px] uppercase font-bold text-secondary dark:text-gray-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">Défaut</span>
            </div>
          </div>
          <div v-if="!isLoading && tags.length === 0" class="text-center py-8 text-secondary dark:text-gray-500 text-sm">
            Aucune étiquette trouvée.
          </div>
        </section>
        
      </div>
  </div>
</template>
