import * as _path from 'path'
import { Component, Dictionary, RedirectOption } from 'vue-router/types/router'
import { ComputedRef, computed, ref } from '@vue/composition-api'
import VueRouter, { RouteConfig } from 'vue-router'
import HomePage from '@/demo/views/home'
import Vue from 'vue'
import { removeEndSlash } from 'web-base-lib'

Vue.use(VueRouter)

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ViewRoutes {
  home: ViewRoute
  siteAdmin: SiteAdmin
  appAdmin: AppAdmin
}

interface SiteAdmin {
  article: StorageRoute
  storage: StorageRoute
}

interface AppAdmin {
  storage: StorageRoute
}

//========================================================================
//
//  Implementation
//
//========================================================================

//------------------------------------------------------------------------
//  Variables
//------------------------------------------------------------------------

let router: VueRouter

let viewRoutes: ViewRoutes

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
function replaceRouteParams(routePath: string, routeParams: Record<string, string>): string {
  let result = routePath

  // 変数プレースホルダーの置き換え
  for (const paramName of Object.keys(routeParams)) {
    const pattern = new RegExp(`^(:${paramName})|/(:${paramName})`, 'g')
    const paramValue = routeParams[paramName]
    result = result.replaceAll(pattern, (str, p1, p2, offset, s) => {
      return str.replace(p1 || p2, paramValue)
    })
  }

  // 置き換えられない変数プレースホルダーがあった場合、空文字を返す
  const pattern = new RegExp(`^:[^/]+|/:[^/]+`, 'g')
  if (pattern.test(result)) return ''

  return result
}

//------------------------------------------------------------------------
//  Routes
//------------------------------------------------------------------------

//--------------------------------------------------
//  ViewRoute
//--------------------------------------------------

interface ViewRoute {
  readonly path: ComputedRef<string>
}

interface RawRoute extends ViewRoute {
  toRouteConfig(): { path: string; component: any }
  update(router: VueRouter): void
}

namespace ViewRoute {
  export function newInstance(params: { path: string; component?: Component; redirect?: RedirectOption }): ViewRoute & RawRoute {
    const routePath = ref(params.path)

    const routeParams = ref<Record<string, string>>({})

    const component = ref(params.component)

    const redirect = ref(params.redirect)

    const path = computed(() => {
      return replaceRouteParams(routePath.value, routeParams.value)
    })

    const toRouteConfig: RawRoute['toRouteConfig'] = () => {
      return { path: routePath.value, component: component.value, redirect: redirect.value }
    }

    const update: RawRoute['update'] = router => {
      routeParams.value = router.currentRoute.params
    }

    return {
      path,
      toRouteConfig,
      update,
    }
  }
}

//--------------------------------------------------
//  StorageRoute
//--------------------------------------------------

interface StorageRoute extends ViewRoute {
  move(nodePath: string): boolean
  getNodePath(): string
}

namespace StorageRoute {
  export function newInstance(params: { path: string; component: Component }): StorageRoute & RawRoute {
    const routePath = ref(params.path)

    const routeParams = ref<Dictionary<string>>({})

    const component = ref(params.component)

    const path = computed(() => {
      return replaceRouteParams(routePath.value, routeParams.value)
    })

    const move: StorageRoute['move'] = nodePath => {
      const currentRoutePath = removeEndSlash(router.currentRoute.path)
      const nextPath = removeEndSlash(_path.join(path.value, nodePath))
      if (currentRoutePath === nextPath) {
        return false
      }

      router.push(nextPath)
      return true
    }

    const getNodePath: StorageRoute['getNodePath'] = () => {
      const reg = new RegExp(`^${path.value}/`, 'g')
      if (!reg.test(router.currentRoute.path)) return ''

      return router.currentRoute.params.nodePath ?? ''
    }

    const toConfig: RawRoute['toRouteConfig'] = () => {
      return {
        // https://github.com/pillarjs/path-to-regexp/tree/v1.7.0#zero-or-more
        path: `${routePath.value}/:nodePath*`,
        component: component.value,
      }
    }

    const update: RawRoute['update'] = () => {
      routeParams.value = router.currentRoute.params
    }

    return {
      path,
      move,
      getNodePath,
      toRouteConfig: toConfig,
      update,
    }
  }
}

//------------------------------------------------------------------------
//  Setup router
//------------------------------------------------------------------------

function setupRouter(): VueRouter {
  const home = ViewRoute.newInstance({
    path: '/',
    component: HomePage,
  })

  const siteAdmin = {
    article: StorageRoute.newInstance({
      path: '/:userName/siteAdmin/article',
      component: () => import(/* webpackChunkName: "views/site-admin/article" */ '@/app/views/site-admin/article'),
    }),

    storage: StorageRoute.newInstance({
      path: '/:userName/siteAdmin/storage',
      component: () => import(/* webpackChunkName: "views/site-admin/storage" */ '@/app/views/site-admin/storage'),
    }),
  }

  const appAdmin = {
    storage: StorageRoute.newInstance({
      path: '/:userName/appAdmin/storage',
      component: () => import(/* webpackChunkName: "views/app-admin/storage" */ '@/app/views/app-admin/storage'),
    }),
  }

  const fallback = ViewRoute.newInstance({
    path: '*',
    redirect: '/',
  })

  const viewRouteList = [home, siteAdmin.article, siteAdmin.storage, appAdmin.storage, fallback]

  router = new (class extends VueRouter {
    constructor() {
      super({
        mode: 'history',
        base: process.env.BASE_URL,
        routes: viewRouteList.map(item => item.toRouteConfig()),
      })
    }
  })()

  router.beforeEach((to, from, next) => {
    viewRouteList.forEach(vieRoute => vieRoute.update(router))
    next()
  })

  router.afterEach(() => {
    viewRouteList.forEach(vieRoute => vieRoute.update(router))
  })

  viewRoutes = { home, siteAdmin, appAdmin }

  return router
}

function useRouter(): VueRouter {
  if (!router) {
    throw new Error('VueRouter is not set up.')
  }
  return router
}

function useViewRoutes(): ViewRoutes {
  if (!viewRoutes) {
    throw new Error('ViewRoutes is not set up.')
  }
  return viewRoutes
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ViewRoute, RawRoute, StorageRoute, replaceRouteParams, setupRouter, useRouter, useViewRoutes }
