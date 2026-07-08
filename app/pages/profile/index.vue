<script setup lang="ts">
import { ref } from 'vue'
const {user,updateProfile,logout,uploadProfilePicture}=useAuth();

const router = useRouter();
const route = useRoute();

const isFromOrg = route.query.source === 'org';

definePageMeta({
    layout: false,
});

if (!isFromOrg) {
    setPageLayout('custom');
}

const name = ref(user.value?.name ?? '');
const email = ref(user.value?.email ?? '');
const bio = ref(user.value?.bio ?? '');

watch(() => user.value, (newUser) => {
  if (newUser) {
    name.value = newUser.name;
    email.value = newUser.email;
    bio.value = newUser.bio || '';
  }
}, { immediate: true });

const { addToast } = useToast();

const HandleProfileUpdate = async ()=>{
    
    try {
        if(name.value=='' && email.value==''){
        return
        }
        await updateProfile(name.value, email.value,bio.value);
        addToast({ title: 'Profil mis à jour', message: 'Vos informations ont été enregistrées avec succès.', type: 'success' })

    } catch (error) {
        console.error('Failed to update profile:', error);
        addToast({ title: 'Erreur', message: 'Impossible de mettre à jour le profil.', type: 'error' })
    } finally {
        // loading.value = false;
    }
}
const handleCancel = () => {
  name.value = user.value?.name ?? '';
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

    <div class="w-full max-w-5xl" :class="isFromOrg ? 'pt-16 pb-10' : ''">
        <!-- Header -->
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-main dark:text-gray-200">Profil</h1>
                <p class="text-secondary dark:text-gray-400 mt-1">Visualisez et modifiez votre profil.</p>
            </div>
            <div class="flex gap-4 w-full md:w-auto justify-end">
                <button  @click="handleCancel" class="px-5 py-2 bg-form-border dark:bg-[#2D2D2F] hover:bg-gray-300 dark:hover:bg-gray-600 text-main dark:text-gray-300 rounded-md text-sm font-medium transition-colors">Annuler</button>
                <button @click="HandleProfileUpdate" class="px-5 py-2 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-md text-sm font-medium transition-all neo-emboss active:neo-inset hover:brightness-110">Enregistrer</button>
            </div>
        </header>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            <!-- Avatar Card -->
            <div class="lg:col-span-1 bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-lg">
                    <div class="relative mb-4 mt-2 group">
                        <div class="w-24 h-24 rounded-2xl overflow-hidden bg-canvas dark:bg-[#161618] ring-1 ring-form-border dark:ring-gray-700 shadow-inner relative">
                            <img :src="user?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name ?? 'U'}&chars=1`" alt="User Avatar" class="w-full h-full object-cover" />
                        </div>
                        <button @click="triggerFileInput" class="absolute -bottom-2 -right-2 bg-[#CCD9FC] hover:bg-[#A6C4FF] text-[#1D1D1D] p-1.5 rounded-lg border border-gray-700 transition-colors shadow-sm">
                            <Icon name="heroicons:camera" class="w-4 h-4" />
                        </button>
                    </div>
                    <h2 class="text-xl font-bold text-main dark:text-gray-200">{{ user?.name }}</h2>
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
            <!-- Personal Info Card -->
            <div class="lg:col-span-2 lg:row-span-2 bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-7 shadow-lg">
                <h3 class="text-lg font-bold text-main dark:text-gray-200 mb-8">Informations personnelles</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Nom complet</label>
                            <input type="text" v-model="name" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all shadow-inner" />
                        </div>
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

            <!-- Security Card -->
            <div class="lg:col-span-1 bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-5 shadow-lg">
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
        </div>
        
        <!-- Modals -->
        <ChangePasswordModal 
            :is-open="isPasswordModalOpen" 
            @close="isPasswordModalOpen = false"
        />
    </div>
  </div>
</template>