import * as _path from 'path'
import VueRouter, { RouteConfig } from 'vue-router'
import HomePage from '@/demo/views/home'
import Vue from 'vue'
import { removeEndSlash } from 'web-base-lib'

Vue.use(VueRouter)

//========================================================================
//
//  Implementation
//
//========================================================================

/**
 * `routePath`の中にある変数プレースホルダーを`params`で指定された値に置き換えます。
 * 例えば`routePath`に'/post/:year/:month'が指定された場合、':year'と':month'を`params`で置き換えます。
 * @param routePath
 * @param params
 */
function replaceRouteParams(routePath: string, ...params: string[]): string {
  let result = routePath
  const pattern = /(:\w+)/
  for (const param of params) {
    result = result.replace(pattern, param)
  }
  return result
}
/*
 * ストレージページ用ルーティングの基底クラスです。
 */
class StorageRoute {
  constructor(params: { basePath: string; component: any }) {
    this.basePath = params.basePath
    this.component = params.component
  }

  readonly basePath: string

  readonly component: any

  get path(): string {
    // https://github.com/pillarjs/path-to-regexp/tree/v1.7.0#zero-or-more
    return `${this.basePath}/:nodePath*`
  }

  getPath(): string {
    return this.basePath
  }

  move(nodePath: string): boolean {
    const currentRoutePath = removeEndSlash(router.currentRoute.path)
    const nextPath = removeEndSlash(_path.join(this.basePath, nodePath))
    if (currentRoutePath === nextPath) {
      return false
    }

    router.push(nextPath)
    return true
  }

  /**
   * 現在ルートのURLからノードパスを取得します。
   */
  getNodePath(): string {
    if (!this.isCurrentRoute) return ''
    return router.currentRoute.params.nodePath ?? ''
  }

  /**
   * 現在ルートが本ルートか否かを示します。
   */
  get isCurrentRoute(): boolean {
    const reg = new RegExp(`^${this.basePath}/?`)
    return reg.test(router.currentRoute.path)
  }
}

//--------------------------------------------------
//  Home
//--------------------------------------------------

const home = {
  path: '/home',
  component: HomePage,
  getPath(): string {
    return home.path
  },
}

//--------------------------------------------------
//  Site Admin
//--------------------------------------------------

const siteAdmin = {
  path: '/siteAdmin',

  article: new StorageRoute({
    basePath: '/siteAdmin/article',
    component: () => import(/* webpackChunkName: "views/site-admin/article" */ '@/app/views/site-admin/article'),
  }),

  storage: new StorageRoute({
    basePath: '/siteAdmin/storage',
    component: () => import(/* webpackChunkName: "views/site-admin/storage" */ '@/app/views/site-admin/storage'),
  }),
}

//--------------------------------------------------
//  App Admin
//--------------------------------------------------

const appAdmin = {
  path: '/appAdmin',

  storage: new StorageRoute({
    basePath: '/appAdmin/storage',
    component: () => import(/* webpackChunkName: "views/app-admin/storage" */ '@/app/views/app-admin/storage'),
  }),
}

//--------------------------------------------------
//  Fallback
//--------------------------------------------------

const fallback: RouteConfig = {
  path: '*',
  redirect: '/home',
}

const router = new (class extends VueRouter {
  constructor() {
    super({
      mode: 'history',
      base: process.env.BASE_URL,
      routes: [home, siteAdmin.article, siteAdmin.storage, appAdmin.storage, fallback],
    })
  }

  readonly views = { home, siteAdmin, appAdmin }
})()

//========================================================================
//
//  Exports
//
//========================================================================

export default router
export { StorageRoute, replaceRouteParams }
