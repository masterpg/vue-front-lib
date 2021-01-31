import VueRouter, { RouteConfig } from 'vue-router'
import HomePage from '@/demo/views/home'
import { ViewRoute } from '@/app/router'
import Vue from 'vue'

Vue.use(VueRouter)

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ViewRoutes {
  home: ViewRoute
  abc: ViewRoute
  shop: ViewRoute
  tree: ViewRoute
  img: ViewRoute
  markdown: ViewRoute
  markdownIt: ViewRoute
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
//  Setup router
//------------------------------------------------------------------------

function setupRouter(): VueRouter {
  const home = ViewRoute.newInstance({
    path: '/demo',
    component: HomePage,
  })

  const abc = ViewRoute.newInstance({
    path: '/demo/abc',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "demo/views/abc" */ '@/demo/views/abc'),
  })

  const shop = ViewRoute.newInstance({
    path: '/demo/shop',
    component: () => import(/* webpackChunkName: "demo/views/shop" */ '@/demo/views/shop'),
  })

  const tree = ViewRoute.newInstance({
    path: '/demo/tree',
    component: () => import(/* webpackChunkName: "demo/views/tree-view" */ '@/demo/views/tree-view'),
  })

  const img = ViewRoute.newInstance({
    path: '/demo/img',
    component: () => import(/* webpackChunkName: "demo/views/img" */ '@/demo/views/img'),
  })

  const markdown = ViewRoute.newInstance({
    path: '/demo/markdown',
    component: () => import(/* webpackChunkName: "demo/views/markdown" */ '@/demo/views/markdown'),
  })

  const markdownIt = ViewRoute.newInstance({
    path: '/demo/markdownIt',
    component: () => import(/* webpackChunkName: "demo/views/markdown-it" */ '@/demo/views/markdown-it'),
  })

  const fallback = ViewRoute.newInstance({
    path: '/demo/*',
    redirect: '/demo',
  })

  const viewRouteList = [home, abc, shop, tree, img, markdown, markdownIt, fallback]

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

  viewRoutes = { home, abc, shop, tree, img, markdown, markdownIt }

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

export { setupRouter, useRouter, useViewRoutes }
