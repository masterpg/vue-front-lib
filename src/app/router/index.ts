import * as _path from 'path'
import { Component, Dictionary, RedirectOption } from 'vue-router/types/router'
import { ComputedRef, Ref, UnwrapRef, reactive, ref } from '@vue/composition-api'
import { Key, compile, pathToRegexp } from 'path-to-regexp'
import VueRouter, { Route as VueRoute } from 'vue-router'
import HomePage from '@/demo/views/home'
import Vue from 'vue'
import { extendedMethod } from '@/app/base'
import { removeEndSlash } from 'web-base-lib'

Vue.use(VueRouter)

//========================================================================
//
//  Interfaces
//
//========================================================================

const UserNameProp = 'userName'

type NavigationGuardChecker = (to: VueRoute, from: VueRoute) => Promise<void | boolean>

type FlowStatus = 'None' | 'Enter' | 'Update' | 'Leave'

interface RouteInput {
  routePath: string
  component?: Component
  redirect?: RedirectOption
}

interface RouterContainer {
  router: VueRouter
  routes: Routes
  route: CurrentRoute
  params: RouteParams
}

interface Route {
  /**
   * ルートのベースパスです。
   * 例: /app.admin/siteAdmin/storage
   */
  readonly basePath: string
  /**
   * ルートのパスです。
   * 例: /app.admin/siteAdmin/storage/xkoqcFH4B3edNPPCC4zR
   */
  readonly path: string
  /**
   * ルートのステータスです。
   */
  readonly status: FlowStatus
  /**
   * 現在のルートが自身であるかを示すフラグです。
   */
  readonly isCurrent: boolean
  /**
   * ベースパスを基準としてルートが変更される際のナビゲーションガードです。
   * 次のルートへ遷移させたくない場合は戻り値に`false`を返してください。
   * @param guard
   */
  onBeforeRouteUpdate(guard: NavigationGuardChecker): () => void
  /**
   * ベースパスから他のルートへ変更される際のナビゲーションガードです。
   * 次のルートへ遷移させたくない場合は戻り値に`false`を返してください。
   * @param guard
   */
  onBeforeRouteLeave(guard: NavigationGuardChecker): () => void
}

interface CurrentRoute extends Pick<Route, 'basePath' | 'path' | 'status'> {}

type RawCurrentRoute = { [K in keyof CurrentRoute]: CurrentRoute[K] }

interface RawRoute extends Omit<Route, 'basePath' | 'path' | 'status' | 'isCurrent'> {
  readonly basePath: ComputedRef<string>
  readonly path: ComputedRef<string>
  readonly status: ComputedRef<FlowStatus>
  readonly isCurrent: ComputedRef<boolean>
  /**
   * 自身をVue Routerの設定形式に変換します。
   */
  toRouteConfig(): { path: string; component: any }
  /**
   * 次のルートへ進むかをチェックします。
   * @param to
   * @param from
   */
  proceed(to: VueRoute, from: VueRoute): Promise<boolean>
  /**
   * 次のルートをもとに状態を更新します。
   * @param to
   * @param from
   */
  update(to: VueRoute, from: VueRoute): void
}

interface UserRoute extends Route {
  move(): Promise<boolean>
}

interface ArticlesRoute extends Route {
  move(articleId: string): Promise<boolean>
  getArticleId(): string
}

interface StorageRoute extends Route {
  move(nodeId: string): Promise<boolean>
  getNodeId(): string
}

interface Routes {
  home: UserRoute
  articles: ArticlesRoute
  siteAdmin: {
    article: StorageRoute
    storage: StorageRoute
  }
  appAdmin: {
    storage: StorageRoute
  }
}

interface RouteParams {
  userName: string
}

//========================================================================
//
//  Helpers
//
//========================================================================

/**
 * `routePath`の中にある変数プレースホルダーを`routeParams`で指定された値に置き換えます。
 *
 * @example
 * const routePath = ':userName/calendar/:year/:month'
 * const routeParams = { userName: 'taro', year: 2020, month: 1 }
 * replaceRouteParams(routePath, routeParams)
 * // 'taro/calendar/2020/1'
 *
 * @param routePath
 * @param routeParams
 */
function replaceRouteParams(routePath: string, routeParams: Partial<Dictionary<string>>): string {
  let result = routePath

  // 変数プレースホルダーの置き換え
  for (const paramName of Object.keys(routeParams)) {
    const pattern = new RegExp(`^(:${paramName})|/(:${paramName})`, 'g')
    let paramValue: string
    if (routeParams[paramName]) {
      paramValue = routeParams[paramName]!
    } else {
      paramValue = routeParams[paramName] === 'null' ? 'null' : 'undefined'
    }
    result = result.replaceAll(pattern, (str, p1, p2, offset, s) => {
      return str.replace(p1 || p2, paramValue)
    })
  }

  // 置き換えられない変数プレースホルダーがあった場合、空文字を返す
  const pattern = new RegExp(`^:[^/]+|/:[^/]+`, 'g')
  if (pattern.test(result)) return ''

  return result
}

//========================================================================
//
//  Routes
//
//========================================================================

//--------------------------------------------------
//  Route
//--------------------------------------------------

namespace Route {
  export function newRawInstance(input: RouteInput) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const baseRoutePath = ref(input.routePath)

    const routePath = ref(input.routePath)

    const component = ref(input.component)

    const redirect = ref(input.redirect)

    const currentRoute = ref<VueRoute>()

    const beforeUpdateListeners: NavigationGuardChecker[] = []

    const beforeLeaveListeners: NavigationGuardChecker[] = []

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const basePath = ref('')

    const path = ref('')

    const status = ref<FlowStatus>('None')

    const isCurrent = ref(false)

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const onBeforeRouteUpdate: Route['onBeforeRouteUpdate'] = guard => {
      beforeUpdateListeners.push(guard)
      return () => {
        const index = beforeUpdateListeners.indexOf(guard)
        index >= 0 && beforeUpdateListeners.splice(index, 1)
      }
    }

    const onBeforeRouteLeave: Route['onBeforeRouteLeave'] = guard => {
      beforeLeaveListeners.push(guard)
      return () => {
        const index = beforeLeaveListeners.indexOf(guard)
        index >= 0 && beforeLeaveListeners.splice(index, 1)
      }
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    const toRouteConfig = extendedMethod<RawRoute['toRouteConfig']>(() => {
      return { path: baseRoutePath.value, component: component.value, redirect: redirect.value }
    })

    const proceed = extendedMethod<RawRoute['proceed']>(async (to, from) => {
      const toIsCurrent = getIsCurrent(to)
      const fromIsCurrent = getIsCurrent(from)

      if (toIsCurrent) {
        if (toIsCurrent === fromIsCurrent) {
          status.value = 'Update'
        } else {
          status.value = 'Enter'
        }
      } else {
        if (fromIsCurrent) {
          status.value = 'Leave'
        } else {
          status.value = 'None'
        }
      }

      if (status.value === 'Update') {
        for (const listener of beforeUpdateListeners) {
          const ret = await listener(to, from)
          if (ret === false) return false
        }
      } else if (status.value === 'Leave') {
        for (const listener of beforeLeaveListeners) {
          const ret = await listener(to, from)
          if (ret === false) return false
        }
      }

      return true
    })

    const update = extendedMethod<RawRoute['update']>((to, from) => {
      currentRoute.value = to
      isCurrent.value = getIsCurrent(to)
      basePath.value = getBasePath(to)
      path.value = getPath(to)
    })

    const getBasePath = extendedMethod((route: VueRoute) => {
      return toPath(baseRoutePath.value, route.params)
    })

    const getPath = extendedMethod((route: VueRoute) => {
      return toPath(routePath.value, route.params)
    })

    const getIsCurrent = extendedMethod((route: VueRoute) => {
      const regexp = pathToRegexp(baseRoutePath.value)
      return regexp.test(route.path)
    })

    const toPath = (routePath: string, params: Dictionary<string>) => {
      const keys: Key[] = []
      const regexp = pathToRegexp(routePath, keys)

      const params_ = keys.reduce<Dictionary<string>>((result, key) => {
        result[key.name] = params[key.name] || 'none'
        return result
      }, {})

      return compile(routePath)(params_)
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    const rawRoute: RawRoute = {
      basePath,
      path,
      status,
      isCurrent,
      onBeforeRouteLeave,
      onBeforeRouteUpdate,
      toRouteConfig,
      proceed,
      update,
    }

    return {
      ...rawRoute,
      baseRoutePath,
      routePath,
      component,
      currentRoute,
      toRouteConfig,
      getBasePath,
      getPath,
      getIsCurrent,
      toPath,
    }
  }
}

//--------------------------------------------------
//  UserRoute
//--------------------------------------------------

namespace UserRoute {
  export function newRawInstance(input: RouteInput) {
    const base = Route.newRawInstance(input)

    const move: UserRoute['move'] = async () => {
      const router = useRouter()
      await router.push(base.path.value)
      return true
    }

    return {
      ...base,
      move,
    }
  }
}

//--------------------------------------------------
//  ArticlesRoute
//--------------------------------------------------

namespace ArticlesRoute {
  export function newRawInstance(input: RouteInput) {
    const base = Route.newRawInstance(input)

    base.routePath.value = _path.join(base.baseRoutePath.value, ':articleId')

    base.getPath.value = route => {
      return base.toPath(base.routePath.value, route.params)
    }

    base.toRouteConfig.value = () => {
      return {
        path: base.routePath.value,
        component: base.component.value,
      }
    }

    base.getIsCurrent.value = route => {
      const regexp = pathToRegexp(base.routePath.value)
      return regexp.test(route.path)
    }

    const move: ArticlesRoute['move'] = async articleId => {
      const router = useRouter()
      const currentPath = removeEndSlash(router.currentRoute.path)
      const nextPath = base.toPath(base.routePath.value, { ...router.currentRoute.params, articleId })
      if (currentPath === nextPath) {
        return false
      }

      await router.push(nextPath)
      return true
    }

    const getArticleId: ArticlesRoute['getArticleId'] = () => {
      if (!base.isCurrent.value) return ''
      return base.currentRoute.value?.params.articleId ?? ''
    }

    return {
      ...base,
      move,
      getArticleId,
    }
  }
}

//--------------------------------------------------
//  StorageRoute
//--------------------------------------------------

namespace StorageRoute {
  export function newRawInstance(input: RouteInput) {
    const base = Route.newRawInstance(input)

    // https://github.com/pillarjs/path-to-regexp/tree/v1.7.0#zero-or-more
    base.routePath.value = _path.join(base.baseRoutePath.value, ':nodeId*')

    base.getPath.value = route => {
      return base.toPath(base.routePath.value, route.params)
    }

    base.toRouteConfig.value = () => {
      return {
        path: base.routePath.value,
        component: base.component.value,
      }
    }

    base.getIsCurrent.value = route => {
      const regexp = pathToRegexp(base.routePath.value)
      return regexp.test(route.path)
    }

    const move: StorageRoute['move'] = async nodeId => {
      const router = useRouter()
      const currentPath = removeEndSlash(router.currentRoute.path)
      let nextPath: string
      if (nodeId) {
        nextPath = base.toPath(base.routePath.value, { ...router.currentRoute.params, nodeId })
      } else {
        nextPath = base.basePath.value
      }

      if (currentPath === nextPath) {
        return false
      }

      await router.push(nextPath)
      return true
    }

    const getNodeId: StorageRoute['getNodeId'] = () => {
      if (!base.isCurrent.value) return ''
      return base.currentRoute.value?.params.nodeId ?? ''
    }

    return {
      ...base,
      move,
      getNodeId,
    }
  }
}

//========================================================================
//
//  Router
//
//========================================================================

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

  export function useRoute(): CurrentRoute {
    instance = instance ?? newInstance()
    return instance.route
  }

  export function useRouteParams(): RouteParams {
    instance = instance ?? newInstance()
    return instance.params
  }

  function newInstance(): RouterContainer {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const params = reactive({
      userName: '',
    })

    const home = reactive(
      UserRoute.newRawInstance({
        routePath: `/:${UserNameProp}`,
        component: HomePage,
      })
    )

    const articles = reactive(
      ArticlesRoute.newRawInstance({
        routePath: `/:${UserNameProp}/articles`,
        component: () => import(/* webpackChunkName: "views/article-browser" */ '@/app/views/article-browser'),
      })
    )

    const siteAdmin = reactive({
      article: StorageRoute.newRawInstance({
        routePath: `/:${UserNameProp}/siteAdmin/article`,
        component: () => import(/* webpackChunkName: "views/site-admin/article" */ '@/app/views/site-admin/article'),
      }),
      storage: StorageRoute.newRawInstance({
        routePath: `/:${UserNameProp}/siteAdmin/storage`,
        component: () => import(/* webpackChunkName: "views/site-admin/storage" */ '@/app/views/site-admin/storage'),
      }),
    })

    const appAdmin = reactive({
      storage: StorageRoute.newRawInstance({
        routePath: `/:${UserNameProp}/appAdmin/storage`,
        component: () => import(/* webpackChunkName: "views/app-admin/storage" */ '@/app/views/app-admin/storage'),
      }),
    })

    const fallback = reactive(
      Route.newRawInstance({
        routePath: '/(.*)',
        // redirect: '/',
      })
    )

    const routeList: UnwrapRef<RawRoute>[] = [home, articles, siteAdmin.article, siteAdmin.storage, appAdmin.storage]

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

    const routes: Routes = { home, articles, siteAdmin, appAdmin }

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

      params.userName = to.params[UserNameProp] ?? ''
    })

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return { router, routes, route: route.value, params }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

const { useRouter, useRoutes, useRoute, useRouteParams } = RouterContainer
export {
  CurrentRoute,
  FlowStatus,
  RawCurrentRoute,
  RawRoute,
  Route,
  StorageRoute,
  replaceRouteParams,
  useRoute,
  useRouteParams,
  useRouter,
  useRoutes,
}
