<style scoped>
@import '../../styles/placeholder/typography.css';

.title-text {
  @extend %comm-font-title;
}

.product-item,
.cart-item {
  padding: 12px;

  .title {
    @extend %comm-font-subhead1;
  }

  .detail {
    @extend %comm-font-body1;
    color: var(--app-secondary-text-color);
  }
}

.error-text {
  @extend %comm-font-body1;
  color: var(--app-error-text-color);
}

.checkout-button {
  color: var(--app-link-color);
}
</style>

<template>
  <div class="layout vertical" :class="{'comm-ma-48': pcScreen, 'comm-ma-24': tabScreen, 'comm-ma-12': spScreen}">
    <div>
      <div class="layout horizontal center">
        <div class="title-text">{{ $t('products') }}</div>
      </div>
      <hr style="width: 100%;" />
      <div v-for="product in $logic.shop.allProducts" :key="product.id" class="layout horizontal center product-item">
        <div class="layout vertical center-justified">
          <div class="title">{{ product.title }}</div>
          <div class="detail">
            <span>{{ $t('price') }}</span> &mdash; {{ product.price | currency }},&nbsp; <span>{{ $t('stock') }}</span> &mdash;
            {{ product.inventory }}
          </div>
        </div>
        <div class="flex"></div>
        <paper-icon-button icon="icons:add-box" @click="m_addButtonOnClick(product)"></paper-icon-button>
      </div>
    </div>

    <div class="comm-mt-20">
      <div class="layout horizontal center">
        <div class="title-text">{{ $t('yourCurt') }}</div>
        <div class="flex"></div>
      </div>
      <hr style="width: 100%;" />
      <div v-for="cartItem in $logic.shop.cartItems" :key="cartItem.id" class="layout horizontal center cart-item">
        <div class="layout vertical center-justified">
          <div class="title">{{ cartItem.title }}</div>
          <div class="detail">
            <span>{{ $t('price') }}</span> &mdash; {{ cartItem.price | currency }} x {{ cartItem.quantity }}
          </div>
        </div>
      </div>
      <div class="layout horizontal center">
        <div class="flex error-text">{{ m_checkoutStatus.message }}</div>
        <paper-button v-show="!m_cartIsEmpty" class="checkout-button" @click="m_checkoutButtonOnClick">{{ $t('checkout') }}</paper-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import '@polymer/paper-button/paper-button'
import '@polymer/paper-card/paper-card'
import '@polymer/paper-icon-button/paper-icon-button'

import {BaseComponent} from '@/base/component'
import {CartItem, CheckoutStatus, Product} from '@/store'
import {Component} from 'vue-property-decorator'
import {mixins} from 'vue-class-component'

@Component
export default class ShoppingPage extends mixins(BaseComponent) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private get m_cartIsEmpty(): boolean {
    return this.$logic.shop.cartItems.length === 0
  }

  private get m_checkoutStatus(): {result: boolean; message: string} {
    const checkoutStatus = this.$logic.shop.checkoutStatus
    const result = checkoutStatus === CheckoutStatus.None || checkoutStatus === CheckoutStatus.Successful
    return {
      result,
      message: result ? '' : 'Checkout failed.',
    }
  }

  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {}

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  private m_addButtonOnClick(product: Product): void {
    this.$logic.shop.addProductToCart(product.id)
  }

  private async m_checkoutButtonOnClick(): Promise<void> {
    await this.$logic.shop.checkout()
  }
}
</script>

<i18n>
en:
  products: "Products"
  yourCurt: "Your Curt"
  price: "Price"
  stock: "Stock"
  checkout: "Checkout"
ja:
  products: "商品一覧"
  yourCurt: "あなたのカート"
  price: "価格"
  stock: "在庫"
  checkout: "チェックアウト"
</i18n>
