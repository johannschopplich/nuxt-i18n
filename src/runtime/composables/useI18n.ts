import type { UseI18n } from '@byjohann/vue-i18n'
import { useNuxtApp } from '#imports'

export function useI18n() {
  return useNuxtApp().$i18n as UseI18n
}
