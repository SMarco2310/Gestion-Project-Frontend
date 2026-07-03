<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'custom'
})

const { isOwner } = useAuth()
const { activeOrganization } = useOrganizations()
const { $api } = useNuxtApp()
const { addToast } = useToast()

const members = ref<any[]>([])
const isLoading = ref(true)

const fetchMembers = async () => {
  if (!activeOrganization.value) return;
  isLoading.value = true;
  try {
    const orgId = activeOrganization.value.id;
    const res = await $api<any>(`/api/organizations/${orgId}/members`, { method: 'GET' });
    members.value = res.data?.data || res.data || [];
  } catch (err) {
    console.error('Error fetching org members', err);
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de charger les membres.' });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchMembers();
})



const isInviteModalOpen = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('membre')

const handleInvite = () => {
  // Mock invite logic since backend says "Please use invitation system"
  addToast({ type: 'success', title: 'Succès', message: `Invitation envoyée à ${inviteEmail.value}.` });
  isInviteModalOpen.value = false
  inviteEmail.value = ''
  inviteRole.value = 'membre'
}

const openEditRoleModal = (member: any) => {
  // Future implementation for role edit modal if needed, otherwise mock
  console.log('Edit role for', member.name)
  addToast({ type: 'info', title: 'Info', message: `Fonctionnalité à venir: éditer le rôle de ${member.name}.` });
}

const removeMember = async (memberId: number) => {
  if (!activeOrganization.value) return;
  try {
    const orgId = activeOrganization.value.id;
    await $api(`/api/organizations/${orgId}/members/${memberId}`, { method: 'DELETE' });
    members.value = members.value.filter((m: any) => m.id !== memberId);
    addToast({ type: 'success', title: 'Succès', message: 'Membre retiré de l\'organisation.' });
  } catch (err) {
    console.error('Error removing member', err);
    addToast({ type: 'error', title: 'Erreur', message: 'Impossible de retirer le membre.' });
  }
}
</script>

<template>
  <div>
    <!-- Header Section -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl md:text-4xl font-bold text-main dark:text-gray-200">Organisation</h1>
        <p class="text-secondary dark:text-gray-500 text-sm md:text-md pt-1">Gérez les détails et les membres de votre organisation.</p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink v-if="isOwner" to="/organization/settings" class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-main dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
          <Icon name="heroicons:cog-6-tooth" class="w-5 h-5" />
          Paramètres
        </NuxtLink>
      </div>
    </section>

    <!-- Organization Info Card -->
    <div v-if="activeOrganization" class="bg-white dark:bg-[#1D1D1D] rounded-2xl p-6 border border-form-border dark:border-gray-800 mb-8 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xl uppercase shrink-0 overflow-hidden">
          <img v-if="activeOrganization?.logo" :src="activeOrganization.logo.startsWith('http') ? activeOrganization.logo : 'http://localhost:8000' + activeOrganization.logo" class="w-full h-full object-cover" />
          <span v-else>{{ activeOrganization?.name?.substring(0, 2)?.toUpperCase() || 'NT' }}</span>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-main dark:text-white">{{ activeOrganization?.name || 'Organisation' }}</h2>
          <p class="text-secondary dark:text-gray-400 mt-1">{{ activeOrganization.description || 'Aucune description disponible.' }}</p>
          <div class="mt-4 flex items-center gap-4 text-sm text-secondary dark:text-gray-500">
            <span class="flex items-center gap-1"><Icon name="heroicons:calendar" class="w-4 h-4" /> Créé en {{ activeOrganization.created_at ? new Date(activeOrganization.created_at).toLocaleDateString('fr-FR') : '-' }}</span>
            <span class="flex items-center gap-1"><Icon name="heroicons:users" class="w-4 h-4" /> {{ members.length }} Membres</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Members List -->
    <div class="bg-white dark:bg-[#1D1D1D] rounded-2xl border border-form-border dark:border-gray-800 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-form-border dark:border-gray-800 flex justify-between items-center">
        <h3 class="text-xl font-bold text-main dark:text-white">Membres</h3>
        <button @click="isInviteModalOpen = true" class="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm text-sm">
          <Icon name="heroicons:user-plus" class="w-4 h-4" />
          Inviter un membre
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-secondary dark:text-gray-400">
          <thead class="bg-canvas dark:bg-[#151515] text-main dark:text-gray-300 font-medium">
            <tr>
              <th class="px-6 py-4">Nom</th>
              <th class="px-6 py-4">Rôle</th>
              <th class="px-6 py-4 hidden md:table-cell">Rejoint le</th>
              <th class="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-form-border dark:divide-gray-800">
            <tr v-for="member in members" :key="member.id" @click="navigateTo(`/profile/${member.id}`)" class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                    {{ member?.name?.charAt(0)?.toUpperCase() || 'U' }}
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium text-main dark:text-white">{{ member?.name || 'Utilisateur' }}</span>
                    <span class="text-xs">{{ member.email }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="{
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': (member.pivot?.role || 'membre').toLowerCase() === 'propriétaire',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': (member.pivot?.role || 'membre').toLowerCase() === 'admin',
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': (member.pivot?.role || 'membre').toLowerCase() === 'membre'
                }">
                  {{ member.pivot?.role || 'membre' }}
                </span>
              </td>
              <td class="px-6 py-4 hidden md:table-cell">
                {{ member.pivot?.joined_at ? new Date(member.pivot.joined_at).toLocaleDateString('fr-FR') : '-' }}
              </td>
              <td class="px-6 py-4 text-right">
                <div v-if="isOwner" class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="p-2 text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Modifier le rôle" @click.stop="openEditRoleModal(member)">
                    <Icon name="heroicons:pencil" class="w-5 h-5" />
                  </button>
                  <button class="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Retirer de l'organisation" @click.stop="removeMember(member.id)">
                    <Icon name="heroicons:trash" class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      

    </div>

    <!-- Invite Modal (Static) -->
    <div v-if="isInviteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-card dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md border border-form-border dark:border-gray-800 shadow-xl overflow-hidden">
        <div class="p-6 border-b border-form-border dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xl font-bold text-main dark:text-white">Inviter un membre</h3>
          <button @click="isInviteModalOpen = false" class="text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white">
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Adresse Email</label>
            <input v-model="inviteEmail" type="email" placeholder="collegue@exemple.com" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label class="block text-sm font-medium text-main dark:text-gray-300 mb-2">Rôle</label>
            <select v-model="inviteRole" class="w-full px-4 py-3 rounded-xl bg-canvas dark:bg-[#151515] border border-form-border dark:border-gray-800 text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
              <option value="membre">Membre</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
        </div>
        <div class="p-6 border-t border-form-border dark:border-gray-800 flex justify-end gap-3">
          <button @click="isInviteModalOpen = false" class="px-4 py-2 font-medium text-secondary hover:text-main dark:text-gray-400 dark:hover:text-white transition-colors">
            Annuler
          </button>
          <button @click="handleInvite" class="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors">
            Envoyer l'invitation
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
