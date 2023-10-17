import { genTypeImport } from 'knitwork'
import {
  addImportsSources,
  addPlugin,
  addTemplate,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import { setupPages } from './pages'
import { logger } from './utils'

export interface ModuleOptions {
  /**
   * List of locales supported by your app
   *
   * @remarks
   * Intended to be an array of string codes, e.g. `['en', 'fr']`
   *
   * @default []
   */
  locales?: string[]

  /**
   * The app's default locale
   *
   * @remarks
   * It's recommended to set this to some locale regardless of the chosen strategy, as it will be used as a fallback locale
   *
   * @default 'en'
   */
  defaultLocale?: string

  /**
   * Customize the names of the paths for a specific locale
   *
   * @remarks
   * In some cases, you might want to translate URLs in addition to having them prefixed with the locale code
   *
   * @example
   * pages: {
   *   about: {
   *     en: '/about-us', // Accessible at `/en/about-us`
   *     fr: '/a-propos', // Accessible at `/fr/a-propos`
   *     es: '/sobre'     // Accessible at `/es/sobre`
   *   }
   * }
   * @default {}
   */
  pages?: Record<string, Record<string, string>>
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-i18n',
    configKey: 'i18n',
    compatibility: {
      nuxt: '^3',
      bridge: false,
    },
  },
  defaults: {
    defaultLocale: '',
    locales: [],
    pages: {},
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    if (!options.defaultLocale) {
      logger.warn('Missing default locale, falling back to `en`')
      options.defaultLocale = 'en'
    }

    if (!options.locales?.length) {
      logger.warn('Locales option is empty, falling back to using the default locale only')
      options.locales = [options.defaultLocale]
    }

    // Transpile runtime
    nuxt.options.build.transpile.push(resolve('runtime'))

    // Setup localized pages
    setupPages(options as Required<ModuleOptions>, nuxt)

    // Add i18n plugin
    addPlugin(resolve('runtime/plugin'))

    // Load options template
    addTemplate({
      filename: 'i18n.mjs',
      getContents: () =>
        `export const options = ${JSON.stringify(options, null, 2)};`,
    })

    addTemplate({
      filename: 'i18n.d.ts',
      getContents: () => [
        genTypeImport(resolve('module'), ['ModuleOptions']),
        'export declare const options: Required<ModuleOptions>;',
        `export type Lang = ${options.locales!.map(locale => `'${locale}'`).join(' | ')};`,
      ].join('\n'),
    })

    addImportsSources({
      from: resolve('runtime/composables'),
      imports: ['useLocale'],
    })

    addTypeTemplate({
      filename: 'i18n-global.d.ts',
      getContents: () => [
        `declare module "nuxt/dist/pages/runtime/composables" {`,
        `  interface PageMeta {`,
        `    i18n?: boolean`,
        `  }`,
        `}`,
        `export {}`,
      ].join('\n'),
    })
  },
})
