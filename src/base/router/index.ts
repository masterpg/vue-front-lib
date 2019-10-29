import { Route } from 'vue-router/types/router'
import Vue from 'vue'
import VueRouter from 'vue-router'
import { i18n } from '@/base/i18n'
const assign = require('lodash/assign')
const debounce = require('lodash/debounce')

Vue.use(VueRouter)

export abstract class ViewRoute<T extends ViewRoute = any> {
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

export abstract class BaseRouter extends VueRouter {
  /**
   * ダイアログを開くための情報をURLに付与して遷移します。
   * 例: https://example.com/views/abc-page?dialogName=signIn&dialogParams=%257B%2522account%2522%253A%2522taro%2522%257D
   *
   * @param name ダイアログの名前
   * @param params ダイアログに渡すパラメータ
   */
  openDialog(name: string, params?: string | {} | any[]): void {
    let dialogParams: {} | undefined
    if (params) {
      dialogParams = encodeURIComponent(JSON.stringify(params))
    }
    const query = assign({}, this.currentRoute.query, {
      dialogName: name,
      dialogParams,
    })
    this.push({
      path: this.currentRoute.path,
      query,
    })
  }

  /**
   * ダイアログを開くための情報をURLから除去して遷移します。
   *
   * このメソッドはダイアログを閉じた際に使用することを想定しています。
   * `openDialog()`でダイアログを開くと、URLにダイアログを開くための情報が
   * URLに付与されます。この状態でブラウザをリロードするとアプリケーション
   * 起動時にダイアログが開くことになります。
   *
   * このような挙動が望ましい場合もありますが、そうでない場合もあります。
   * このメソッドを呼び出すと、URLからダイアログを開くための情報を除去するため、
   * アプリケーションリロード時にダイアログが開くという挙動を回避することができます。
   */
  closeDialog(): void {
    const query = assign({}, this.currentRoute.query)
    delete query.dialogName
    delete query.dialogParams
    this.push({
      path: this.currentRoute.path,
      query,
    })
  }

  /**
   * URLからダイアログを開くための情報を取得して返します。
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
}

const error404Route = new (class Error404Route extends ViewRoute {
  get path() {
    return '*'
  }

  get component() {
    return () => import(/* webpackChunkName: "views/error404" */ '@/views/error404')
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
      return () => import(/* webpackChunkName: "views/demo/abc" */ '@/views/demo/abc')
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
      return () => import(/* webpackChunkName: "views/demo/shop" */ '@/views/demo/shop')
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
      return () => import(/* webpackChunkName: "views/demo/storage" */ '@/views/demo/storage')
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
      return () => import(/* webpackChunkName: "views/components/tree-view" */ '@/views/components/tree-view/tree-view-page.vue')
    }

    move() {
      router.push(this.path)
    }
  })(this)
})()

export const router = new (class extends BaseRouter {
  views = {
    error404: error404Route,

    demo: demoRoute,

    components: componentsRoute,
  }
})({
  mode: 'history',
  routes: [error404Route, demoRoute.abc, demoRoute.shop, demoRoute.storage, componentsRoute.treeView],
})

router.beforeEach(
  // 短い間隔で非同期処理が実行されるとエラーが発生するのでdebounceしている
  debounce((to, from, next) => {
    i18n.load().then(() => next())
  }, 100)
)
