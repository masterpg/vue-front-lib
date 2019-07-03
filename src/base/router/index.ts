import Vue from 'vue'
import VueRouter from 'vue-router'
import { i18n } from '@/base/i18n'

Vue.use(VueRouter)

abstract class Route<T extends Route = any> {
  constructor(public readonly path: string, public readonly component: any, public readonly parent?: T) {}

  protected replaceRouteParams(...params: string[]): string {
    let result = this.path
    // 例: ":xyz"が置き換え対象
    const pattern = /(:\w+)/
    for (const param of params) {
      result = result.replace(pattern, param)
    }
    return result
  }
}

export const router = {
  views: {
    abcPage: new (class ABCRoute extends Route {
      move() {
        vueRouter.push(this.path)
      }
      readonly foo = new (class extends Route<ABCRoute> {
        move(id: string) {
          vueRouter.push(this.replaceRouteParams(id))
        }
      })(`${this.path}/foo/:id`, this.component, this)
    })('/views/abc-page', () => import(/* webpackChunkName: "abc" */ '@/views/abc-page/index.vue')),

    shoppingPage: new (class extends Route {
      move() {
        vueRouter.push(this.path)
      }
    })('/views/shopping-page', () => import(/* webpackChunkName: "shopping" */ '@/views/shopping-page/index.vue')),

    error404Page: new (class Error404Route extends Route {
      move() {
        vueRouter.push(this.path)
      }
    })('*', () => import(/* webpackChunkName: "error404" */ '@/views/error404-page/index.vue')),

    demo: {
      compTreeViewPage: new (class extends Route {
        move() {
          vueRouter.push(this.path)
        }
      })('/views/demo/comp-tree-view-page', () => import(/* webpackChunkName: "demo/comp-tree-view" */ '@/views/demo/comp-tree-view-page/index.vue')),
    },
  },
}

export const vueRouter = new VueRouter({
  mode: 'history',
  routes: [router.views.abcPage, router.views.abcPage.foo, router.views.shoppingPage, router.views.error404Page, router.views.demo.compTreeViewPage],
})

vueRouter.beforeEach((to, from, next) => {
  i18n.load().then(() => next())
})
