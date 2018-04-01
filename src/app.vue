<style lang="scss">
  .host {
  }
</style>

<template>
  <div class="host">
    <h1>Examples</h1>
    <ul>
      <li>
        <router-link to="/abc">/abc</router-link>
      </li>
      <li>
        <router-link to="/shopping">/shopping</router-link>
      </li>
    </ul>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import VueRouter from 'vue-router';

  Vue.use(VueRouter);

  const AbcApp = () => import(/* webpackChunkName: "abc" */ './components/abc/app.vue');
  const ShoppingApp = () => import(/* webpackChunkName: "shopping" */ './components/shopping/app.vue');
  const routes = [
    { path: '/abc', component: AbcApp },
    { path: '/shopping', component: ShoppingApp },
  ];

  const router = new VueRouter({
    mode: 'history',
    routes,
  });

  export default {
    router,
  };
</script>

