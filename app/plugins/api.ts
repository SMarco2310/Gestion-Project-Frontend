// plugins/api.ts
export default defineNuxtPlugin(() => {
  const token = useCookie('auth_token')

  const api = $fetch.create({
    baseURL: 'http://localhost:8000/',
    onRequest({ options }) {
      if (token.value) {
        options.headers.set('Authorization', `Bearer ${token.value}`)
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        token.value = null
        navigateTo('/auth/login')
      }
    },
  })

  return { provide: { api } }
})