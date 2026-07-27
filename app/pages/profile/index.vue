<script setup lang="ts">
import { ref } from 'vue'
const {user,updateProfile,logout,uploadProfilePicture}=useAuth();
const { restartTour } = useTour();
const colorMode = useColorMode()


const router = useRouter();
const route = useRoute();

const config = useRuntimeConfig();
const apiBase = config.public.apiBase as string;

const isFromOrg = route.query.source === 'org';

setPageLayout(isFromOrg ? false as any : 'custom');

const firstName = ref(user.value?.first_name ?? '');
const lastName = ref(user.value?.last_name ?? '');
const email = ref(user.value?.email ?? '');
const bio = ref(user.value?.bio ?? '');

const reminderDaysBeforeStart = ref(user.value?.reminder_days_before_start ?? 2);
const reminderTimeStart = ref(user.value?.reminder_time_start ? user.value.reminder_time_start.substring(0, 5) : '08:00');
const reminderDaysBeforeEnd = ref(user.value?.reminder_days_before_end ?? 2);
const reminderTimeEnd = ref(user.value?.reminder_time_end ? user.value.reminder_time_end.substring(0, 5) : '08:00');

watch(() => user.value, (newUser) => {
  if (newUser) {
    firstName.value = newUser.first_name;
    lastName.value = newUser.last_name;
    email.value = newUser.email;
    bio.value = newUser.bio || '';
    reminderDaysBeforeStart.value = newUser.reminder_days_before_start ?? 2;
    reminderTimeStart.value = newUser.reminder_time_start ? newUser.reminder_time_start.substring(0, 5) : '08:00';
    reminderDaysBeforeEnd.value = newUser.reminder_days_before_end ?? 2;
    reminderTimeEnd.value = newUser.reminder_time_end ? newUser.reminder_time_end.substring(0, 5) : '08:00';
  }
}, { immediate: true });

const { addToast } = useToast();

const HandleProfileUpdate = async ()=>{
    
    try {
        if(firstName.value==''&& lastName.value=='' && email.value==''){
        return
        }
        await updateProfile(firstName.value, lastName.value, email.value, bio.value, {
            reminder_days_before_start: reminderDaysBeforeStart.value,
            reminder_time_start: reminderTimeStart.value,
            reminder_days_before_end: reminderDaysBeforeEnd.value,
            reminder_time_end: reminderTimeEnd.value
        });
        addToast({ title: 'Profil mis à jour', message: 'Vos informations ont été enregistrées avec succès.', type: 'success' })

    } catch (error) {
        console.error('Failed to update profile:', error);
        addToast({ title: 'Erreur', message: 'Impossible de mettre à jour le profil.', type: 'error' })
    } finally {
        // loading.value = false;
    }
}
const handleCancel = () => {
  firstName.value = user.value?.first_name ?? '';
  lastName.value = user.value?.last_name ?? '';
  email.value = user.value?.email ?? '';
  bio.value = user.value?.bio ?? '';
}

const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0] as File
    if (!file) return
    try {
      await uploadProfilePicture(file)
      addToast({ type: 'success', title: 'Avatar modifié', message: 'Votre photo de profil a été mise à jour avec succès.' })
    } catch (e) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de télécharger l\'image.' })
    }
  }
}

const isPasswordModalOpen = ref(false)

const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
</script>

<template>
  <div :class="isFromOrg ? 'relative min-h-[100dvh] flex flex-col items-center bg-canvas dark:bg-[#151515] p-4 sm:p-8' : 'w-full flex flex-col items-center pb-4'">
    
    <!-- Top Left Return Button -->
    <div v-if="isFromOrg" class="absolute top-8 left-8 z-20">
      <button @click="router.back()" class="flex items-center gap-2 text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white transition-colors">
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        <span class="font-bold text-lg">Retour</span>
      </button>
    </div>

    <div class="w-full" :class="isFromOrg ? 'pt-16 pb-10 max-w-7xl' : ''">
        <!-- Header -->
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-main dark:text-gray-200">Profil</h1>
                <p class="text-secondary dark:text-gray-400 mt-1">Visualisez et modifiez votre profil.</p>
            </div>
            <div class="flex gap-4 w-full md:w-auto justify-end">
                <button  @click="handleCancel" class="px-5 py-2 bg-form-border dark:bg-[#2D2D2F] hover:bg-gray-300 dark:hover:bg-gray-600 text-main dark:text-gray-300 rounded-md text-sm font-medium transition-colors">Annuler</button>
                <button @click="HandleProfileUpdate" class="px-5 py-2 btn-primary text-white rounded-md text-sm font-medium transition-all neo-emboss active:neo-inset hover:brightness-110">Enregistrer</button>
            </div>
        </header>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left Column -->
            <div class="lg:col-span-4 space-y-6">
                <!-- Avatar Card -->
                <div class="bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-sm">
                    <div class="relative mb-4 mt-2 group">
                        <div class="w-24 h-24 rounded-2xl overflow-hidden bg-canvas dark:bg-[#161618] ring-1 ring-form-border dark:ring-gray-700 shadow-inner relative">
                            <img :src="user?.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : apiBase.replace('/api', '') + user.profile_picture) : `https://api.dicebear.com/7.x/initials/svg?seed=${(user?.last_name || '').charAt(0).toUpperCase() + (user?.first_name || '').charAt(0).toUpperCase() || 'U'}&chars=2`" alt="User Avatar" class="w-full h-full object-cover" />
                        </div>
                        <button @click="triggerFileInput" class="absolute -bottom-2 -right-2 bg-[#CCD9FC] hover:bg-[#A6C4FF] text-[#1D1D1D] p-1.5 rounded-lg border border-gray-700 transition-colors shadow-sm">
                            <Icon name="heroicons:camera" class="w-4 h-4" />
                        </button>
                    </div>
                    <h2 class="text-xl font-bold text-main dark:text-gray-200">{{ user?.last_name + " " + user?.first_name }}</h2>
                    <button @click="triggerFileInput" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors mb-6">Changer d'avatar</button>
                    <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
                    
                    <div class="w-full border-t border-form-border dark:border-gray-700/60 my-2"></div>
                    
                    <div class="flex justify-between w-full mt-4 px-2">
                        <div>
                            <p class="text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-1">Inscrit le</p>
                            <p class="text-main dark:text-gray-200 text-sm whitespace-nowrap">{{ formatDate(user?.created_at) }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-1 whitespace-nowrap">Fuseau horaire</p>
                            <p class="text-main dark:text-gray-200 text-sm whitespace-nowrap">UTC-08:00</p>
                        </div>
                    </div>
                </div>

            <!-- Security Card -->
            <div class="bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-5 shadow-sm">
                <div class="flex items-center gap-2 mb-4 px-1">
                    <Icon name="heroicons:shield-check" class="w-5 h-5 text-secondary dark:text-gray-300" />
                    <h3 class="font-bold text-main dark:text-gray-200">Sécurité</h3>
                </div>
                
                <button @click="isPasswordModalOpen = true" class="w-full flex items-center justify-between bg-canvas dark:bg-[#262626] hover:bg-[#F7F9FA] dark:hover:bg-[#2D2D2D] border border-form-border dark:border-gray-700/80 rounded-lg px-3 py-3 mb-3 transition-colors">
                    <span class="text-main dark:text-gray-300 text-sm font-medium text-left whitespace-nowrap truncate mr-2">Changer le mot de passe</span>
                    <Icon name="heroicons:chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0" />
                </button>
                
                <button @click="handleLogout" class="w-full flex items-center justify-between bg-canvas dark:bg-[#262626] hover:bg-[#F7F9FA] dark:hover:bg-[#2D2D2D] border border-form-border dark:border-gray-700/80 rounded-lg px-3 py-3 transition-colors group">
                    <span class="text-[#FCA5A5] text-sm font-medium text-left whitespace-nowrap truncate mr-2 group-hover:text-red-400 transition-colors">Se déconnecter partout</span>
                    <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4 text-[#FCA5A5] flex-shrink-0 group-hover:text-red-400 transition-colors" />
                </button>
            </div>

            <!-- Tour Card -->
            <div class="bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-5 shadow-sm">
                <div class="flex items-center gap-2 mb-4 px-1">
                    <Icon name="heroicons:play-circle" class="w-5 h-5 text-secondary dark:text-gray-300" />
                    <h3 class="font-bold text-main dark:text-gray-200">Guide interactif</h3>
                </div>
                <p class="text-xs text-secondary dark:text-gray-400 mb-4 px-1 leading-relaxed">
                    Relancez le tutoriel de prise en main pour redécouvrir les fonctionnalités essentielles de la plateforme.
                </p>
                <button
                    id="profile-restart-tour-btn"
                    @click="restartTour"
                    class="w-full flex items-center justify-between bg-canvas dark:bg-[#262626] hover:bg-[#F7F9FA] dark:hover:bg-[#2D2D2D] border border-form-border dark:border-gray-700/80 rounded-lg px-3 py-3 transition-colors group"
                >
                    <span class="text-main dark:text-gray-300 text-sm font-medium text-left whitespace-nowrap truncate mr-2">Relancer le guide</span>
                    <Icon name="heroicons:play" class="w-4 h-4 text-primary shrink-0" />
                </button>
            </div>

            <!-- Appearance Card -->

            <div class="bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-5 shadow-sm">
                <div class="flex items-center gap-2 mb-4 px-1">
                    <Icon name="heroicons:paint-brush" class="w-5 h-5 text-secondary dark:text-gray-300" />
                    <h3 class="font-bold text-main dark:text-gray-200">Apparence</h3>
                </div>
                
                <div class="space-y-2">
                    <button @click="colorMode.preference = 'light'" class="w-full flex items-center justify-between bg-canvas dark:bg-[#262626] hover:bg-[#F7F9FA] dark:hover:bg-[#2D2D2D] border rounded-lg px-3 py-3 transition-colors" :class="colorMode.preference === 'light' ? 'border-primary ring-1 ring-primary/30' : 'border-form-border dark:border-gray-700/80'">
                        <span class="flex items-center gap-3">
                            <Icon name="heroicons:sun" class="w-5 h-5 text-amber-500" />
                            <span class="text-main dark:text-gray-300 text-sm font-medium">Mode clair</span>
                        </span>
                        <Icon v-if="colorMode.preference === 'light'" name="heroicons:check-circle-solid" class="w-5 h-5 text-primary" />
                    </button>
                    
                    <button @click="colorMode.preference = 'dark'" class="w-full flex items-center justify-between bg-canvas dark:bg-[#262626] hover:bg-[#F7F9FA] dark:hover:bg-[#2D2D2D] border rounded-lg px-3 py-3 transition-colors" :class="colorMode.preference === 'dark' ? 'border-primary ring-1 ring-primary/30' : 'border-form-border dark:border-gray-700/80'">
                        <span class="flex items-center gap-3">
                            <Icon name="heroicons:moon" class="w-5 h-5 text-indigo-400" />
                            <span class="text-main dark:text-gray-300 text-sm font-medium">Mode sombre</span>
                        </span>
                        <Icon v-if="colorMode.preference === 'dark'" name="heroicons:check-circle-solid" class="w-5 h-5 text-primary" />
                    </button>
                    
                    <button @click="colorMode.preference = 'system'" class="w-full flex items-center justify-between bg-canvas dark:bg-[#262626] hover:bg-[#F7F9FA] dark:hover:bg-[#2D2D2D] border rounded-lg px-3 py-3 transition-colors" :class="colorMode.preference === 'system' ? 'border-primary ring-1 ring-primary/30' : 'border-form-border dark:border-gray-700/80'">
                        <span class="flex items-center gap-3">
                            <Icon name="heroicons:computer-desktop" class="w-5 h-5 text-secondary dark:text-gray-400" />
                            <span class="text-main dark:text-gray-300 text-sm font-medium">Système</span>
                        </span>
                        <Icon v-if="colorMode.preference === 'system'" name="heroicons:check-circle-solid" class="w-5 h-5 text-primary" />
                    </button>
                </div>
            </div>
            
        </div>

            <!-- Right Column -->
            <div class="lg:col-span-8 space-y-6">
                <!-- Personal Info Card -->
                <div class="bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-7 shadow-sm">
                    <h3 class="text-lg font-bold text-main dark:text-gray-200 mb-8">Informations personnelles</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Prénom</label>
                            <input type="text" v-model="firstName" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all shadow-inner" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Nom</label>
                            <input type="text" v-model="lastName" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all shadow-inner" />
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Adresse e-mail</label>
                            <input type="email" v-model="email" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all shadow-inner" />
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Bio</label>
                        <RichTextEditor v-model="bio" class="w-full" />
                    </div>
                </div>

                <!-- Reminders Card -->
                <div class="bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-7 shadow-sm">
                    <h3 class="text-lg font-bold text-main dark:text-gray-200 mb-2">Paramètres des rappels</h3>
                <p class="text-sm text-secondary dark:text-gray-400 mb-8">Configurez les moments où vous souhaitez recevoir des rappels automatiques pour vos projets et tâches approchant de leur échéance.</p>
                
                <div class="space-y-4">
                  <!-- Reminder Before Start -->
                  <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-form-border dark:border-gray-800 bg-canvas dark:bg-[#151515] transition-colors relative group shadow-sm">
                    <div class="flex-1 flex items-center gap-3">
                      <input type="number" min="0" v-model="reminderDaysBeforeStart" class="w-16 px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-form-border dark:border-gray-700 text-main dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner" />
                      <span class="text-sm font-bold text-main dark:text-gray-200">jours avant le début du projet/tâche</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-1">Heure d'envoi</span>
                        <input type="time" v-model="reminderTimeStart" class="px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-form-border dark:border-gray-700 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner" />
                      </div>
                    </div>
                  </div>

                  <!-- Reminder Before End -->
                  <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-form-border dark:border-gray-800 bg-canvas dark:bg-[#151515] transition-colors relative group shadow-sm">
                    <div class="flex-1 flex items-center gap-3">
                      <input type="number" min="0" v-model="reminderDaysBeforeEnd" class="w-16 px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-form-border dark:border-gray-700 text-main dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner" />
                      <span class="text-sm font-bold text-main dark:text-gray-200">jours avant la fin du projet/tâche</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-bold text-secondary dark:text-gray-500 uppercase tracking-wider mb-1">Heure d'envoi</span>
                        <input type="time" v-model="reminderTimeEnd" class="px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-form-border dark:border-gray-700 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
        
        <!-- Modals -->
        <ChangePasswordModal 
            :is-open="isPasswordModalOpen" 
            @close="isPasswordModalOpen = false"
        />
    </div>
  </div>
</template>