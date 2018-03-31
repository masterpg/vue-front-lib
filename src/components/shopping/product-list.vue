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
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { mapGetters, mapActions } from 'vuex';

@Component({
  computed: mapGetters({
    products: 'allProducts',
  }),
  methods: mapActions([
    'addProductToCart',
  ]),
})
export default class ProductList extends Vue {
  created() {
    this.$store.dispatch('getAllProducts');
  }
}
</script>
