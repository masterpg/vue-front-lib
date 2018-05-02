<template>
  <div
    class="layout vertical"
    :class="{ 'ma-5': pc, 'ma-3': tab, 'ma-0': sp }"
  >

    <v-card class="flex">
      <v-list two-line>
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-sub-title>Products</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <v-btn icon ripple @click="openCartModal()">
              <v-icon color="grey lighten-1">mdi-cart-outline</v-icon>
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>
        <v-divider></v-divider>
        <template v-for="(product, index) in products">
          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title v-html="product.title"></v-list-tile-title>
              <v-list-tile-sub-title>
                <span class="text--primary">Price</span> &mdash; {{ product.price | currency }},&nbsp;
                <span class="text--primary">Stock</span> &mdash; {{ product.inventory }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn icon ripple @click="addProductToCart(product)">
                <v-icon color="grey lighten-1">add</v-icon>
              </v-btn>
            </v-list-tile-action>
          </v-list-tile>
        </template>
      </v-list>
    </v-card>

    <cart-modal ref="cartModal"></cart-modal>

  </div>
</template>

<script lang="ts">
  import CartModal from './cart-modal.vue';
  import { Component } from 'vue-property-decorator';
  import { Product } from '../../store/types';
  import { VueComponent } from '../../components';

  @Component({
    components: {
      'cart-modal': CartModal,
    },
  })
  export default class ShoppingView extends VueComponent {
    created() {
      this.$appStore.product.getAllProducts();
    }

    private get cartModal(): CartModal {
      return this.$refs.cartModal as CartModal;
    }

    private get products(): Product[] {
      return this.$appStore.product.allProducts;
    }

    private addProductToCart(product: Product): void {
      this.$appStore.cart.addProductToCart(product);
    }

    private openCartModal(): void {
      this.cartModal.show();
    }
  }
</script>
