<template>
  <div id="app">
    <h1>Shopping Cart Example</h1>
    <hr>
    <h2>Products</h2>
    <ProductList/>
    <hr>
    <ShoppingCart/>
  </div>
</template>

<script>
import ProductList from './product-list.vue'
import ShoppingCart from './shopping-cart.vue'

export default {
  components: { ProductList, ShoppingCart }
}
</script>
