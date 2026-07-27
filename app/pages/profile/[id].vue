<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

definePageMeta({
    layout: "custom",
});

const route = useRoute();
const { $api } = useNuxtApp();
const { user } = useAuth();
import { useToast } from '~/composables/useToast'

const config = useRuntimeConfig();
const apiBase = config.public.apiBase as string;

const userProfile = ref<any>(null);
const assignedTasks = ref<any[]>([]);
const isLoading = ref(true);
const { activeOrganization } = useOrganizations();
const { activeWorkspace } = useWorkspaces();

const filteredTeams = computed(() => {
    if (!userProfile.value?.teams) return [];
    const currentOrgId = activeOrganization.value?.id || route.params.org_id;
    if (currentOrgId) {
        return userProfile.value.teams.filter((team: any) => team.organization_id === currentOrgId);
    }
    return userProfile.value.teams;
});

const navigateToTask = (task: any) => {
    const oId = activeOrganization.value?.id || route.params.org_id;
    const wId = task.workspace_id || task.projet?.workspace_id || activeWorkspace.value?.id || route.params.workspace_id;
    
    if (oId && wId) {
        navigateTo(`/organization/${oId}/workspace/${wId}/tasks/${task.id}`);
    } else {
        const { addToast } = useToast();
        addToast({ type: 'error', title: 'Erreur', message: 'Espace de travail introuvable pour cette tâche.' });
    }
}

const { goBack: smartBack } = useSmartBack()
const goBack = () => {
    const orgId = activeOrganization.value?.id || route.params.org_id;
    if (orgId) {
        smartBack(`/organization/${orgId}`);
    } else {
        smartBack('/organizations');
    }
}

const handleVerifyEmail = () => {
    const { addToast } = useToast()
    addToast({
        type: 'success',
        title: 'E-mail de confirmation envoyé',
        message: 'Veuillez vérifier votre boîte de réception pour confirmer votre adresse e-mail.'
    })
}

onMounted(async () => {
    try {
        const id = route.params.id;
        const [profileData, tasksData] = await Promise.all([
            $api<any>(`/users/${id}`, { method: 'GET' }),
            $api<any>(`/taches?assignee_id=${id}`, { method: 'GET' }).catch(() => [])
        ]);
        
        userProfile.value = profileData.user || profileData;
        
        // Extract tasks safely
        const rawTasks = Array.isArray(tasksData) ? tasksData : (tasksData.taches ?? tasksData.data?.data ?? tasksData.data ?? tasksData.tasks ?? []);
        assignedTasks.value = rawTasks;
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
    month: 'short',
    year: 'numeric'
  });
}

const isDone = (status: string) => ['terminé', 'terminée', 'done', 'achevé'].includes(status.toLowerCase());

const getStatusBadge = (status: string) => {
  if (isDone(status)) {
    return { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'TERMINÉ', dot: 'bg-emerald-500' }
  } else if (['en révision', 'in review', 'review'].includes(status.toLowerCase())) {
    return { bg: 'bg-[#E0E7FF] dark:bg-[#E0E7FF]', text: 'text-[#4338CA] dark:text-[#4338CA]', label: 'EN RÉVISION', dot: 'bg-[#6366F1]' }
  } else if (['en cours', 'in progress'].includes(status.toLowerCase())) {
    return { bg: 'bg-primary/10 dark:bg-primary/20', text: 'text-primary dark:text-blue-400', label: 'EN COURS', dot: 'bg-primary' }
  } else {
    return { bg: 'bg-[#FFEDD5] dark:bg-[#FFEDD5]', text: 'text-[#C2410C] dark:text-[#C2410C]', label: 'À FAIRE', dot: 'bg-[#F59E0B]' }
  }
}

</script>

<template>
    <div class="w-full pt-4 pb-12 px-4 md:px-6 lg:px-8">
        <!-- Header -->
        <header class="mb-6">
            <button @click="goBack()" class="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-[#2A2A2D] flex items-center justify-center bg-white dark:bg-[#1D1D1D] text-main dark:text-white shadow-md hover:scale-105 hover:shadow-lg transition-all" title="Retour">
                <Icon name="heroicons:chevron-left" class="w-5 h-5 font-bold" />
            </button>
        </header>

        <div v-if="isLoading" class="flex justify-center items-center py-20">
            <Icon name="heroicons:arrow-path" class="w-8 h-8 text-secondary animate-spin" />
        </div>

        <!-- Main Content -->
        <div v-else-if="userProfile" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left Column: Profile Card -->
            <div class="lg:col-span-4 flex flex-col gap-6">
                <!-- Top Card -->
                <div class="bg-card dark:bg-[#1A1A1D] border border-form-border dark:border-gray-800 rounded-3xl p-8 flex flex-col shadow-sm relative overflow-hidden">
                    
                    <div class="flex flex-col items-center">
                        <div class="relative mb-4">
                            <!-- Outer Ring -->
                            <div class="w-24 h-24 rounded-[32px] overflow-hidden bg-white ring-2 ring-primary/30 flex items-center justify-center shadow-lg p-1.5">
                                <div class="w-full h-full rounded-[24px] overflow-hidden bg-[#EEF2FF] flex items-center justify-center">
                                    <img v-if="userProfile?.profile_picture" :src="userProfile.profile_picture.startsWith('http') ? userProfile.profile_picture : apiBase.replace('/api', '') + userProfile.profile_picture" alt="User Avatar" class="w-full h-full object-cover" />
                                    <span v-else class="text-3xl font-bold text-primary">
                                        {{ (userProfile?.last_name || 'U').charAt(0).toUpperCase() + (userProfile?.first_name || '').charAt(0).toUpperCase() }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <h2 class="text-xl font-bold text-main dark:text-gray-200 text-center tracking-tight">{{ userProfile?.last_name }} {{ userProfile?.first_name }}</h2>
                        <p class="text-sm font-medium text-secondary dark:text-gray-400 mt-1">{{ userProfile?.role || 'Ingénieure produit' }}</p>
                    </div>
                    
                    <div class="w-full border-t border-form-border dark:border-gray-800/80 my-6"></div>
                    
                    <div class="flex justify-between w-full">
                        <div>
                            <p class="text-[9px] font-bold text-secondary dark:text-gray-500 uppercase tracking-widest mb-1.5">Inscrit le</p>
                            <p class="text-main dark:text-gray-300 text-[13px] font-mono tracking-wide">{{ formatDate(userProfile?.created_at) }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[9px] font-bold text-secondary dark:text-gray-500 uppercase tracking-widest mb-1.5">Fuseau</p>
                            <p class="text-main dark:text-gray-300 text-[13px] font-mono tracking-wide">UTC+00:00</p>
                        </div>
                    </div>
                </div>

                <!-- Bottom Card: Contact / Team info -->
                <div class="bg-card dark:bg-[#1A1A1D] border border-form-border dark:border-gray-800 rounded-3xl p-8 flex flex-col shadow-sm">
                    <div class="mb-6">
                        <p class="text-[9px] font-bold text-secondary dark:text-gray-500 uppercase tracking-widest mb-2">{{ filteredTeams.length > 1 ? 'Équipes' : 'Équipe' }}</p>
                        <div v-if="filteredTeams.length > 0" class="flex flex-wrap gap-2 mt-1">
                            <div v-for="team in filteredTeams" :key="team.id" class="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg text-xs font-bold">
                                <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />
                                {{ team.name }}
                            </div>
                        </div>
                        <p v-else class="text-secondary dark:text-gray-500 text-sm italic">Aucune équipe</p>
                    </div>
                    <div>
                        <p class="text-[9px] font-bold text-secondary dark:text-gray-500 uppercase tracking-widest mb-2">Adresse e-mail</p>
                        <p class="text-secondary dark:text-gray-400 text-sm">{{ userProfile?.email }}</p>
                    </div>
                </div>
            </div>

            <!-- Right Column: Content Cards -->
            <div class="lg:col-span-8 flex flex-col gap-6">
                <!-- About Box -->
                <div class="bg-card dark:bg-[#1A1A1D] border border-form-border dark:border-gray-800 rounded-3xl p-8 shadow-sm">
                    <h3 class="text-lg font-bold text-main dark:text-gray-200 mb-4 tracking-tight">À propos</h3>
                    <p class="text-sm text-secondary dark:text-gray-400 leading-relaxed max-w-3xl">
                        {{ userProfile?.bio || "Ingénieure produit chez Neo Start Technology. Passionnée par les systèmes distribués et l'expérience développeur." }}
                    </p>
                </div>

                <!-- Assigned Tasks Box -->
                <div class="bg-card dark:bg-[#1A1A1D] border border-form-border dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden flex flex-col flex-1">
                    <div class="p-6 border-b border-form-border dark:border-gray-800/50 flex justify-between items-center">
                        <h3 class="text-sm font-bold text-main dark:text-gray-200 tracking-tight">Tâches assignées</h3>
                        <span class="text-xs font-bold text-secondary dark:text-gray-500">{{ assignedTasks.length }}</span>
                    </div>
                    
                    <div class="p-4 flex-1">
                        <div v-if="assignedTasks.length > 0" class="flex flex-col gap-2">
                            <div 
                                v-for="task in assignedTasks" 
                                :key="task.id"
                                @click="navigateToTask(task)"
                                class="flex items-center justify-between p-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                            >
                                <div class="flex items-center gap-4">
                                    <div class="w-1.5 h-1.5 rounded-full" :class="getStatusBadge(task.status).dot"></div>
                                    <span class="text-sm font-medium text-main dark:text-gray-300 group-hover:text-primary transition-colors line-clamp-1 max-w-md">{{ task.title }}</span>
                                </div>
                                <div class="flex items-center gap-4 shrink-0">
                                    <span class="px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase" :class="[getStatusBadge(task.status).bg, getStatusBadge(task.status).text]">
                                        {{ getStatusBadge(task.status).label }}
                                    </span>
                                    <span class="text-xs font-mono text-secondary dark:text-gray-500">{{ task.reference_code || `TSK-${String(task.id).padStart(3, '0')}` }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="py-12 flex flex-col items-center justify-center text-secondary dark:text-gray-500">
                            <Icon name="heroicons:clipboard-document-list" class="w-8 h-8 mb-3 opacity-50" />
                            <p class="text-sm">Aucune tâche assignée.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        
        <div v-else class="text-center py-20 text-secondary dark:text-gray-500">
            Utilisateur introuvable.
        </div>
    </div>
</template>
