import { useLogger } from '@nuxt/kit'

export const logger = useLogger('nuxt-i18n')

export function adjustRoutePathForTrailingSlash(
  pagePath: string,
  trailingSlash: boolean,
  isChildWithRelativePath: boolean,
) {
  return pagePath.replace(/\/+$/, '') + (trailingSlash ? '/' : '') || (isChildWithRelativePath ? '' : '/')
}

export function getRouteName(routeName?: string | symbol | null) {
  return typeof routeName === 'string'
    ? routeName
    : typeof routeName === 'symbol'
      ? routeName.toString()
      : '(null)'
}

export function getLocaleRouteName(
  routeName: string | null,
  locale: string,
  { routesNameSeparator }: { routesNameSeparator: string },
) {
  return getRouteName(routeName) + (routesNameSeparator + locale)
}
