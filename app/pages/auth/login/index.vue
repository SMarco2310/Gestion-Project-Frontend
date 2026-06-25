<script setup lang="ts">
const showPassword = ref(false);
const togglePassword = () => {
    showPassword.value = !showPassword.value;
}
</script>

<template>
    <section class="flex flex-col gap-10 justify-center items-center px-10 py-40 max-h-screen min-h-screen bg-canvas dark:bg-[#1D1D1D]">
        <!-- <form @submit.prevent="handleLogin"> -->
            <div id="container" class="w-full flex flex-col gap-10 justify-center items-center">
            <div id="header" class="flex flex-col gap-2 items-center">
            <img src="/assets/logo_app.png" alt="Logo" class="w-30 h-20">
                <p class="text-4xl font-bold text-main dark:text-gray-200 pt-5">Gestion de Projets</p>
                <p class="text-lg text-secondary dark:text-gray-500 pt-5 pb-5">Connectez-vous à votre compte</p>
            </div>
            <div class=" bg-card dark:bg-[#1D1D1D] p-10 md:p-20 rounded-2xl flex flex-col gap-5 items-center shadow-[0_0_90px_theme(colors.shadow-color)] dark:shadow-[0_0_90px_rgba(0,0,0,0.5)]">
                <div class="w-full">
                    <label for="email" class="text-secondary dark:text-gray-500">Adresse E-mail</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Icon name="heroicons:envelope" class="w-5 h-5 text-secondary dark:text-gray-400" />
                        </span>
                        <input type="email" id="email" placeholder="E-mail" class="p-3 pl-10 pr-10 w-full my-2 bg-card dark:bg-gray-200/10 text-main dark:text-gray-200 border-2 border-form-border dark:border-gray-200/10 placeholder-form-placeholder">
                    </div>
                </div>
                <br />
                <div class="w-full">
                    <label for="password" class="text-secondary dark:text-gray-500">Mot de passe</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Icon name="heroicons:lock" class="w-5 h-5 text-secondary dark:text-gray-400" />
                        </span>
                        <input :type="showPassword ? 'text' : 'password'" id="password" placeholder="Mot de passe" class="p-3 pl-10 pr-10 w-full my-2 bg-card dark:bg-gray-200/10 text-main dark:text-gray-200 border-2 border-form-border dark:border-gray-200/10 placeholder-form-placeholder">
                        <span class="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" @click="togglePassword">
                            <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5 text-secondary dark:text-gray-400" />
                        </span>
                    </div>
                    <NuxtLink href="/auth/forget-password" class="text-secondary dark:text-gray-500 hover:text-main dark:hover:text-gray-300 transition-colors">Mot de passe oublié ?</NuxtLink>
                </div>
                <br />
                <button type="submit" class="bg-primary dark:bg-blue-500 w-full flex items-center justify-center text-white px-4 py-2 h-14 rounded-md shadow-sm">Se connecter <Icon name="heroicons:arrow-right" class="w-5 h-5 ml-2 text-white"/></button>

                <!-- <p v-if="error" class="text-red-500 font-bold-300">{{ error }}</p> -->
            </div>
            <p class="text-main dark:text-white">Vous n'avez pas de compte ? <NuxtLink href="/auth/signup" class="text-primary dark:text-blue-500 font-bold-300">S'inscrire</NuxtLink></p>
            </div>

        <!-- </form> -->
    </section>
</template>