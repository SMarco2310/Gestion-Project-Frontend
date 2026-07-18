export const useSmartBack = () => {
  const router = useRouter()

  const goBack = (fallbackRoute: string) => {
    // Check if the user navigated to this page from within the app
    // In Vue Router 4 / Nuxt 3, history.state.back contains the path of the previous internal route
    const hasHistory = router.options.history.state.back

    if (hasHistory) {
      router.back()
    } else {
      // If there's no internal history (e.g., page refresh or direct link), use the fallback
      navigateTo(fallbackRoute)
    }
  }

  return { goBack }
}
