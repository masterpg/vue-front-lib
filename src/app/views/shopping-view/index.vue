<style lang="stylus" scoped>
  @import '../../../assets/styles/_typography.styl'
  .title-text {
    @extend .app-font-title;
  }

  .product-title {
    @extend .app-font-subhead;
  }

  .product-detail {
    @extend .app-font-body1;
    color: var(--app-secondary-text-color);
  }

  .error-text {
    @extend .app-font-body1;
    color: var(--app-accent-text-color);
    text-align right;
  }
</style>


<template>
  <div class="layout vertical" :class="{ 'app-ma-12': pc, 'app-ma-6': tab, 'app-ma-3': sp }">

    <div>
      <div class="layout horizontal center">
        <div class="title-text">Products</div>
      </div>
      <hr style="width: 100%;">
      <div v-for="(product, index) in products" class="layout horizontal center app-my-3">
        <div class="layout vertical center-justified">
          <div class="product-title">{{ product.title }}</div>
          <div class="product-detail">
            <span>Price</span> &mdash; {{ product.price | currency }},&nbsp;
            <span>Stock</span> &mdash; {{ product.inventory }}
          </div>
        </div>
        <div class="flex"></div>
        <paper-icon-button icon="icons:add-box" @click="addProductToCart(product)"></paper-icon-button>
      </div>
    </div>

    <div class="app-mt-5">
      <div class="layout horizontal center">
        <div class="title-text">Your Cart</div>
        <div class="flex"></div>
        <paper-icon-button v-show="!cartIsEmpty" icon="icons:check" @click="checkout"></paper-icon-button>
      </div>
      <hr style="width: 100%;">
      <div v-for="(product, index) in cartProducts" class="layout horizontal center app-my-3">
        <div class="layout vertical center-justified">
          <div class="product-title">{{ product.title }}</div>
          <div class="product-detail">
            <span>Price</span> &mdash; {{ product.price | currency }} x {{ product.quantity }}
          </div>
        </div>
      </div>
      <div v-show="!checkoutStatus.result" class="error-text">{{ checkoutStatus.message }}</div>
    </div>

  </div>
</template>


<script lang="ts">
  import '@polymer/paper-button/paper-button';
  import '@polymer/paper-card/paper-card';
  import '@polymer/paper-icon-button/paper-icon-button';
  import { CartProduct, CheckoutStatus, Product } from '../../stores/types';
  import { Component } from 'vue-property-decorator';
  import { ElementComponent } from '../../components';
  import { mixins } from 'vue-class-component';

  @Component
  export default class ShoppingView extends mixins(ElementComponent) {

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    private get cartIsEmpty(): boolean {
      return this.cartProducts.length === 0;
    }

    private get products(): Product[] {
      return this.$stores.product.allProducts;
    }

    private get cartProducts(): CartProduct[] {
      return this.$stores.cart.cartProducts;
    }

    private get cartTotalPrice(): number {
      return this.$stores.cart.cartTotalPrice;
    }

    private get checkoutStatus(): { result: boolean, message: string } {
      const result =
        this.$stores.cart.checkoutStatus === CheckoutStatus.None ||
        this.$stores.cart.checkoutStatus === CheckoutStatus.Successful;
      return {
        result,
        message: result ? '' : 'Checkout failed.',
      };
    }

    //----------------------------------------------------------------------
    //
    //  Lifecycle hooks
    //
    //----------------------------------------------------------------------

    created() {
      this.$stores.product.getAllProducts();
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    private addProductToCart(product: Product): void {
      this.$stores.cart.addProductToCart(product.id);
    }

    private async checkout(): Promise<void> {
      await this.$stores.cart.checkout(this.cartProducts);
    }
  }
</script>
