<template>
  <div id="app">
    <product-list></product-list>
  </div>
</template>

<script lang="ts">
  import ProductList from './product-list.vue';
  import Vue from 'vue';
  import { Component } from 'vue-property-decorator';

  @Component({
    components: {
      'product-list': ProductList,
    },
  })
  export default class ShoppingView extends Vue {
  }
</script>