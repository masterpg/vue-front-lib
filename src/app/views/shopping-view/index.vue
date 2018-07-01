<style lang="stylus" scoped>
@import '../../../assets/styles/_spacing.styl';
@import '../../../assets/styles/_typography.styl';

.title-text {
  @extend .app-font-title;
}

.product-item {
  @extend .app-pa-3;

  &.iron-selected {
    background-color: var(--app-grid-selected-activ-item);
  }

  .title {
    @extend .app-font-subhead;
  }

  .detail {
    @extend .app-font-body1;
    color: var(--app-secondary-text-color);
  }
}

.error-text {
  @extend .app-font-body1;
  color: var(--app-error-text-color);
}

.checkout-button {
  color: var(--app-link-color);
}
</style>


<template>
  <div class="layout vertical" :class="{ 'app-ma-12': f_pc, 'app-ma-6': f_tab, 'app-ma-3': f_sp }">

    <div>
      <div class="layout horizontal center">
        <div class="title-text">Products</div>
      </div>
      <hr style="width: 100%;">
      <div
        v-for="(product, index) in m_products"
        class="layout horizontal center product-item"
      >
        <div class="layout vertical center-justified">
          <div class="title">{{ product.title }}</div>
          <div class="detail">
            <span>Price</span> &mdash; {{ product.price | currency }},&nbsp;
            <span>Stock</span> &mdash; {{ product.inventory }}
          </div>
        </div>
        <div class="flex"></div>
        <paper-icon-button icon="icons:add-box" @click="m_addProductToCart(product)"></paper-icon-button>
      </div>
    </div>

    <div class="app-mt-5">
      <div class="layout horizontal center">
        <div class="title-text">Your Cart</div>
        <div class="flex"></div>
      </div>
      <hr style="width: 100%;">
      <div
        v-for="(product, index) in m_cartProducts"
        class="layout horizontal center product-item"
      >
        <div class="layout vertical center-justified">
          <div class="title">{{ product.title }}</div>
          <div class="detail">
            <span>Price</span> &mdash; {{ product.price | currency }} x {{ product.quantity }}
          </div>
        </div>
      </div>
      <div class="layout horizontal center">
        <div class="flex error-text">{{ m_checkoutStatus.message }}</div>
        <paper-button
          v-show="!m_cartIsEmpty"
          class="checkout-button"
          @click="m_checkout">Checkout
        </paper-button>
      </div>
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

  get m_cartIsEmpty(): boolean {
    return this.m_cartProducts.length === 0;
  }

  get m_products(): Product[] {
    return this.$stores.product.allProducts;
  }

  get m_cartProducts(): CartProduct[] {
    return this.$stores.cart.cartProducts;
  }

  get m_cartTotalPrice(): number {
    return this.$stores.cart.cartTotalPrice;
  }

  get m_checkoutStatus(): { result: boolean; message: string } {
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

  created() {}

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  m_addProductToCart(product: Product): void {
    this.$stores.cart.addProductToCart(product.id);
  }

  async m_checkout(): Promise<void> {
    await this.$stores.cart.checkout();
  }
}
</script>
