<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
    layout: "custom",
});

const route = useRoute();
const { $api } = useNuxtApp();
const { user } = useAuth();
import { useToast } from '~/composables/useToast'

const userProfile = ref<any>(null);
const isLoading = ref(true);

const handleVerifyEmail = () => {
    const { addToast } = useToast()
    addToast({
        type: 'success',
        title: 'E-mail de confirmation envoyé',
        message: 'Veuillez vérifier votre boîte de réception pour confirmer votre adresse e-mail.'
    })
    // Note: Backend endpoint integration required here
}

onMounted(async () => {
    try {
        const id = route.params.id;
        const data = await $api<any>(`/users/${id}`, { method: 'GET' });
        userProfile.value = data.user || data;
    } catch (e) {
        console.error("Failed to load user profile");
    } finally {
        isLoading.value = false;
    }
});

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Récemment';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
</script>

<template>
    <div class="w-full pt-4 pb-10">
        <!-- Header -->
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-main dark:text-gray-200">Profil Utilisateur</h1>
                <p class="text-secondary dark:text-gray-400 mt-1">Consultez les informations de ce membre.</p>
            </div>
            <div class="flex gap-4 w-full md:w-auto justify-end">
                <button @click="$router.back()" class="px-5 py-2 bg-form-border dark:bg-[#2D2D2F] hover:bg-gray-300 dark:hover:bg-gray-600 text-main dark:text-gray-300 rounded-md text-sm font-medium transition-colors">Retour</button>
            </div>
        </header>

        <div v-if="isLoading" class="flex justify-center items-center py-20">
            <Icon name="heroicons:arrow-path" class="w-8 h-8 text-secondary animate-spin" />
        </div>

        <!-- Main Content -->
        <div v-else-if="userProfile" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            <!-- Avatar Card -->
            <div class="lg:col-span-1 bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-lg">
                <div class="relative mb-4 mt-2">
                    <div class="w-24 h-24 rounded-2xl overflow-hidden bg-canvas dark:bg-[#161618] ring-1 ring-form-border dark:ring-gray-700 shadow-inner">
                        <img :src="userProfile?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name ?? 'U'}&chars=1`" alt="User Avatar" class="w-full h-full object-cover" />
                    </div>
                </div>
                <h2 class="text-xl font-bold text-main dark:text-gray-200 text-center">{{ userProfile?.name }}</h2>
                <div class="inline-flex items-center gap-1.5 px-2 py-1 mt-2 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-6">
                    {{ userProfile?.role || 'Membre' }}
                </div>
                
                <div class="w-full border-t border-form-border dark:border-gray-700/60 my-2"></div>
                
                <div class="flex justify-between w-full mt-4 px-2">
                    <div>
                        <p class="text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-1">Inscrit le</p>
                        <p class="text-main dark:text-gray-200 text-sm whitespace-nowrap">{{ formatDate(userProfile?.created_at) }}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-1 whitespace-nowrap">Fuseau horaire</p>
                        <p class="text-main dark:text-gray-200 text-sm whitespace-nowrap">UTC-08:00</p>
                    </div>
                </div>
            </div>

            <!-- Personal Info Card -->
            <div class="lg:col-span-2 bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-7 shadow-lg">
                <h3 class="text-lg font-bold text-main dark:text-gray-200 mb-8">Informations personnelles</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Nom complet</label>
                        <div class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm shadow-inner">
                            {{ userProfile?.name }}
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Adresse e-mail</label>
                        <div class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm shadow-inner flex justify-between items-center gap-2">
                            <span class="truncate">{{ userProfile?.email }}</span>
                            
                            <span v-if="userProfile?.email_verified_at" class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                                Vérifié
                            </span>
                            <div v-else class="flex items-center gap-2">
                                <span class="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                                    Non vérifié
                                </span>
                                <button v-if="user?.id === userProfile?.id" @click="handleVerifyEmail" class="text-xs font-bold text-primary hover:text-blue-600 dark:hover:text-blue-400 underline whitespace-nowrap ml-2">
                                    Confirmer l'e-mail
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Bio</label>
                    <div class="w-full min-h-[100px] bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm whitespace-pre-wrap shadow-inner">
                        {{ userProfile?.bio || 'Aucune bio renseignée.' }}
                    </div>
                </div>
            </div>
        </div>
        
        <div v-else class="text-center py-20 text-secondary dark:text-gray-500">
            Utilisateur introuvable.
        </div>
    </div>
</template>
