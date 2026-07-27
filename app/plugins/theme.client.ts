import useOrganizations from '~/composables/useOrganizations'
import useTheme from '~/composables/useTheme'

export default defineNuxtPlugin((nuxtApp) => {
  const { activeOrganization } = useOrganizations()
  const { setPrimaryColor } = useTheme()

  // Watch the entire activeOrganization ref deeply to catch cookie-based updates
  watch(
    activeOrganization,
    (newOrg) => {
      setPrimaryColor(newOrg?.primary_color || '#0B0E11')
    },
    { immediate: true, deep: true }
  )
})
