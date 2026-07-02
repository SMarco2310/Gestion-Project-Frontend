<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false, // We use a clean layout without sidebar for org selection
  pageTransition: {
    name: 'fade',
    mode: 'out-in'
  }
})

const { $api } = useNuxtApp()

const organizations = ref<any[]>([])
const invitations = ref<any[]>([])

const fetchOrgsAndInvites = async () => {
  try {
    const orgsData = await $api('/api/organizations')
    organizations.value = orgsData.organizations || []

    const invitesData = await $api('/api/invitations')
    invitations.value = invitesData.invitations || []
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  fetchOrgsAndInvites()
})

const selectOrganization = (id: number) => {
  navigateTo('/dashboard');
}

const acceptInvitation = (inviteId: number, orgId: number) => {
  // In a real app, call $api(`/api/invitations/${inviteId}/accept`, { method: 'POST' })
  navigateTo('/dashboard');
}

const createOrganization = () => {
  // Open creation flow or navigate directly if simple creation
  navigateTo('/dashboard');
}
</script>

<template>
  <div class="relative min-h-[100dvh] flex items-center justify-center bg-canvas dark:bg-[#151515] p-4 sm:p-8">
    
    <!-- Top Left Branding -->
    <div class="absolute top-8 left-8 z-20 flex items-center gap-3">
       <img src="/assets/logo_app.png" alt="Logo" class="w-10 h-10 object-contain drop-shadow-md" />
       <span class="text-main dark:text-white font-bold text-xl tracking-wide">Gestion de Projets</span>
    </div>

    <!-- Top Right Actions -->
    <div class="absolute top-8 right-8 z-20">
       <NuxtLink to="/profile" class="text-secondary dark:text-gray-400 hover:text-main dark:hover:text-white font-medium transition-colors">
         Profil
       </NuxtLink>
    </div>

    <div class="w-full max-w-4xl flex flex-col items-center pt-20">
      
      <!-- Header text -->
      <div class="text-center mb-12">
        <h1 class="text-4xl sm:text-5xl font-bold tracking-wider text-main dark:text-white mb-4">Bienvenue</h1>
        <p class="text-secondary dark:text-gray-400 text-lg max-w-md mx-auto">
          Sélectionnez ou rejoignez une organisation pour commencer.
        </p>
      </div>

      <!-- Invitations Section -->
      <div v-if="invitations.length > 0" class="w-full mb-12">
        <h2 class="text-2xl font-bold text-main dark:text-white mb-6 flex items-center gap-2">
          <Icon name="heroicons:envelope-open" class="w-6 h-6 text-primary" />
          Invitations en attente
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="invite in invitations" 
            :key="invite.id"
            class="flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 hover:border-primary transition-all relative group shadow-sm"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl uppercase shadow-md">
                {{ invite.organization.name.substring(0, 2) }}
              </div>
              <div>
                <h3 class="text-lg font-bold text-main dark:text-white">{{ invite.organization.name }}</h3>
                <span class="text-xs font-semibold text-primary dark:text-blue-400 uppercase tracking-wider">Rôle: {{ invite.role }}</span>
              </div>
            </div>
            <p class="text-sm text-secondary dark:text-gray-400 mb-6 flex-1">Vous avez été invité à rejoindre cette organisation.</p>
            
            <button @click="acceptInvitation(invite.id, invite.organization.id)" class="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              <span>Rejoindre l'équipe</span>
              <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Active Organizations Grid -->
      <div class="w-full mb-10">
        <h2 class="text-2xl font-bold text-main dark:text-white mb-6">Vos Organisations</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Add New Organization Card -->
          <div @click="createOrganization" class="flex flex-col items-center justify-center bg-white dark:bg-[#1D1D1D] rounded-2xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-[#252525] transition-all cursor-pointer group min-h-[200px]">
            <div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="heroicons:plus" class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-primary" />
            </div>
            <span class="font-semibold text-main dark:text-white">Créer une organisation</span>
          </div>

          <!-- Render Active Organizations -->
          <div 
            v-for="org in organizations" 
            :key="org.id"
            @click="selectOrganization(org.id)"
            class="flex flex-col bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 border border-form-border dark:border-gray-800 hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all cursor-pointer min-h-[200px] relative overflow-hidden group"
          >
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div class="flex justify-between items-start mb-4">
              <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold text-xl uppercase shadow-sm">
                {{ org.name.substring(0, 2) }}
              </div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 group-hover:bg-primary group-hover:text-white text-gray-400 transition-colors">
                 <Icon name="heroicons:arrow-right" class="w-4 h-4" />
              </div>
            </div>
            
            <h2 class="text-xl font-bold text-main dark:text-white mb-2">{{ org.name }}</h2>
            <p v-if="org.description" class="text-sm text-secondary dark:text-gray-400 line-clamp-2 mt-auto">{{ org.description }}</p>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
