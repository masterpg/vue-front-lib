import * as _path from 'path'
import { BaseRouter, ViewRoute, setRouter } from '@/app/router/base'
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
      adminRoute.article,
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

/**
 * ストレージページ用ルーティングの基底クラスです。
 * サブクラスでは`basePath`と`component`を実装してください。
 * これとは逆に`path`と`move`を実装する必要はありません。
 */
abstract class StorageRoute<PARENT extends ViewRoute = any> extends ViewRoute<PARENT> {
  abstract readonly basePath: string

  get path(): string {
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

  /**
   * 現在ルートのURLからノードパスを取得します。
   */
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

//--------------------------------------------------
//  Error404Route
//--------------------------------------------------

const error404Route = new (class Error404Route extends ViewRoute {
  get path() {
    return '*'
  }

  get component() {
    return () => import(/* webpackChunkName: "views/error404" */ '@/app/views/error404')
  }
})()

//--------------------------------------------------
//  AdminRoute
//--------------------------------------------------

const adminRoute = new (class AdminRoute extends ViewRoute {
  get path() {
    return '/views/admin'
  }

  get component() {
    return undefined
  }

  article = new (class extends StorageRoute<AdminRoute> {
    get basePath() {
      return `${this.parent!.path}/article`
    }

    get component() {
      return () => import(/* webpackChunkName: "views/admin/article" */ '@/app/views/admin/article')
    }
  })(this)
})()

//--------------------------------------------------
//  DemoRoute
//--------------------------------------------------

class UserStorageRoute extends StorageRoute<DemoRoute> {
  get basePath() {
    return `${this.parent!.path}/storage/user`
  }

  get component() {
    return () => import(/* webpackChunkName: "views/demo/storage/user" */ '@/app/views/demo/storage/user')
  }
}

class AppStorageRoute extends StorageRoute<DemoRoute> {
  get basePath() {
    return `${this.parent!.path}/storage/app`
  }

  get component() {
    return () => import(/* webpackChunkName: "views/demo/storage/app" */ '@/app/views/demo/storage/app')
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
      return () => import(/* webpackChunkName: "views/demo/abc" */ '@/app/views/demo/abc')
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
      return () => import(/* webpackChunkName: "views/demo/shop" */ '@/app/views/demo/shop')
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
      return () => import(/* webpackChunkName: "views/components/tree-view" */ '@/app/views/components/tree-view')
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
      return () => import(/* webpackChunkName: "views/components/img" */ '@/app/views/components/img')
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
      return () => import(/* webpackChunkName: "views/components/markdown" */ '@/app/views/components/markdown')
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
      return () => import(/* webpackChunkName: "views/components/markdown-it" */ '@/app/views/components/markdown-it')
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
    admin: adminRoute,
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
