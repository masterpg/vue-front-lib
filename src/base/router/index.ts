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
  pages: {
    abc: new (class ABCRoute extends Route {
      move() {
        vueRouter.push(this.path)
      }
      readonly foo = new (class extends Route<ABCRoute> {
        move(id: string) {
          vueRouter.push(this.replaceRouteParams(id))
        }
      })(`${this.path}/foo/:id`, this.component, this)
    })('/pages/abc', () => import(/* webpackChunkName: "abc" */ '@/pages/abc/index.vue')),

    shopping: new (class extends Route {
      move() {
        vueRouter.push(this.path)
      }
    })('/pages/shopping', () => import(/* webpackChunkName: "shopping" */ '@/pages/shopping/index.vue')),

    error404: new (class Error404Route extends Route {
      move() {
        vueRouter.push(this.path)
      }
    })('*', () => import(/* webpackChunkName: "error404" */ '@/pages/error404/index.vue')),

    demo: {
      compTreeView: new (class extends Route {
        move() {
          vueRouter.push(this.path)
        }
      })('/pages/demo/comp-tree-view', () => import(/* webpackChunkName: "demo/comp-tree-view" */ '@/pages/demo/comp-tree-view/index.vue')),
    },
  },
}

export const vueRouter = new VueRouter({
  mode: 'history',
  routes: [router.pages.abc, router.pages.abc.foo, router.pages.shopping, router.pages.error404, router.pages.demo.compTreeView],
})

vueRouter.beforeEach((to, from, next) => {
  i18n.load().then(() => next())
})
