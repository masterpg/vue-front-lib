<style lang="sass" scoped>
@import 'src/app/styles/app.variables'
</style>

<template>
  <div>
    <MarkdownEditor ref="markdownEditor" />
  </div>
</template>

<script lang="ts">
import { MarkdownEditor } from '@/app/components/markdown-editor'
import { defineComponent } from '@vue/composition-api'

interface ArticleWritingView extends ArticleWritingView.Props {}

namespace ArticleWritingView {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'ArticleWritingView',

    components: {
      MarkdownEditor: MarkdownEditor.clazz,
    },

    setup(props, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {}
    },
  })
}

export default ArticleWritingView.clazz
export { ArticleWritingView }
</script>
