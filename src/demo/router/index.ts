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

const home: RouteConfig & { getPath(): string } = {
  path: '/demo/home',
  name: 'Home',
  component: HomePage,
  getPath(): string {
    return home.path
  },
}

const abc: RouteConfig & { getPath(): string } = {
  path: '/demo/abc',
  name: 'ABC',
  // route level code-splitting
  // this generates a separate chunk (about.[hash].js) for this route
  // which is lazy-loaded when the route is visited.
  component: () => import(/* webpackChunkName: "about" */ '@/demo/views/abc'),
  getPath(): string {
    return abc.path
  },
}

const shop: RouteConfig & { getPath(): string } = {
  path: '/demo/shop',
  name: 'Shop',
  component: () => import(/* webpackChunkName: "about" */ '@/demo/views/shop'),
  getPath(): string {
    return shop.path
  },
}

const tree: RouteConfig & { getPath(): string } = {
  path: '/demo/tree',
  name: 'TreeView',
  component: () => import(/* webpackChunkName: "about" */ '@/demo/views/tree-view'),
  getPath(): string {
    return tree.path
  },
}

const fallback: RouteConfig = {
  path: '/demo/*',
  redirect: '/demo/home',
}

const router = new (class extends VueRouter {
  constructor() {
    super({
      mode: 'history',
      base: process.env.BASE_URL,
      routes: [home, abc, shop, tree, fallback],
    })
  }

  readonly views = { home, abc, shop, tree, fallback }
})()

//========================================================================
//
//  Exports
//
//========================================================================

export default router
