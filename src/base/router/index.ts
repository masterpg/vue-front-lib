import Vue from 'vue'
import VueRouter from 'vue-router'
import {i18n} from '@/base/i18n'

Vue.use(VueRouter)

export const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/pages/abc',
      component: () => import(/* webpackChunkName: "abc" */ '@/pages/abc/index.vue'),
    },
    {
      path: '/pages/shopping',
      component: () => import(/* webpackChunkName: "shopping" */ '@/pages/shopping/index.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  i18n.load().then(() => next())
})
