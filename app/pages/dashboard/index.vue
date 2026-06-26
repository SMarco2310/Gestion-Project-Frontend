<script setup lang="ts">
definePageMeta({
  layout: 'custom'
})

const user = {
    name: "John Doe",
    email: "[EMAIL_ADDRESS]",
}
</script>

<template>
    <div>
        <section class="flex flex-col gap-2 ">
        <h1 class="text-4xl font-bold text-main dark:text-gray-200">Dashboard</h1>
        <p class="text-secondary dark:text-gray-500 text-md pt-3">Bienvenue sur votre tableau de bord, {{ user.name }}</p>
    </section>
    <br>
    <section>
        <!-- Stats Cards with only numbers -->
        <CardDashboard />
    </section>
    <br>
    <section>
        <!-- Stats Cards with graphs -->
        <CardV2Dashboard />
    </section>
    </div>
</template>