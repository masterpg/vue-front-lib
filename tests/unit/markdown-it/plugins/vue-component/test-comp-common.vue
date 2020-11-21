<template>
  <div>{{ displayValue }}</div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'

interface TestCompCommon extends TestCompCommon.Props {
  readonly displayValue: string
}

namespace TestCompCommon {
  export interface Props {
    person: { name: string; age: number }
    flag: boolean
    arr?: string[]
    num?: number
  }

  export const clazz = defineComponent({
    name: 'TestCompCommon',

    props: {
      person: { type: Object, default: () => ({ name: 'Anonymous', age: 0 }) },
      flag: { type: Boolean, default: false },
      num: { type: Number, required: false },
      arr: { type: Array, required: false },
    },

    setup(props: Readonly<Props>, ctx) {
      const displayValue = computed(() => {
        const name = `name: ${props.person.name}`
        const age = `age: ${props.person.age}`
        const flag = typeof props.flag === 'boolean' ? `flag: ${props.flag}` : ''
        const num = typeof props.num === 'number' ? `num: ${props.num}` : ''
        const arr = Array.isArray(props.arr) ? `arr: [${props.arr.join(', ')}]` : ''
        return [name, age, flag, num, arr].filter(Boolean).join(', ')
      })

      return {
        displayValue,
      }
    },
  })
}

export default TestCompCommon.clazz
export { TestCompCommon }
</script>
