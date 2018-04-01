<template>
  <div class="cart">
    <h2>Your Cart</h2>
    <p v-show="!products.length"><i>Please add some products to cart.</i></p>
    <ul>
      <li v-for="product in products">
        {{ product.title }} - {{ product.price | currency }} x {{ product.quantity }}
      </li>
    </ul>
    <p>Total: {{ total | currency }}</p>
    <p>
      <button :disabled="!products.length" @click="checkout(products)">Checkout</button>
    </p>
    <p v-show="checkoutStatus">Checkout {{ checkoutStatus }}.</p>
  </div>
</template>

<script lang="ts">
  import AppStore from "../../store";
  import Vue from 'vue';
  import { Component } from 'vue-property-decorator';

  @Component({})
  export default class ShoppingCart extends Vue {
    private checkout(products) { return AppStore.cart.checkout(products); }

    private get products() { return AppStore.cart.cartProducts; }

    private get checkoutStatus() { return AppStore.cart.checkoutStatus; }

    private get total() { return AppStore.cart.cartTotalPrice; }
  }
</script>
