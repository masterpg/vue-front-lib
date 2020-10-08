import VueRouter, { RouteConfig } from 'vue-router'
import HomePage from '@/views/home'
import Vue from 'vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/abc',
    name: 'ABC',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '@/views/abc'),
  },
  {
    path: '/shop',
    name: 'Shop',
    component: () => import(/* webpackChunkName: "about" */ '@/views/shop'),
  },
  {
    path: '/tree',
    name: 'TreeView',
    component: () => import(/* webpackChunkName: "about" */ '@/views/tree-view'),
  },
  {
    path: '*',
    redirect: '/home',
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
