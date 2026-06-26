// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isLoggedIn } = useAuth()

  const publicPages = ['/auth/login', '/auth/signup', '/auth/forget-password']
  if (publicPages.includes(to.path)) return

  if (!isLoggedIn.value) {
    return navigateTo('/auth/login')
  }
})