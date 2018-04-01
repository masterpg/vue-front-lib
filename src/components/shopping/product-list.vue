<template>
  <ul>
    <li v-for="product in products">
      {{ product.title }} - {{ product.price | currency }}
      <br>
      <button
        :disabled="!product.inventory"
        @click="addProductToCart(product)">
        Add to cart
      </button>
    </li>
  </ul>
</template>

<script lang="ts">
  import AppStore from "../../store";
  import Vue from 'vue';
  import { Component } from 'vue-property-decorator';
  import { Product } from "../../store/modules/base";

  @Component({})
  export default class ProductList extends Vue {
    created() {
      AppStore.products.getAllProducts();
    }

    private get products() {
      return AppStore.products.allProducts;
    }

    private addProductToCart(product: Product): Promise<void> {
      return AppStore.cart.addProductToCart(product);
    }
  }
</script>
