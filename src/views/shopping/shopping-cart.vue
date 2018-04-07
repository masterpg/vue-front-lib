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
  import AppStore from '../../store';
  import Vue from 'vue';
  import { Component } from 'vue-property-decorator';
  import { CartProduct, Product } from '../../store/modules/base';

  @Component({})
  export default class ShoppingCart extends Vue {
    private get products(): CartProduct[] { return AppStore.cart.cartProducts; }

    private get checkoutStatus(): string | null { return AppStore.cart.checkoutStatus; }

    private get total(): number { return AppStore.cart.cartTotalPrice; }

    private checkout(products: Product[]): Promise<void> {
      return AppStore.cart.checkout(products);
    }
  }
</script>
