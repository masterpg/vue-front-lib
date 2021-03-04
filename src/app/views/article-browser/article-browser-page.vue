<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ArticleBrowserPage
</style>

<template>
  <div ref="el" class="ArticleBrowserPage">記事ブラウザページ</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

namespace ArticleBrowserPage {
  export const clazz = defineComponent({
    name: 'ArticleBrowserPage',

    components: {},

    setup(props, ctx) {},
  })
}

export default ArticleBrowserPage.clazz
</script>
