<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
    layout: "custom",
    // middleware: "auth"
});

const user = ref({
    fullName: 'Sarah Yeung',
    email: 'sarah.yeung@projectzenith.io',
    role: 'Senior Product Manager',
    bio: 'Focusing on enterprise scale solutions and platform architecture.',
    joined: 'Jan 2023',
    timezone: 'UTC-08:00',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
})

const isPasswordModalOpen = ref(false)

const handlePasswordChange = (data: any) => {
    // Implement API call logic here
    console.log("Password change requested", data)
}
</script>

<template>
    <div class="max-w-5xl pt-4 pb-10">
        <!-- Header -->
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-main dark:text-gray-200">Profil</h1>
                <p class="text-secondary dark:text-gray-400 mt-1">Visualisez et modifiez votre profil.</p>
            </div>
            <div class="flex gap-4 w-full md:w-auto justify-end">
                <button class="px-5 py-2 bg-form-border dark:bg-[#2D2D2F] hover:bg-gray-300 dark:hover:bg-gray-600 text-main dark:text-gray-300 rounded-md text-sm font-medium transition-colors">Annuler</button>
                <button class="px-5 py-2 bg-primary dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors shadow-md">Enregistrer</button>
            </div>
        </header>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            <!-- Avatar Card -->
            <div class="lg:col-span-1 bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-lg">
                    <div class="relative mb-4 mt-2">
                        <div class="w-24 h-24 rounded-2xl overflow-hidden bg-canvas dark:bg-[#161618] ring-1 ring-form-border dark:ring-gray-700 shadow-inner">
                            <img :src="user.avatar" alt="User Avatar" class="w-full h-full object-cover" />
                        </div>
                        <button class="absolute -bottom-2 -right-2 bg-[#CCD9FC] hover:bg-[#A6C4FF] text-[#1D1D1D] p-1.5 rounded-lg border border-gray-700 transition-colors shadow-sm">
                            <Icon name="heroicons:camera" class="w-4 h-4" />
                        </button>
                    </div>
                    <h2 class="text-xl font-bold text-main dark:text-gray-200">{{ user.fullName }}</h2>
                    <p class="text-[#8BA3E8] text-sm mt-1 mb-4">{{ user.role }}</p>
                    <button class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors mb-6">Changer d'avatar</button>
                    
                    <div class="w-full border-t border-form-border dark:border-gray-700/60 my-2"></div>
                    
                    <div class="flex justify-between w-full mt-4 px-2">
                        <div>
                            <p class="text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-1">Inscrit le</p>
                            <p class="text-main dark:text-gray-200 text-sm">{{ user.joined }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-1">Fuseau horaire</p>
                            <p class="text-main dark:text-gray-200 text-sm">{{ user.timezone }}</p>
                        </div>
                    </div>
                </div>
            <!-- Personal Info Card -->
            <div class="lg:col-span-2 lg:row-span-2 bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-7 shadow-lg">
                <h3 class="text-lg font-bold text-main dark:text-gray-200 mb-8">Informations personnelles</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Nom complet</label>
                            <input type="text" v-model="user.fullName" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all shadow-inner" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Adresse e-mail</label>
                            <input type="email" v-model="user.email" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all shadow-inner" />
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-[10px] font-bold text-secondary dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Bio</label>
                        <textarea v-model="user.bio" rows="4" class="w-full bg-canvas dark:bg-[#161616] border border-form-border dark:border-gray-700 rounded-lg px-4 py-3 text-main dark:text-gray-300 text-sm focus:outline-none focus:border-primary dark:focus:border-gray-500 focus:ring-1 focus:ring-primary dark:focus:ring-gray-500 transition-all resize-none shadow-inner"></textarea>
                    </div>
                </div>

            <!-- Security Card -->
            <div class="lg:col-span-1 bg-card dark:bg-[#1D1D1D] border border-form-border dark:border-gray-700 rounded-xl p-5 shadow-lg">
                <div class="flex items-center gap-2 mb-4 px-1">
                    <Icon name="heroicons:shield-check" class="w-5 h-5 text-secondary dark:text-gray-300" />
                    <h3 class="font-bold text-main dark:text-gray-200">Sécurité</h3>
                </div>
                
                <button @click="isPasswordModalOpen = true" class="w-full flex items-center justify-between bg-canvas dark:bg-[#262626] hover:bg-[#F7F9FA] dark:hover:bg-[#2D2D2D] border border-form-border dark:border-gray-700/80 rounded-lg p-3.5 mb-3 transition-colors">
                    <span class="text-main dark:text-gray-300 text-sm font-medium">Changer le mot de passe</span>
                    <Icon name="heroicons:chevron-right" class="w-4 h-4 text-gray-500" />
                </button>
                
                <button class="w-full flex items-center justify-between bg-canvas dark:bg-[#262626] hover:bg-[#F7F9FA] dark:hover:bg-[#2D2D2D] border border-form-border dark:border-gray-700/80 rounded-lg p-3.5 transition-colors group">
                    <span class="text-[#FCA5A5] text-sm font-medium group-hover:text-red-400 transition-colors">Se déconnecter partout</span>
                    <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4 text-[#FCA5A5] group-hover:text-red-400 transition-colors" />
                </button>
            </div>
        </div>
        
        <!-- Modals -->
        <ChangePasswordModal 
            :is-open="isPasswordModalOpen" 
            @close="isPasswordModalOpen = false"
            @submit="handlePasswordChange"
        />
    </div>
</template>