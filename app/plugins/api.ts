// plugins/api.ts
export default defineNuxtPlugin(() => {
  const token = useCookie('auth_token')

  const config = useRuntimeConfig()
  let base = config.public.apiBase as string
  if (!base.endsWith('/api')) base += '/api'
  
  const api = $fetch.create({
    baseURL: base,
    onRequest({ options }) {
      options.headers = new Headers(options.headers || {})
      options.headers.set('Accept', 'application/json')
      if (token.value) {
        options.headers.set('Authorization', `Bearer ${token.value}`)
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        const { setAuth } = useAuth()
        setAuth(null, null)
        
        if (process.client) {
            window.location.href = '/auth/login'
        }
      }
      if (response.status === 403) {
        const { addToast } = useToast()
        const message = response._data?.message || "Vous n'êtes pas autorisé à effectuer cette action."
        addToast({
          title: "Accès refusé",
          message: message,
          type: "error"
        })
      }
    },
  }) as typeof $fetch

  return { provide: { api } }
})