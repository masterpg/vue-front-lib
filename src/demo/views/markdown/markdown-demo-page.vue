<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.MarkdownItDemoPage
  height: 100%
</style>

<template>
  <div class="MarkdownItDemoPage">
    <MarkdownEditor />
  </div>
</template>

<script lang="ts">
import { MarkdownEditor } from '@/app/components/markdown-editor'
import { defineComponent } from '@vue/composition-api'

namespace MarkdownDemoPage {
  export const clazz = defineComponent({
    name: 'MarkdownDemoPage',

    components: {
      MarkdownEditor: MarkdownEditor.clazz,
    },

    setup(props, ctx) {},
  })
}

export default MarkdownDemoPage.clazz
</script>
