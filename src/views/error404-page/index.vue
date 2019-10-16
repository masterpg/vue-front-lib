<style lang="stylus" scoped>
.main {
  height: 100%
}

.sad-img {
  width: 30vw
  max-width: 150px
}

.back-button {
  width: 200px
}

.rest-box {
  width: 300px
}
</style>

<template>
  <div class="layout vertical center-center main">
    <img src="@/assets/icons/sad.svg" class="sad-img" />
    <div class="text-faded">Sorry, nothing here...<strong>(404)</strong></div>
    <q-btn color="primary" class="back-button" @click="m_backButtonOnClick()">Go back</q-btn>
  </div>
</template>

<script lang="ts">
import { BaseComponent } from '@/components'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'
import { router } from '@/base/router'

@Component({ name: 'error404-page' })
export default class Error404Page extends mixins(BaseComponent) {
  private m_backButtonOnClick() {
    router.views.abcPage.move()
  }
}
</script>
