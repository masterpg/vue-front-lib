import { NavigationGuard, Route } from 'vue-router/types/router'
import Vue from 'vue'
import VueRouter from 'vue-router'
import { i18n } from '@/example/i18n'

Vue.use(VueRouter)

//========================================================================
//
//  Implementation
//
//========================================================================

let isBeforeEachSet = false

abstract class ViewRoute<PARENT extends ViewRoute = any> {
  constructor(public readonly parent?: PARENT) {}

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

abstract class BaseRouter extends VueRouter {
  beforeEach(guard: NavigationGuard): Function {
    isBeforeEachSet = true
    return super.beforeEach((to, from, next) => {
      i18n.load().then(() => {
        guard(to, from, next)
      })
    })
  }

  /**
   * ダイアログを開くための情報をURLに付与して遷移します。
   *
   * URLに付与するダイアログ情報の例:
   *   https://example.com/views/abc-page?dialogName=signIn&dialogParams=%257B%2522account%2522%253A%2522taro%2522%257D
   *
   * @param dialogName ダイアログの名前
   * @param dialogParams ダイアログに渡すパラメータ
   */
  addDialogInfoToURL(dialogName: string, dialogParams?: any): void {
    router.push({
      path: router.currentRoute.path,
      query: Object.assign({}, router.currentRoute.query, {
        dialogName,
        dialogParams: dialogParams ? encodeURIComponent(JSON.stringify(dialogParams)) : undefined,
      }),
    })
  }

  /**
   * URLに付与されているダイアログ情報を削除します。
   */
  removeDialogInfoFromURL(): void {
    const query = Object.assign({}, router.currentRoute.query)
    delete query.dialogName
    delete query.dialogParams
    router.push({
      path: router.currentRoute.path,
      query,
    })
  }

  /**
   * ダイアログを開くためのクエリを生成します。
   *
   * ダイアログを開くためのクエリの例:
   *   dialogName=signIn&dialogParams=%257B%2522account%2522%253A%2522taro%2522%257D
   *
   * @param dialogName ダイアログの名前
   * @param dialogParams ダイアログに渡すパラメータ
   */
  getDialogInfoQuery(dialogName: string, dialogParams?: any): string {
    let result = `dialogName=${dialogName}`
    if (dialogParams) {
      result += `&dialogParams=${encodeURIComponent(JSON.stringify(dialogParams))}`
    }
    return result
  }

  /**
   * URLに付与されているダイアログの情報を取得します。
   * @params route
   */
  getDialogInfo(route: Route): { dialogName: string; dialogParams?: any } | undefined {
    const dialogName = route.query.dialogName as string | undefined
    if (!dialogName) return

    let dialogParams: {} | undefined
    const paramStr = route.query.dialogParams as string
    if (paramStr) {
      dialogParams = JSON.parse(decodeURIComponent(paramStr))
    }
    return { dialogName, dialogParams }
  }
}

let router: BaseRouter

function setRouter(value: BaseRouter): void {
  router = value
  if (!isBeforeEachSet) {
    router.beforeEach((to, from, next) => {
      next()
    })
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ViewRoute, BaseRouter, router, setRouter }
