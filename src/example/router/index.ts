import { BaseRouter, ViewRoute, setRouter } from '@/lib'

//========================================================================
//
//  Internal
//
//========================================================================

const error404Route = new (class Error404Route extends ViewRoute {
  get path() {
    return '*'
  }

  get component() {
    return () => import(/* webpackChunkName: "views/error404" */ '@/example/views/error404')
  }
})()

const demoRoute = new (class DemoRoute extends ViewRoute {
  get path() {
    return '/views/demo'
  }

  get component() {
    return undefined
  }

  abc = new (class extends ViewRoute<DemoRoute> {
    get path() {
      return `${this.parent!.path}/abc`
    }

    get component() {
      return () => import(/* webpackChunkName: "views/demo/abc" */ '@/example/views/demo/abc')
    }

    move() {
      router.push(this.path)
    }
  })(this)

  shop = new (class extends ViewRoute<DemoRoute> {
    get path() {
      return `${this.parent!.path}/shop`
    }

    get component() {
      return () => import(/* webpackChunkName: "views/demo/shop" */ '@/example/views/demo/shop')
    }

    move() {
      router.push(this.path)
    }
  })(this)

  storage = new (class extends ViewRoute<DemoRoute> {
    get path() {
      return `${this.parent!.path}/storage`
    }

    get component() {
      return () => import(/* webpackChunkName: "views/demo/storage" */ '@/example/views/demo/storage')
    }

    move() {
      router.push(this.path)
    }
  })(this)
})()

const componentsRoute = new (class ComponentsRoute extends ViewRoute {
  get path() {
    return '/views/components'
  }

  get component() {
    return undefined
  }

  treeView = new (class extends ViewRoute<ComponentsRoute> {
    get path() {
      return `${this.parent!.path}/tree-view`
    }

    get component() {
      return () => import(/* webpackChunkName: "views/components/tree-view" */ '@/example/views/components/tree-view')
    }

    move() {
      router.push(this.path)
    }
  })(this)
})()

class AppRouter extends BaseRouter {
  views = {
    error404: error404Route,

    demo: demoRoute,

    components: componentsRoute,
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export let router: AppRouter

export function initRouter() {
  router = new AppRouter({
    mode: 'history',
    routes: [error404Route, demoRoute.abc, demoRoute.shop, demoRoute.storage, componentsRoute.treeView],
  })
  setRouter(router)
}
