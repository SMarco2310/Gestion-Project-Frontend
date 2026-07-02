export default defineNuxtRouteMiddleware(async (to) => {
  return; // Bypass auth for seamless navigation
  const token = useCookie<string | null>('auth_token', {
    default: () => null,
  })

  const { user, getProfile } = useAuth()

  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forget-password', '/auth/reset-password','/organizations']
  const isPublicRoute = publicRoutes.includes(to.path) || to.path === '/'

  if (!token.value && !isPublicRoute) {
    return navigateTo('/auth/login')
    // return navigateTo('/organisations')

  }

  // Hydrate user state if token exists but user is not loaded
  if (token.value && !user.value) {
    try {
      await getProfile()
    } catch (error) {
      // Token is likely expired or invalid
      return navigateTo('/auth/login')
    }
  }

  if (token.value && isPublicRoute) {
    return navigateTo('/dashboard')
  }
  
})