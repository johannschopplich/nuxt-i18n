import type { I18nInstance } from '@byjohann/vue-i18n'
import { useNuxtApp } from '#imports'

export function useI18n<const Locale extends string = string>() {
  return useNuxtApp().$i18n as unknown as I18nInstance<Locale>
}
