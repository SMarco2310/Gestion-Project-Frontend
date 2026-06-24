<script setup lang="ts">
const showPassword = ref(false);
const togglePassword = () => {
    showPassword.value = !showPassword.value;
}
</script>

<template>
    <section class="flex flex-col gap-10 justify-center items-center px-10 py-40 max-h-screen min-h-screen bg-[#1D1D1D]">
        <!-- <form @submit.prevent="handleLogin"> -->
            <div id="container" class="w-full flex flex-col gap-10 justify-center items-center">
            <div id="header" class="flex flex-col gap-2 items-center">
                <img src="/assets/obsidian_velocity_icon_only.png" alt="Logo" class="w-20 h-20">
                <p class="text-4xl font-bold text-gray-200 pt-5">Project Manager</p>
                <p class="text-lg text-gray-500 pt-5 pb-5">Sign in to your account</p>
            </div>
            <div class=" bg-[#1D1D1D] p-10 md:p-20 rounded-2xl flex flex-col gap-5 items-center shadow-[0_0_90px_rgba(0,0,0,0.5)]">
                <div class="w-full">
                    <label for="email" class="text-gray-500">Address Email</label>
                    <input type="email" id="email" placeholder="Email" class="p-3 w-full  my-2 bg-gray-200/10 text-gray-200 border-2 border-gray-200/10">
                </div>
                <br />
                <div class="w-full">
                    <label for="password" class="text-gray-500">Password</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Icon name="heroicons:lock-closed" class="w-5 h-5 text-gray-400" />
                        </span>
                        <input :type="showPassword ? 'text' : 'password'" id="password" placeholder="Password" class="p-3 pl-10 pr-10 w-full my-2 bg-gray-200/10 text-gray-200 border-2 border-gray-200/10">
                        <span class="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" @click="togglePassword">
                            <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5 text-gray-400" />
                        </span>
                    </div>
                    <NuxtLink href="/auth/forget-password" class="text-gray-500">Forget Password ?</NuxtLink>
                </div>
                <br />
                <button type="submit" class="bg-blue-500 w-full flex items-center justify-center text-black px-4 py-2 h-14 rounded-md">Sign in <Icon name="heroicons:arrow-right" class="w-5 h-5 ml-2 text-black"/></button>

                <!-- <p v-if="error" class="text-red-500 font-bold-300">{{ error }}</p> -->
            </div>
            <p class="text-white">Don't have an account? <NuxtLink href="/auth/signup" class="text-blue-500 font-bold-300">Sign up</NuxtLink></p>
            </div>

        <!-- </form> -->
    </section>
</template>