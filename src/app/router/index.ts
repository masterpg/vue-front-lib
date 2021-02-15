import * as _path from 'path'
import { Component, Dictionary, RedirectOption } from 'vue-router/types/router'
import { ComputedRef, Ref, computed, ref } from '@vue/composition-api'
import VueRouter, { RouteConfig } from 'vue-router'
import HomePage from '@/demo/views/home'
import Vue from 'vue'
import { extendedMethod } from '@/app/base'
import { removeEndSlash } from 'web-base-lib'

Vue.use(VueRouter)

//========================================================================
//
//  Interfaces
//
//========================================================================

const UserNameProp = 'userName'

interface RouterContainer {
  router: VueRouter
  routes: Routes
  params: RouteParams
}

interface Route<T extends Dictionary<string> = Dictionary<string>> {
  readonly path: ComputedRef<string>
  readonly params: ComputedRef<Partial<T>>
  readonly isCurrent: ComputedRef<boolean>
}

interface RouteInput {
  routePath: string
  component?: Component
  redirect?: RedirectOption
}

interface RawRoute {
  toRouteConfig(): { path: string; component: any }
  update(): void
}

interface UserRoute<T extends UserRouteParams = UserRouteParams> extends Route<T> {}

type UserRouteParams = { [UserNameProp]: string } & Dictionary<string>

interface StorageRoute<T extends UserRouteParams = UserRouteParams> extends UserRoute<T> {
  move(nodePath: string): boolean
  getNodePath(): string
}

interface Routes {
  home: Route
  articles: Route
  siteAdmin: {
    article: StorageRoute
    storage: StorageRoute
  }
  appAdmin: {
    storage: StorageRoute
  }
}

interface RouteParams {
  userName: ComputedRef<string>
}

//========================================================================
//
//  Implementation
//
//========================================================================

//------------------------------------------------------------------------
//  Helpers
//------------------------------------------------------------------------

/**
 * `routePath`の中にある変数プレースホルダーを`routeParams`で指定された値に置き換えます。
 *
 * @example
 * const routePath = ':userName/calendar/:year/:month'
 * const routeParams = { userName: 'taro', year: 2020, month: 1 }
 * replaceRouteParams(routePath, routeParams)
 * // 'taro/calendar/2020/1'
 *
 * @param routePath
 * @param routeParams
 */
function replaceRouteParams(routePath: string, routeParams: Partial<Dictionary<string>>): string {
  let result = routePath

  // 変数プレースホルダーの置き換え
  for (const paramName of Object.keys(routeParams)) {
    const pattern = new RegExp(`^(:${paramName})|/(:${paramName})`, 'g')
    let paramValue: string
    if (routeParams[paramName]) {
      paramValue = routeParams[paramName]!
    } else {
      paramValue = routeParams[paramName] === 'null' ? 'null' : 'undefined'
    }
    result = result.replaceAll(pattern, (str, p1, p2, offset, s) => {
      return str.replace(p1 || p2, paramValue)
    })
  }

  // 置き換えられない変数プレースホルダーがあった場合、空文字を返す
  const pattern = new RegExp(`^:[^/]+|/:[^/]+`, 'g')
  if (pattern.test(result)) return ''

  return result
}

function replaceUserNameRouteParams(routePath: string, routeParams: Partial<Dictionary<string>>): string {
  let result = routePath

  // パラメータからユーザー名を取得
  // ※取得できなかった場合、空文字を返す
  const userName = routeParams[UserNameProp]
  if (!userName) return ''

  // 変数プレースホルダーの置き換え
  const pattern = new RegExp(`^/(:${UserNameProp})$|^/(:${UserNameProp})/`)
  result = result.replace(pattern, (str, p1, p2, offset, s) => {
    return str.replace(p1 || p2, userName)
  })

  // 置き換えられない変数プレースホルダーがあった場合、空文字を返す
  if (pattern.test(result)) return ''

  return result
}

//------------------------------------------------------------------------
//  Routes
//------------------------------------------------------------------------

//--------------------------------------------------
//  Route
//--------------------------------------------------

namespace Route {
  export function newInstance<T extends Dictionary<string>>(input: RouteInput): Route<T> & RawRoute {
    return newRawInstance(input)
  }

  export function newRawInstance<T extends Dictionary<string>>(input: RouteInput) {
    const routePath = ref(input.routePath)

    const path = computed(() => {
      return path_get()
    })

    const path_get = extendedMethod(() => {
      return replaceRouteParams(routePath.value, params.value)
    })

    const params = ref({}) as Ref<Partial<T>>

    const isCurrent = ref(false)

    const component = ref(input.component)

    const redirect = ref(input.redirect)

    const toRouteConfig = extendedMethod<RawRoute['toRouteConfig']>(() => {
      return { path: routePath.value, component: component.value, redirect: redirect.value }
    })

    const update: RawRoute['update'] = () => {
      const router = RouterContainer.useRouter()
      isCurrent.value = isCurrentRoute()
      params.value = router.currentRoute.params as T
    }

    function isCurrentRoute(): boolean {
      const router = RouterContainer.useRouter()
      const currentPath = replaceRouteParams(routePath.value, router.currentRoute.params)
      if (!currentPath) return false
      return router.currentRoute.path.startsWith(currentPath)
    }

    return {
      routePath,
      path,
      path_get,
      params,
      isCurrent,
      component,
      toRouteConfig,
      update,
    }
  }
}

//--------------------------------------------------
//  UserRoute
//--------------------------------------------------

namespace UserRoute {
  export function newInstance<T extends UserRouteParams = UserRouteParams>(input: RouteInput): UserRoute<T> & RawRoute {
    const base = Route.newRawInstance<T>(input)

    base.path_get.value = () => {
      return replaceUserNameRouteParams(base.routePath.value, base.params.value)
    }

    return {
      ...base,
    }
  }
}

//--------------------------------------------------
//  StorageRoute
//--------------------------------------------------

namespace StorageRoute {
  export function newInstance<T extends UserRouteParams = UserRouteParams>(input: {
    routePath: string
    component: Component
  }): StorageRoute<T> & RawRoute {
    const base = Route.newRawInstance<T>(input)

    const move: StorageRoute['move'] = nodePath => {
      const router = RouterContainer.useRouter()
      const currentRoutePath = removeEndSlash(router.currentRoute.path)
      const nextPath = removeEndSlash(_path.join(base.path.value, nodePath))
      if (currentRoutePath === nextPath) {
        return false
      }

      router.push(nextPath)
      return true
    }

    const getNodePath: StorageRoute['getNodePath'] = () => {
      const router = RouterContainer.useRouter()
      if (!base.isCurrent) return ''

      return router.currentRoute.params.nodePath ?? ''
    }

    base.toRouteConfig.value = () => {
      return {
        // https://github.com/pillarjs/path-to-regexp/tree/v1.7.0#zero-or-more
        path: `${base.routePath.value}/:nodePath*`,
        component: base.component.value,
      }
    }

    return {
      ...base,
      move,
      getNodePath,
    }
  }
}

//------------------------------------------------------------------------
//  Setup router
//------------------------------------------------------------------------

namespace RouterContainer {
  let instance: RouterContainer

  export function useRouter(): VueRouter {
    instance = instance ?? newInstance()
    return instance.router
  }

  export function useRoutes(): Routes {
    instance = instance ?? newInstance()
    return instance.routes
  }

  export function useRouteParams(): RouteParams {
    instance = instance ?? newInstance()
    return instance.params
  }

  function newInstance(): RouterContainer {
    const params = {
      userName: ref(''),
    }

    const home = Route.newInstance({
      routePath: '/',
      component: HomePage,
    })

    const articles = UserRoute.newInstance({
      routePath: `/:${UserNameProp}/articles/:articleId`,
      component: HomePage,
    })

    const siteAdmin = {
      article: StorageRoute.newInstance({
        routePath: `/:${UserNameProp}/siteAdmin/article`,
        component: () => import(/* webpackChunkName: "views/site-admin/article" */ '@/app/views/site-admin/article'),
      }),

      storage: StorageRoute.newInstance({
        routePath: `/:${UserNameProp}/siteAdmin/storage`,
        component: () => import(/* webpackChunkName: "views/site-admin/storage" */ '@/app/views/site-admin/storage'),
      }),
    }

    const appAdmin = {
      storage: StorageRoute.newInstance({
        routePath: `/:${UserNameProp}/appAdmin/storage`,
        component: () => import(/* webpackChunkName: "views/app-admin/storage" */ '@/app/views/app-admin/storage'),
      }),
    }

    const fallback = Route.newInstance({
      routePath: '*',
      redirect: '/',
    })

    const routeList = [home, articles, siteAdmin.article, siteAdmin.storage, appAdmin.storage, fallback]

    const router = new (class extends VueRouter {
      constructor() {
        super({
          mode: 'history',
          base: process.env.BASE_URL,
          routes: routeList.map(item => item.toRouteConfig()),
        })
      }
    })()

    router.beforeEach((to, from, next) => {
      routeList.forEach(vieRoute => vieRoute.update())
      params.userName.value = to.params[UserNameProp] || ''
      next()
    })

    router.afterEach(() => {
      routeList.forEach(vieRoute => vieRoute.update())
      params.userName.value = router.currentRoute.params[UserNameProp] || ''
    })

    const routes = { home, articles, siteAdmin, appAdmin }

    return { router, routes, params }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

const { useRouter, useRoutes, useRouteParams } = RouterContainer
export { Route, RawRoute, StorageRoute, replaceRouteParams, useRouter, useRoutes, useRouteParams }
