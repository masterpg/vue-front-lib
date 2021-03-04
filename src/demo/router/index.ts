import { CurrentRoute, FlowStatus, RawCurrentRoute, RawRoute, Route } from '@/app/router'
import { Ref, UnwrapRef, reactive, ref } from '@vue/composition-api'
import VueRouter, { RouteConfig } from 'vue-router'
import HomePage from '@/demo/views/home'
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
  route: CurrentRoute
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
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const home = reactive(
      Route.newRawInstance({
        routePath: '/demo',
        component: HomePage,
      })
    )

    const abc = reactive(
      Route.newRawInstance({
        routePath: '/demo/abc',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "demo/views/abc" */ '@/demo/views/abc'),
      })
    )

    const shop = reactive(
      Route.newRawInstance({
        routePath: '/demo/shop',
        component: () => import(/* webpackChunkName: "demo/views/shop" */ '@/demo/views/shop'),
      })
    )

    const tree = reactive(
      Route.newRawInstance({
        routePath: '/demo/tree',
        component: () => import(/* webpackChunkName: "demo/views/tree-view" */ '@/demo/views/tree-view'),
      })
    )

    const img = reactive(
      Route.newRawInstance({
        routePath: '/demo/img',
        component: () => import(/* webpackChunkName: "demo/views/img" */ '@/demo/views/img'),
      })
    )

    const markdown = reactive(
      Route.newRawInstance({
        routePath: '/demo/markdown',
        component: () => import(/* webpackChunkName: "demo/views/markdown" */ '@/demo/views/markdown'),
      })
    )

    const markdownIt = reactive(
      Route.newRawInstance({
        routePath: '/demo/markdownIt',
        component: () => import(/* webpackChunkName: "demo/views/markdown-it" */ '@/demo/views/markdown-it'),
      })
    )

    const fallback = reactive(
      Route.newRawInstance({
        routePath: '/demo/(.*)',
        redirect: '/demo',
      })
    )

    const routeList: UnwrapRef<RawRoute>[] = [home, abc, shop, tree, img, markdown, markdownIt, fallback]

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const router = new (class extends VueRouter {
      constructor() {
        super({
          mode: 'history',
          base: process.env.BASE_URL,
          routes: routeList.map(item => item.toRouteConfig()),
        })
      }
    })()

    const routes: Routes = { home, abc, shop, tree, img, markdown, markdownIt }

    const route: Ref<RawCurrentRoute> = ref({
      basePath: '',
      path: '',
      status: 'None' as FlowStatus,
    })

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    router.beforeEach(async (to, from, next) => {
      // 次のルートに進むかチェック
      for (const route of routeList) {
        const ret = await route.proceed(to, from)
        if (!ret) return false
      }

      // 各ルートオブジェクトを更新
      for (const route of routeList) {
        route.update(to, from)
      }

      next()
    })

    router.afterEach((to, from) => {
      const { basePath, path, status } = routeList.find(route => route.isCurrent)!
      Object.assign(route.value, { basePath, path, status })
    })

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return { router, routes, route: route.value }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

const { useRouter, useRoutes } = RouterContainer
export { useRouter, useRoutes }
