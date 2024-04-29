import { join } from 'pathe'
import type { NuxtModule } from '@nuxt/schema'
import { genDynamicImport, genImport, genSafeVariableName } from 'knitwork'
import { addImports, addPluginTemplate, addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { LocaleMessages } from '@byjohann/vue-i18n'
import { DEFAULT_LOCALE, DEFAULT_LOCALE_ROUTE_NAME_SUFFIX, DEFAULT_ROUTES_NAME_SEPARATOR } from './constants'
import { resolveLocales } from './locales'
import { setupPages } from './pages'
import { logger } from './utils'
import type { CustomRoutePages, LocaleInfo, Strategies } from './types'

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
   * Directory where your locale files are stored
   *
   * @remarks
   * Expected to be a relative path from the project root
   *
   * @default 'locales'
   */
  langDir?: string

  /**
   * Whether to enable locale auto-importing
   *
   * @remarks
   * When enabled, the module will automatically import all locale files from the `langDir` directory
   *
   * @default false
   */
  langImports?: boolean

  /**
   * Whether to lazy-load locale messages in the client
   *
   * @remarks
   * If enabled, locale messages will be loaded on demand when the user navigates to a route with a different locale
   *
   * This has no effect if the `langImports` option is disabled
   *
   * Note: When `strategy` is set to `no_prefix`, use the `useLazyLocaleSwitch` composable to ensure the translation messages are loaded before switching locales
   *
   * @default false
   */
  lazy?: boolean

  /**
   * The app's default messages
   *
   * @remarks
   * Can be omitted if auto-importing of locales is enabled
   *
   * @default {}
   */
  messages?: LocaleMessages<string>

  /**
   * Routes strategy
   *
   * @remarks
   * Can be set to one of the following:
   *
   * - `no_prefix`: routes won't have a locale prefix
   * - `prefix_except_default`: locale prefix added for every locale except default
   * - `prefix`: locale prefix added for every locale
   * - `prefix_and_default`: locale prefix added for every locale and default
   *
   * @default 'no_prefix'
   */
  strategy?: Strategies

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
  pages?: CustomRoutePages

  /**
   * Custom route overrides for the generated routes
   *
   * @example
   * routeOverrides: {
   *   // Use `en` catch-all page as fallback for non-existing pages
   *   '/en/:id(.*)*': '/:id(.*)*'
   * }
   *
   * @default {}
   */
  routeOverrides?: Record<string, string>

  /**
   * Print verbose debug information to the console during development mode
   *
   * @remarks
   * For example the list of localized routes (if enabled)
   *
   * @default false
   */
  logs?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@byjohann/nuxt-i18n',
    configKey: 'i18n',
    compatibility: {
      nuxt: '^3.7',
    },
  },
  defaults: {
    defaultLocale: DEFAULT_LOCALE,
    locales: [],
    langDir: 'locales',
    langImports: false,
    messages: {},
    strategy: 'no_prefix',
    pages: {},
    routeOverrides: {},
    lazy: false,
    logs: false,
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const langPath = (options.langImports && options.langDir) ? join(nuxt.options.srcDir, options.langDir!) : undefined
    const localeInfo = langPath ? await resolveLocales(langPath) : []

    if (!options.defaultLocale) {
      logger.warn('Missing default locale, falling back to `en`')
      options.defaultLocale = 'en'
    }

    if (!options.locales?.length) {
      logger.warn('Locales option is empty, falling back to using the default locale only')
      options.locales = [options.defaultLocale]
    }

    const syncLocaleFiles = new Set<LocaleInfo>()
    const asyncLocaleFiles = new Set<LocaleInfo>()

    if (langPath) {
      // Synchronously import locale messages for the default locale
      const localeObject = localeInfo.find(({ code }) => code === options.defaultLocale)
      if (localeObject)
        syncLocaleFiles.add(localeObject)

      // Import locale messages for the other locales
      for (const locale of localeInfo) {
        if (!syncLocaleFiles.has(locale) && !asyncLocaleFiles.has(locale))
          (options.lazy ? asyncLocaleFiles : syncLocaleFiles).add(locale)
      }
    }

    // Transpile runtime
    nuxt.options.build.transpile.push(resolve('runtime'))

    // Setup localized pages
    if (options.strategy !== 'no_prefix')
      setupPages(options as Required<ModuleOptions>, nuxt)

    // Add i18n plugin
    addPluginTemplate(resolve('runtime/plugin'))

    // Add i18n composables
    addImports([
      'useI18n',
      'useLazyLocaleSwitch',
      'useLocalizedPath',
      'useRouteLocale',
    ].map(name => ({
      name,
      as: name,
      from: resolve(`runtime/composables/${name}`),
    })))

    // Load options template
    addTemplate({
      filename: 'i18n.options.mjs',
      getContents() {
        return `
export const DEFAULT_LOCALE_ROUTE_NAME_SUFFIX = ${JSON.stringify(DEFAULT_LOCALE_ROUTE_NAME_SUFFIX)};
export const DEFAULT_ROUTES_NAME_SEPARATOR = ${JSON.stringify(DEFAULT_ROUTES_NAME_SEPARATOR)};
${[...syncLocaleFiles]
  .map(({ code, path }) => genImport(path, genSafeVariableName(`locale_${code}`)))
  .join('\n')}
export const options = ${JSON.stringify(options, null, 2)};
export const localeMessages = {
${[...syncLocaleFiles]
  .map(({ code }) => `  ${JSON.stringify(code)}: () => Promise.resolve(${genSafeVariableName(`locale_${code}`)}),`)
  .join('\n')}
${[...asyncLocaleFiles]
  .map(({ code, path }) => `  ${JSON.stringify(code)}: ${genDynamicImport(path)},`)
  .join('\n')}
};
`.trimStart()
      },
    })

    addTemplate({
      filename: 'i18n.options.d.ts',
      getContents() {
        return `
${genImport(resolve('module'), ['ModuleOptions'])}
export declare const DEFAULT_LOCALE_ROUTE_NAME_SUFFIX: ${JSON.stringify(DEFAULT_LOCALE_ROUTE_NAME_SUFFIX)};
export declare const DEFAULT_ROUTES_NAME_SEPARATOR: ${JSON.stringify(DEFAULT_ROUTES_NAME_SEPARATOR)};
export declare const options: Required<ModuleOptions>;
export declare const localeMessages: Record<string, () => Promise<Record<string, any>>>;
`.trimStart()
      },
    })
  },
}) as NuxtModule<ModuleOptions>
