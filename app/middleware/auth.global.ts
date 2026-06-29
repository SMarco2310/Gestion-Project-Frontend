export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
  })

  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forget-password', '/auth/reset-password']
  const isPublicRoute = publicRoutes.includes(to.path) || to.path === '/'

  if (!token.value && !isPublicRoute) {
    return navigateTo('/auth/login')
  }

  if (token.value && isPublicRoute) {
    return navigateTo('/dashboard')
  }
  
})