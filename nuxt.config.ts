// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint', '@nuxt/icon'],
  css: ['~/assets/css/main.css'],
  app: {
    pageTransition: { name: 'fade', mode: 'out-in' },
    layoutTransition: { name: 'fade', mode: 'out-in' }
  },
  runtimeConfig: {
    public: {
      // If calling Laravel directly instead of server/api/*,
      // set this in .env as NUXT_PUBLIC_API_BASE=http://localhost:8000/api
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
    },
  },
  
  icon: {
    serverBundle: {
      collections: ['heroicons', 'ph']
    }
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  

  routeRules:{

    '/auth/**':{
    },
    '/dashboard/**':{
      
    }
  }
  
})