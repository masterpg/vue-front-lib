<template>
  <span>{{ yourName }}</span>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

interface TestCompInline extends TestCompInline.Props {}

namespace TestCompInline {
  export interface Props {
    yourName: string
  }

  export const clazz = defineComponent({
    name: 'TestCompInline',

    props: {
      yourName: { type: String, default: 'Anonymous' },
    },

    setup(props: Readonly<Props>, ctx) {},
  })
}

export default TestCompInline.clazz
export { TestCompInline }
</script>
