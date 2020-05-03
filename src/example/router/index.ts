import * as _path from 'path'
import { BaseRouter, ViewRoute, setRouter } from '@/lib'
import { removeEndSlash } from 'web-base-lib'

//========================================================================
//
//  Implementation
//
//========================================================================

let router: AppRouter

function initRouter() {
  router = new AppRouter({
    mode: 'history',
    routes: [
      error404Route,
      demoRoute.abc,
      demoRoute.shop,
      demoRoute.userStorage,
      demoRoute.appStorage,
      componentsRoute.treeView,
      componentsRoute.img,
      componentsRoute.markdown,
      componentsRoute.markdownIt,
    ],
  })
  setRouter(router)
}

//--------------------------------------------------
//  Error404Route
//--------------------------------------------------

const error404Route = new (class Error404Route extends ViewRoute {
  get path() {
    return '*'
  }

  get component() {
    return () => import(/* webpackChunkName: "views/error404" */ '@/example/views/error404')
  }
})()

//--------------------------------------------------
//  DemoRoute
//--------------------------------------------------

abstract class StorageRoute extends ViewRoute<DemoRoute> {
  abstract readonly basePath: string

  get path() {
    // https://github.com/pillarjs/path-to-regexp/tree/v1.7.0#zero-or-more
    return `${this.basePath}/:nodePath*`
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

  getNodePath(): string {
    if (!this.isCurrentRoute) return ''
    return router.currentRoute.params.nodePath || ''
  }

  /**
   * 現在ルートが本ルートか否かを示します。
   */
  get isCurrentRoute(): boolean {
    const reg = new RegExp(`^${this.basePath}/?`)
    return reg.test(router.currentRoute.path)
  }
}

class UserStorageRoute extends StorageRoute {
  get basePath() {
    return `${this.parent!.path}/storage/user`
  }

  get component() {
    return () => import(/* webpackChunkName: "views/demo/storage/user" */ '@/example/views/demo/storage/index.user')
  }
}

class AppStorageRoute extends StorageRoute {
  get basePath() {
    return `${this.parent!.path}/storage/app`
  }

  get component() {
    return () => import(/* webpackChunkName: "views/demo/storage/user" */ '@/example/views/demo/storage/index.app')
  }
}

class DemoRoute extends ViewRoute {
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

  userStorage = new UserStorageRoute(this)

  appStorage = new AppStorageRoute(this)
}
const demoRoute = new DemoRoute()

//--------------------------------------------------
//  ComponentsRoute
//--------------------------------------------------

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

  img = new (class extends ViewRoute<ComponentsRoute> {
    get path() {
      return `${this.parent!.path}/img`
    }

    get component() {
      return () => import(/* webpackChunkName: "views/components/img" */ '@/example/views/components/img')
    }

    move() {
      router.push(this.path)
    }
  })(this)

  markdown = new (class extends ViewRoute<ComponentsRoute> {
    get path() {
      return `${this.parent!.path}/markdown`
    }

    get component() {
      return () => import(/* webpackChunkName: "views/components/markdown" */ '@/example/views/components/markdown')
    }

    move() {
      router.push(this.path)
    }
  })(this)

  markdownIt = new (class extends ViewRoute<ComponentsRoute> {
    get path() {
      return `${this.parent!.path}/markdown-it`
    }

    get component() {
      return () => import(/* webpackChunkName: "views/components/markdown-it" */ '@/example/views/components/markdown-it')
    }

    move() {
      router.push(this.path)
    }
  })(this)
})()

//--------------------------------------------------
//  AppRouter
//--------------------------------------------------

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

export { router, initRouter, StorageRoute }
