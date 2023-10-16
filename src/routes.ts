import type { NuxtPage } from '@nuxt/schema'
import { adjustRoutePathForTrailingSlash } from './utils'

export interface ComputedRouteOptions {
  locales: readonly string[]
  paths: Record<string, string>
}

export type RouteOptionsResolver = (
  route: NuxtPage,
  localeCodes: string[]
) => ComputedRouteOptions | null

export interface LocalizeRoutesPrefixableOptions {
  currentLocale: string
  defaultLocale: string
  isChild: boolean
  path: string
}

export type LocalizeRoutesPrefixable = (
  options: LocalizeRoutesPrefixableOptions
) => boolean

export interface I18nRoutingLocalizationOptions {
  /**
   * The app's default locale
   *
   * @default ''
   */
  defaultLocale?: string
  /**
   * List of locales supported by the app
   *
   * @default []
   */
  locales?: string[]
  /**
   * Whether to use trailing slash
   *
   * @default false
   */
  trailingSlash?: boolean
  /**
   * Internal separator used for generated route names for each locale
   *
   * @default '___'
   */
  routesNameSeparator?: string
  /**
   * Whether to prefix the localize route path with the locale or not
   *
   * @default {@link DefaultLocalizeRoutesPrefixable}
   */
  localizeRoutesPrefixable?: LocalizeRoutesPrefixable
  /**
   * Whether to include uprefixed fallback route
   *
   * @default false
   */
  includeUprefixedFallback?: boolean
  /**
   * Resolver for route localizing options
   *
   * @default undefined
   */
  optionsResolver?: RouteOptionsResolver
}

function prefixable(options: LocalizeRoutesPrefixableOptions): boolean {
  const { currentLocale, defaultLocale, isChild, path } = options

  const isDefaultLocale = currentLocale === defaultLocale
  const isChildWithRelativePath = isChild && !path.startsWith('/')

  // No need to add prefix if child's path is relative and current locale is default
  return !isChildWithRelativePath && !isDefaultLocale
}

export const DefaultLocalizeRoutesPrefixable = prefixable

/**
 * Localize all routes with given locales
 *
 * @remarks
 * Based on [@intlify/routing](https://github.com/intlify/routing), licensed under MIT
 */
export function localizeRoutes(
  routes: NuxtPage[],
  {
    defaultLocale = '',
    trailingSlash = false,
    optionsResolver = undefined,
    localizeRoutesPrefixable = DefaultLocalizeRoutesPrefixable,
    locales = [],
  }: I18nRoutingLocalizationOptions = {},
): NuxtPage[] {
  function makeLocalizedRoutes(
    route: NuxtPage,
    allowedLocaleCodes: string[],
    isChild = false,
    isExtraPageTree = false,
  ): NuxtPage[] {
    // Skip route localization
    if (route.redirect && !route.file)
      return [route]

    // Resolve with route (page) options
    let routeOptions: ComputedRouteOptions | null = null
    if (optionsResolver != null) {
      routeOptions = optionsResolver(route, allowedLocaleCodes)
      if (routeOptions == null)
        return [route]
    }

    // Component specific options
    const componentOptions: ComputedRouteOptions = {
      locales,
      paths: {},
    }

    if (routeOptions != null)
      Object.assign(componentOptions, routeOptions)

    Object.assign(componentOptions, { locales: allowedLocaleCodes })

    // Double check locales to remove any locales not found in `pageOptions`
    // This is there to prevent children routes being localized even though they are disabled in the configuration
    if (
      componentOptions.locales.length > 0
      && routeOptions
      && routeOptions.locales != null
      && routeOptions.locales.length > 0
    ) {
      componentOptions.locales = componentOptions.locales.filter(
        locale => routeOptions!.locales.includes(locale),
      )
    }

    return componentOptions.locales.reduce<NuxtPage[]>((_routes, locale) => {
      const { name } = route
      let { path } = route
      const localizedRoute = { ...route }

      // Make localized page name
      if (name)
        localizedRoute.name = `${name}___${locale}`

      // Generate localized children routes
      if (route.children) {
        localizedRoute.children = route.children.reduce<NonNullable<NuxtPage['children']>>(
          (children, child) => [
            ...children,
            ...makeLocalizedRoutes(child, [locale], true, isExtraPageTree),
          ],
          [],
        )
      }

      // Get custom path if any
      if (componentOptions.paths && componentOptions.paths[locale])
        path = componentOptions.paths[locale]

      const isChildWithRelativePath = isChild && !path.startsWith('/')

      // Add route prefix
      const shouldAddPrefix = localizeRoutesPrefixable({
        isChild,
        path,
        currentLocale: locale,
        defaultLocale,
      })
      if (shouldAddPrefix)
        path = `/${locale}${path}`

      if (path) {
        path = adjustRoutePathForTrailingSlash(
          path,
          trailingSlash,
          isChildWithRelativePath,
        )
      }

      localizedRoute.path = path
      _routes.push(localizedRoute)

      return _routes
    }, [])
  }

  return routes.reduce<NuxtPage[]>(
    (localized, route) => [
      ...localized,
      ...makeLocalizedRoutes(route, locales || []),
    ],
    [],
  )
}
