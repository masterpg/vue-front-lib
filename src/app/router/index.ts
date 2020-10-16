import * as _path from 'path'
import VueRouter, { RouteConfig } from 'vue-router'
import HomePage from '@/demo/views/home'
import Vue from 'vue'

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

  article: {
    get path(): string {
      return _path.join(siteAdmin.path, 'article')
    },
    component: () => import(/* webpackChunkName: "views/site-admin/article" */ '@/app/views/site-admin/article'),
    getPath(): string {
      return siteAdmin.article.path
    },
  },

  storage: {
    get path(): string {
      return _path.join(siteAdmin.path, 'storage')
    },
    component: () => import(/* webpackChunkName: "views/site-admin/storage" */ '@/app/views/site-admin/storage'),
    getPath(): string {
      return siteAdmin.storage.path
    },
  },
}

//--------------------------------------------------
//  App Admin
//--------------------------------------------------

const appAdmin = {
  path: '/appAdmin',
  storage: {
    get path(): string {
      return _path.join(appAdmin.path, 'storage')
    },
    component: () => import(/* webpackChunkName: "views/app-admin/storage" */ '@/app/views/app-admin/storage'),
    getPath(): string {
      return appAdmin.storage.path
    },
  },
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
export { replaceRouteParams }
