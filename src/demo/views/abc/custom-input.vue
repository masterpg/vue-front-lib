<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.input
  width: 200px
</style>

<template>
  <div>
    <q-input v-model="state.inputValue" class="input" label="CustomInput Value" dense />
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, watch } from '@vue/composition-api'

interface Props {
  value: string
}

/**
 * ■ コンポーネントでv-modelを使う
 * https://jp.vuejs.org/v2/guide/components.html#コンポーネントで-v-model-を使う
 * ・`value`というプロパティ名はv-modelで使用される特別な名前である。
 * ・`input`というイベントはv-modelで使用される特別なイベントである。
 * ・`value`プロパティの値は直接変更できない。例: props.value = 'hoge'
 * ・`value`プロパティの値を変更するには`input`イベントに新しい値を設定してイベントを発火する必要がある。
 */
namespace CustomInput {
  export const clazz = defineComponent({
    name: 'CustomInput',

    props: {
      value: { type: String, default: '' },
    },

    setup(props: Props, context) {
      const state = reactive({
        inputValue: '',
      })

      watch(
        () => state.inputValue,
        (newValue, oldValue) => {
          console.log(`①: props.value: "${props.value}", state.inputValue: "${state.inputValue}"`)
          context.emit('input', state.inputValue)
        }
      )

      watch(
        () => props.value,
        (newValue, oldValue) => {
          console.log(`②: props.value: "${props.value}", state.inputValue: "${state.inputValue}"`)
          state.inputValue = props.value
        }
      )

      return {
        state,
      }
    },
  })
}

export default CustomInput.clazz
export { CustomInput }
</script>
