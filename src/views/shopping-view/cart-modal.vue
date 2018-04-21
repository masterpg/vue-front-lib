<template>
  <v-dialog scrollable max-width="400px" v-model="opened">
    <v-card>
      <v-card-title>Your Cart</v-card-title>
      <v-divider></v-divider>
      <v-list two-line style="height: 300px;">
        <template v-for="(product, index) in products">
          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title v-html="product.title"></v-list-tile-title>
              <v-list-tile-sub-title>
                <span class="text--primary">Price</span> &mdash; {{ product.price | currency }} x {{ product.quantity }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-list>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn color="blue darken-1" flat @click="checkout(products)">Checkout</v-btn>
        <v-card-text v-show="!checkoutStatus.result" class="red--text">{{ checkoutStatus.message }}</v-card-text>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
  import appStore from '../../store';
  import Vue from 'vue';
  import { Component } from 'vue-property-decorator';
  import { CartProduct, CheckoutStatus, Product } from '../../store/entities';

  @Component
  export default class CartModal extends Vue {

    private opened: boolean = false;

    private get products(): CartProduct[] { return appStore.cart.cartProducts; }

    private get total(): number { return appStore.cart.cartTotalPrice; }

    private get checkoutStatus(): { result: boolean, message: string } {
      const result =
        appStore.cart.checkoutStatus === CheckoutStatus.None ||
        appStore.cart.checkoutStatus === CheckoutStatus.Successful;
      return {
        result,
        message: result ? '' : 'Checkout failed.',
      };
    }

    private async checkout(products: Product[]): Promise<void> {
      await appStore.cart.checkout(products);
      if (this.checkoutStatus.result) {
        this.opened = false;
      }
    }

    show(): void {
      this.opened = true;
    }
  }
</script>