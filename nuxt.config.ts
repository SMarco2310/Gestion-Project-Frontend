// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint', '@nuxt/icon', 'nuxt-tiptap-editor', '@nuxtjs/color-mode', 'nuxt-charts'],
  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },
  css: ['~/assets/css/main.css'],
  app: {
    // Transitions disabled to fix page freezing bugs on route change
    pageTransition: false,
    layoutTransition: false,
    head:{
      link:[
        { rel: 'icon', type: 'image/png', href: '/logo.png' }
      ]
    }
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
    '/storage/**': { proxy: 'http://localhost:8000/storage/**' },
    '/auth/**':{
    },
  }
  
})