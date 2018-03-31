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
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  computed: {
    ...mapGetters({
      products: 'cartProducts',
      checkoutStatus: 'checkoutStatus',
      total: 'cartTotalPrice',
    }),
  },
})
export default class ShoppingCart extends Vue {
  private checkout(products) {
    this.$store.dispatch('checkout', products);
  }
}
</script>
