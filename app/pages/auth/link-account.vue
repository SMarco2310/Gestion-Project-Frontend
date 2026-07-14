<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const { getProfile, token } = useAuth()
const { addToast } = useToast()

const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLinkAccount = async () => {
  const linkToken = route.query.token as string
  if (!linkToken) {
    errorMessage.value = "Le lien de vérification est invalide ou manquant."
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { $api } = useNuxtApp()
    const data = await $api<{ success: boolean, token: string }>('/auth/custom/link-account', {
      method: 'POST',
      body: {
        token: linkToken,
        password: password.value
      }
    })

    if (data.success && data.token) {
      token.value = data.token
      await getProfile()
      addToast({ title: 'Compte lié', message: 'Votre compte a été lié avec succès.', type: 'success' })
      navigateTo('/organizations')
    }
  } catch (error: any) {
    errorMessage.value = error.data?.message || 'Mot de passe incorrect ou erreur réseau.'
  } finally {
    loading.value = false
  }
}
</script>



<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-[#151515]">
    <div class="w-full max-w-md bg-white dark:bg-[#1D1D1D] rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-8">
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
          <Icon name="heroicons:link" class="w-6 h-6" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Associer votre compte</h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          Un compte avec cette adresse e-mail existe déjà. Veuillez entrer votre mot de passe pour confirmer qu'il s'agit bien de vous et lier votre compte.
        </p>
      </div>

      <div v-if="errorMessage" class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800/50 flex items-center gap-2">
        <Icon name="heroicons:exclamation-circle" class="w-5 h-5 flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleLinkAccount" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
          <input 
            v-model="password" 
            type="password" 
            class="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
            placeholder="Entrez votre mot de passe"
            required
          />
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:brightness-110 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg v-if="loading" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          {{ loading ? 'Vérification...' : 'Lier mon compte' }}
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <button @click="navigateTo('/auth/login')" class="text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">
          Annuler et retourner à la connexion
        </button>
      </div>
    </div>
  </div>
</template>

