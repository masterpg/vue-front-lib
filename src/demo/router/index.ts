import VueRouter, { RouteConfig } from 'vue-router'
import HomePage from '@/demo/views/home'
import { Route } from '@/app/router'
import Vue from 'vue'

Vue.use(VueRouter)

//========================================================================
//
//  Interfaces
//
//========================================================================

interface RouterContainer {
  router: VueRouter
  routes: Routes
}

interface Routes {
  home: Route
  abc: Route
  shop: Route
  tree: Route
  img: Route
  markdown: Route
  markdownIt: Route
}

//========================================================================
//
//  Implementation
//
//========================================================================

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

  function newInstance(): RouterContainer {
    const home = Route.newInstance({
      routePath: '/demo',
      component: HomePage,
    })

    const abc = Route.newInstance({
      routePath: '/demo/abc',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "demo/views/abc" */ '@/demo/views/abc'),
    })

    const shop = Route.newInstance({
      routePath: '/demo/shop',
      component: () => import(/* webpackChunkName: "demo/views/shop" */ '@/demo/views/shop'),
    })

    const tree = Route.newInstance({
      routePath: '/demo/tree',
      component: () => import(/* webpackChunkName: "demo/views/tree-view" */ '@/demo/views/tree-view'),
    })

    const img = Route.newInstance({
      routePath: '/demo/img',
      component: () => import(/* webpackChunkName: "demo/views/img" */ '@/demo/views/img'),
    })

    const markdown = Route.newInstance({
      routePath: '/demo/markdown',
      component: () => import(/* webpackChunkName: "demo/views/markdown" */ '@/demo/views/markdown'),
    })

    const markdownIt = Route.newInstance({
      routePath: '/demo/markdownIt',
      component: () => import(/* webpackChunkName: "demo/views/markdown-it" */ '@/demo/views/markdown-it'),
    })

    const fallback = Route.newInstance({
      routePath: '/demo/*',
      redirect: '/demo',
    })

    const routeList = [home, abc, shop, tree, img, markdown, markdownIt, fallback]

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
      next()
    })

    router.afterEach(() => {
      routeList.forEach(vieRoute => vieRoute.update())
    })

    const routes = { home, abc, shop, tree, img, markdown, markdownIt }

    return { router, routes }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

const { useRouter, useRoutes } = RouterContainer
export { useRouter, useRoutes }
