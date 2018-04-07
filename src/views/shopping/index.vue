<template>
  <div id="app">
    <h1>Shopping Cart Example</h1>
    <hr>
    <h2>Products</h2>
    <product-list></product-list>
    <hr>
    <shopping-cart></shopping-cart>
  </div>
</template>

<script lang="ts">
  import ProductList from './product-list.vue';
  import ShoppingCart from './shopping-cart.vue';
  import Vue from 'vue';
  import { Component } from 'vue-property-decorator';

  @Component({
    components: {
      'product-list': ProductList,
      'shopping-cart': ShoppingCart,
    },
  })
  export default class ShoppingView extends Vue {
  }
</script>
