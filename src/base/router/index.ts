import { Route } from 'vue-router/types/router'
import Vue from 'vue'
import VueRouter from 'vue-router'
import { i18n } from '@/base/i18n'
const assign = require('lodash/assign')

Vue.use(VueRouter)

abstract class ViewRoute<T extends ViewRoute = any> {
  constructor(public readonly parent?: T) {}

  abstract readonly path: string

  abstract readonly component?: any

  protected replaceRouteParams(...params: string[]): string {
    let result = this.path
    // 例: "/post/:year/:month"がパスの場合、
    //     ":year"と":month"をparamsで置き換える
    const pattern = /(:\w+)/
    for (const param of params) {
      result = result.replace(pattern, param)
    }
    return result
  }
}

const abcPageRoute = new (class ABCPageRoute extends ViewRoute {
  get path() {
    return '/views/abc-page'
  }

  get component() {
    return () => import(/* webpackChunkName: "abc" */ '@/views/abc-page/index.vue')
  }

  move() {
    vueRouter.push(this.path)
  }

  readonly foo = new (class extends ViewRoute<ABCPageRoute> {
    get path() {
      return `${this.parent!.path}/foo/:id`
    }

    get component() {
      return this.parent!.component
    }

    move(id: string) {
      vueRouter.push(this.replaceRouteParams(id))
    }
  })(this)
})()

const shoppingPageRoute = new (class ShoppingPageRoute extends ViewRoute {
  get path() {
    return '/views/shopping-page'
  }

  get component() {
    return () => import(/* webpackChunkName: "shopping" */ '@/views/shopping-page/index.vue')
  }

  move() {
    vueRouter.push(this.path)
  }
})()

const error404PageRoute = new (class Error404PageRoute extends ViewRoute {
  get path() {
    return '*'
  }

  get component() {
    return () => import(/* webpackChunkName: "error404" */ '@/views/error404-page/index.vue')
  }
})()

const demoRoute = new (class DemoRoute extends ViewRoute {
  get path() {
    return '/views/demo'
  }

  get component() {
    return undefined
  }

  compTreeViewPage = new (class extends ViewRoute<DemoRoute> {
    get path() {
      return `${this.parent!.path}/comp-tree-view-page`
    }

    get component() {
      return () => import(/* webpackChunkName: "demo/comp-tree-view" */ '@/views/demo/comp-tree-view-page/index.vue')
    }

    move(id: string) {
      vueRouter.push(this.replaceRouteParams(id))
    }
  })(this)
})()

export const router = new (class {
  views = {
    abcPage: abcPageRoute,

    shoppingPage: shoppingPageRoute,

    error404Page: error404PageRoute,

    demo: demoRoute,
  }

  /**
   * ダイアログを開くためのURLを作成して遷移します。
   * @param name ダイアログの名前
   * @param params ダイアログに渡すパラメータ
   */
  openDialog(name: string, params?: {}): void {
    let dialogParams: {} | undefined
    if (params) {
      dialogParams = encodeURIComponent(JSON.stringify(params))
    }
    const query = assign({}, vueRouter.currentRoute.query, {
      dialogName: name,
      dialogParams,
    })
    vueRouter.push({
      path: vueRouter.currentRoute.path,
      query,
    })
  }

  /**
   * ダイアログを開くための部分をURLから除去して遷移します。
   */
  closeDialog(): void {
    const query = assign({}, vueRouter.currentRoute.query)
    delete query.dialogName
    delete query.dialogParams
    vueRouter.push({
      path: vueRouter.currentRoute.path,
      query,
    })
  }

  /**
   * URLからダイアログを開くための部分を取得して返します。
   * @param route
   */
  getDialog(route: Route): { name: string; params?: {} } | undefined {
    const name = route.query.dialogName as string | undefined
    if (!name) return

    let params: {} | undefined
    const paramsStr = route.query.dialogParams as string
    if (paramsStr) {
      params = JSON.parse(decodeURIComponent(paramsStr))
    }
    return { name, params }
  }
})()

export const vueRouter = new VueRouter({
  mode: 'history',
  routes: [router.views.abcPage, router.views.abcPage.foo, router.views.shoppingPage, router.views.error404Page, router.views.demo.compTreeViewPage],
})

vueRouter.beforeEach((to, from, next) => {
  i18n.load().then(() => next())
})
