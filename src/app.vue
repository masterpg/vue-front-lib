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
  import AbcApp from './components/abc/app.vue';
  import ShoppingApp from './components/shopping/app.vue';

  Vue.use(VueRouter);

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
  }
</script>

