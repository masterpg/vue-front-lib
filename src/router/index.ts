import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

export default new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/abc',
      component: () => import(/* webpackChunkName: "abc" */ '../views/abc/index.vue'),
    },
    {
      path: '/shopping',
      component: () => import(/* webpackChunkName: "shopping" */ '../views/shopping/index.vue'),
    },
  ],
});
