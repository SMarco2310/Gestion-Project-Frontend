<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue';
import AppFooter from '~/components/AppFooter.vue';
import { ref } from 'vue';

const { user, resendVerificationEmail } = useAuth();
const isSidebarCollapsed = useState('sidebarCollapsed', () => false)

const isResending = ref(false);
const resendSuccess = ref(false);
const resendError = ref('');

const handleResend = async () => {
  isResending.value = true;
  resendSuccess.value = false;
  resendError.value = '';
  try {
    await resendVerificationEmail();
    resendSuccess.value = true;
  } catch (err: any) {
    resendError.value = err?.data?.message || 'Erreur lors de l\'envoi.';
  } finally {
    isResending.value = false;
  }
};
</script>

<template>
  <div class="h-[100dvh] w-screen bg-canvas dark:bg-[#1D1D1D] pt-20 overflow-hidden flex flex-col text-main dark:text-gray-200 transition-all duration-300 ease-in-out" :class="isSidebarCollapsed ? 'md:pl-20' : 'md:pl-80'">
    <AppHeader />
    <main class="px-4 md:px-8 pt-4 pb-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
      <div v-if="user && !user.email_verified_at" class="bg-yellow-500/10 border border-yellow-500/50 text-yellow-700 dark:text-yellow-400 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-start sm:items-center gap-3">
          <Icon name="heroicons:exclamation-triangle" class="w-6 h-6 shrink-0 mt-0.5 sm:mt-0" />
          <div class="flex flex-col gap-1">
            <h3 class="font-bold text-sm">Veuillez vérifier votre adresse email</h3>
            <p class="text-xs opacity-90">Un lien de confirmation a été envoyé à <strong>{{ user.email }}</strong>. Cliquez dessus pour sécuriser votre compte.</p>
            <p v-if="resendSuccess" class="text-xs text-green-600 dark:text-green-400 font-bold mt-1">L'email a été renvoyé avec succès.</p>
            <p v-if="resendError" class="text-xs text-red-600 dark:text-red-400 font-bold mt-1">{{ resendError }}</p>
          </div>
        </div>
        <button @click="handleResend" :disabled="isResending" class="shrink-0 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold shadow-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-9 sm:ml-0">
          {{ isResending ? 'Envoi en cours...' : 'Renvoyer l\'email' }}
        </button>
      </div>

      <slot />
    </main>
    <AppFooter />
  </div>
</template>