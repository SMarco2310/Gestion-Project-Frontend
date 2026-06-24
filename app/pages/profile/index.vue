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
</script>

<template>
    <div class="max-w-5xl pt-4 pb-10">
        <!-- Header -->
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-200">Profile</h1>
                <p class="text-gray-400 mt-1">Visualisez et modifiez votre profil.</p>
            </div>
            <div class="flex gap-4 w-full md:w-auto justify-end">
                <button class="px-5 py-2 bg-[#2D2D2F] hover:bg-gray-600 text-gray-300 rounded-md text-sm font-medium transition-colors">Cancel</button>
                <button class="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors shadow-md">Save Changes</button>
            </div>
        </header>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column -->
            <div class="flex flex-col gap-6 lg:col-span-1">
                <!-- Avatar Card -->
                <div class="bg-[#1D1D1D] border border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-lg">
                    <div class="relative mb-4 mt-2">
                        <div class="w-24 h-24 rounded-2xl overflow-hidden bg-[#161618] ring-1 ring-gray-700 shadow-inner">
                            <img :src="user.avatar" alt="User Avatar" class="w-full h-full object-cover" />
                        </div>
                        <button class="absolute -bottom-2 -right-2 bg-[#CCD9FC] hover:bg-[#A6C4FF] text-[#1D1D1D] p-1.5 rounded-lg border border-gray-700 transition-colors shadow-sm">
                            <Icon name="heroicons:camera" class="w-4 h-4" />
                        </button>
                    </div>
                    <h2 class="text-xl font-bold text-gray-200">{{ user.fullName }}</h2>
                    <p class="text-[#8BA3E8] text-sm mt-1 mb-4">{{ user.role }}</p>
                    <button class="text-gray-400 hover:text-gray-200 text-sm font-medium transition-colors mb-6">Change Avatar</button>
                    
                    <div class="w-full border-t border-gray-700/60 my-2"></div>
                    
                    <div class="flex justify-between w-full mt-4 px-2">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Joined</p>
                            <p class="text-gray-200 text-sm">{{ user.joined }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Timezone</p>
                            <p class="text-gray-200 text-sm">{{ user.timezone }}</p>
                        </div>
                    </div>
                </div>

                <!-- Security Card -->
                <div class="bg-[#1D1D1D] border border-gray-700 rounded-xl p-5 shadow-lg">
                    <div class="flex items-center gap-2 mb-4 px-1">
                        <Icon name="heroicons:shield-check" class="w-5 h-5 text-gray-300" />
                        <h3 class="font-bold text-gray-200">Security</h3>
                    </div>
                    
                    <button class="w-full flex items-center justify-between bg-[#262626] hover:bg-[#2D2D2D] border border-gray-700/80 rounded-lg p-3.5 mb-3 transition-colors">
                        <span class="text-gray-300 text-sm font-medium">Change Password</span>
                        <Icon name="heroicons:chevron-right" class="w-4 h-4 text-gray-500" />
                    </button>
                    
                    <button class="w-full flex items-center justify-between bg-[#262626] hover:bg-[#2D2D2D] border border-gray-700/80 rounded-lg p-3.5 transition-colors group">
                        <span class="text-[#FCA5A5] text-sm font-medium group-hover:text-red-400 transition-colors">Sign Out Everywhere</span>
                        <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4 text-[#FCA5A5] group-hover:text-red-400 transition-colors" />
                    </button>
                </div>
            </div>

            <!-- Right Column -->
            <div class="lg:col-span-2">
                <!-- Personal Info Card -->
                <div class="bg-[#1D1D1D] border border-gray-700 rounded-xl p-7 shadow-lg">
                    <h3 class="text-lg font-bold text-gray-200 mb-8">Personal Information</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                            <input type="text" v-model="user.fullName" class="w-full bg-[#161616] border border-gray-700 rounded-lg px-4 py-3 text-gray-300 text-sm focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all shadow-inner" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                            <input type="email" v-model="user.email" class="w-full bg-[#161616] border border-gray-700 rounded-lg px-4 py-3 text-gray-300 text-sm focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all shadow-inner" />
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Bio</label>
                        <textarea v-model="user.bio" rows="4" class="w-full bg-[#161616] border border-gray-700 rounded-lg px-4 py-3 text-gray-300 text-sm focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all resize-none shadow-inner"></textarea>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>