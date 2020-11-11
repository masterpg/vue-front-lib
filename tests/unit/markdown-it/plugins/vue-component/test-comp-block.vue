<template>
  <div>{{ yourName }}</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

interface TestCompBlock extends TestCompBlock.Props {}

namespace TestCompBlock {
  export interface Props {
    yourName: string
  }

  export const clazz = defineComponent({
    name: 'TestCompBlock',

    props: {
      yourName: { type: String, default: 'Anonymous' },
    },

    setup(props: Readonly<Props>, ctx) {},
  })
}

export default TestCompBlock.clazz
export { TestCompBlock }
</script>
