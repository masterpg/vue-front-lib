<template>
  <span>{{ displayValue }}</span>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'

interface TestCompCommon extends TestCompCommon.Props {
  readonly displayValue: string
}

namespace TestCompCommon {
  export interface Props {
    person: { name: string; age: number }
    arr: string[]
    flag: boolean
    num: number
  }

  export const clazz = defineComponent({
    name: 'TestCompCommon',

    props: {
      person: { type: Object, default: () => ({ name: 'Anonymous', age: 0 }) },
      arr: { type: Array, default: () => [] },
      flag: { type: Boolean, default: false },
      num: { type: Number, default: 0 },
    },

    setup(props: Readonly<Props>, ctx) {
      const displayValue = computed(() => {
        const name = `name: ${props.person.name}`
        const age = `age: ${props.person.age}`
        const arr = `arr: [${props.arr.join(', ')}]`
        const flag = `flag: ${props.flag}`
        const num = `num: ${props.num}`
        return `${name}, ${age}, ${arr}, ${flag}, ${num}`
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
