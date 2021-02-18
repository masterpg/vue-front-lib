<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ShopPage
  padding: 12px
  body.screen--lg &, body.screen--xl &
    margin: 48px
  body.screen--md &
    margin: 24px
  body.screen--xs &, body.screen--sm &
    margin: 12px

.toggle
  border: 1px solid $primary

.title-text
  @extend %text-h6

.product-item,
.cart-item
  padding: 12px

  .title
    @extend %text-subtitle1

  .detail
    @extend %text-body2
    color: $text-secondary-color

.total-amount
  padding: 12px

  .title
    @extend %text-h6

  .detail
    @extend %text-h6
    color: $text-secondary-color

.error-text
  @extend %text-body2
  color: $text-error-color
  text-align: right
  margin: 0 20px
</style>

<template>
  <div class="ShopPage layout vertical">
    <div>
      <div class="layout horizontal center">
        <div class="title-text">{{ t('shop.products') }}</div>
      </div>
      <hr style="width: 100%" />
      <div v-for="product in products" :key="product.id" class="layout horizontal center product-item">
        <div class="layout vertical center-justified">
          <div class="title">{{ product.title }}</div>
          <div class="detail">
            <span>{{ t('shop.price') }}:</span> ¥{{ product.price }}&nbsp;/&nbsp;<span>{{ t('shop.stock') }}:</span>
            {{ product.stock }}
          </div>
        </div>
        <div class="flex-1"></div>
        <q-btn v-show="isSignedIn" round color="primary" size="xs" icon="add" @click="addButtonOnClick(product)" />
      </div>
    </div>

    <div v-show="!cartIsEmpty" class="app-mt-20">
      <div class="layout horizontal center">
        <div class="title-text">{{ t('shop.yourCurt') }}</div>
        <div class="flex-1"></div>
      </div>
      <hr style="width: 100%" />
      <div v-for="cartItem in cartItems" :key="cartItem.id" class="layout horizontal center cart-item">
        <div class="layout vertical center-justified">
          <div class="title">{{ cartItem.title }}</div>
          <div class="detail">
            <span>{{ t('shop.price') }}:</span> ¥{{ cartItem.price }} x {{ cartItem.quantity }}
          </div>
        </div>
        <div class="flex-1"></div>
        <q-btn round color="primary" size="xs" icon="remove" @click="removeButtonOnClick(cartItem)" />
      </div>
    </div>

    <div v-show="!cartIsEmpty" class="app-mt-20">
      <div class="layout horizontal center">
        <div class="title-text">{{ t('shop.total') }}</div>
        <div class="flex-1"></div>
      </div>
      <hr style="width: 100%" />
      <div class="layout horizontal center">
        <div class="total-amount layout horizontal center">
          <div class="detail">¥{{ cartTotalPrice }}</div>
        </div>
        <div class="flex-1"></div>
        <q-btn v-show="!cartIsEmpty" :label="t('shop.checkout')" color="primary" @click="checkoutButtonOnClick" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { CartItem, Product, injectService } from '@/demo/services'
import { computed, defineComponent, onMounted, reactive } from '@vue/composition-api'
import { Loading } from 'quasar'
import { useI18n } from '@/demo/i18n'

namespace ShopPage {
  export const clazz = defineComponent({
    name: 'ShopPage',

    setup(props, context) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const services = injectService()
      const { t } = useI18n()

      const isSignedIn = services.auth.isSignedIn

      const cartIsEmpty = computed(() => {
        return services.shop.cartItems.value.length === 0
      })

      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(async () => {
        Loading.show()
        await services.shop.fetchProducts()
        Loading.hide()
      })

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      async function addButtonOnClick(product: Product) {
        Loading.show()
        await services.shop.addItemToCart(product.id)
        Loading.hide()
      }

      async function removeButtonOnClick(cartItem: CartItem) {
        Loading.show()
        await services.shop.removeItemFromCart(cartItem.productId)
        Loading.hide()
      }

      async function checkoutButtonOnClick() {
        Loading.show()
        await services.shop.checkout()
        Loading.hide()
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      return {
        t,
        isSignedIn,
        products: services.shop.products,
        cartItems: services.shop.cartItems,
        cartTotalPrice: services.shop.cartTotalPrice,
        cartIsEmpty,
        addButtonOnClick,
        removeButtonOnClick,
        checkoutButtonOnClick,
      }
    },
  })
}

export default ShopPage.clazz
</script>
