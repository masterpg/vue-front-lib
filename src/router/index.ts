import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const AbcApp = () => import(/* webpackChunkName: "abc" */ '../components/abc/index.vue');
const ShoppingApp = () => import(/* webpackChunkName: "shopping" */ '../components/shopping/index.vue');

export default new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/abc',
      component: AbcApp,
    },
    {
      path: '/shopping',
      component: ShoppingApp,
    },
  ],
});
