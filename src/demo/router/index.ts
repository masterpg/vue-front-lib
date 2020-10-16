import VueRouter, { RouteConfig } from 'vue-router'
import HomePage from '@/demo/views/home'
import Vue from 'vue'

Vue.use(VueRouter)

//========================================================================
//
//  Implementation
//
//========================================================================

const home: RouteConfig & { getPath(): string } = {
  path: '/demo/home',
  component: HomePage,
  getPath(): string {
    return home.path
  },
}

const abc: RouteConfig & { getPath(): string } = {
  path: '/demo/abc',
  // route level code-splitting
  // this generates a separate chunk (about.[hash].js) for this route
  // which is lazy-loaded when the route is visited.
  component: () => import(/* webpackChunkName: "demo/views/abc" */ '@/demo/views/abc'),
  getPath(): string {
    return abc.path
  },
}

const shop: RouteConfig & { getPath(): string } = {
  path: '/demo/shop',
  component: () => import(/* webpackChunkName: "demo/views/shop" */ '@/demo/views/shop'),
  getPath(): string {
    return shop.path
  },
}

const tree: RouteConfig & { getPath(): string } = {
  path: '/demo/tree',
  component: () => import(/* webpackChunkName: "demo/views/tree-view" */ '@/demo/views/tree-view'),
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
