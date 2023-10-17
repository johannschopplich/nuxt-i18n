/* eslint-disable antfu/top-level-function */
import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import { options } from '#build/i18n'

const isString = (val: unknown): val is string => typeof val === 'string'
const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

const getLocalesRegex = (localeCodes: string[]) =>
  new RegExp(`^/(${localeCodes.join('|')})(?:/|$)`, 'i')

/**
 * Extract locale code from a given route:
 * - If route has a name, try to extract locale from it
 * - Otherwise, fall back to using the routes' path
 */
export function getLocaleFromRoute(
  route: string | RouteLocationNormalizedLoaded | RouteLocationNormalized,
  { localeCodes = options.locales } = {},
): string {
  const localesPattern = `(${localeCodes.join('|')})`
  const regexpName = new RegExp(`___${localesPattern}$`, 'i')
  const regexpPath = getLocalesRegex(localeCodes)

  // Extract from route name
  if (isObject(route)) {
    if (route.name) {
      const name = isString(route.name) ? route.name : route.name.toString()
      const matches = name.match(regexpName)
      if (matches && matches.length > 1)
        return matches[1]
    }
    else if (route.path) {
      // Extract from path
      const matches = route.path.match(regexpPath)
      if (matches && matches.length > 1)
        return matches[1]
    }
  }
  else if (isString(route)) {
    const matches = route.match(regexpPath)
    if (matches && matches.length > 1)
      return matches[1]
  }

  return ''
}
