<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.MarkdownItDemoPage
  height: 100%
</style>

<template>
  <div class="MarkdownItDemoPage">
    <MarkdownEditor v-model="mdSrc" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api'
import { MarkdownEditor } from '@/app/components/markdown-editor'
import cheatSheet from '@/demo/views/markdown/cheat-sheet.md'

namespace MarkdownDemoPage {
  export const clazz = defineComponent({
    name: 'MarkdownDemoPage',

    components: {
      MarkdownEditor: MarkdownEditor.clazz,
    },

    setup(props, ctx) {
      const mdSrc = ref(cheatSheet)

      return {
        mdSrc,
      }
    },
  })
}

export default MarkdownDemoPage.clazz
</script>
