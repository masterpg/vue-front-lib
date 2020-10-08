<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.HelloWorld
  font-family: Avenir, Helvetica, Arial, sans-serif
  color: $blue-grey-9
  @extend %text-h4
  font-weight: map_get($text-weights, "medium")
  text-align: center

.img
  max-width: 200px

.v-spacer
  height: 50px
</style>

<template>
  <div class="HelloWorld">
    <q-img class="img" :src="require('@/app/assets/logo.png')" alt="Vue logo" />
    <div class="v-spacer" />
    <div>{{ title }}</div>
  </div>
</template>
