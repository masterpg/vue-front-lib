<style lang="sass" scoped>
@import 'src/app/styles/app.variables'
</style>

<template>
  <div class="CustomCheckbox  layout horizontal center">
    <span class="app-mr-4">CustomCheckbox:</span>
    <input type="checkbox" v-model="state.inputChecked" />
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, watch } from '@vue/composition-api'

/**
 * ■ v-modelを使ったコンポーネントのカスタマイズ
 * https://jp.vuejs.org/v2/guide/components-custom-events.html#v-model-を使ったコンポーネントのカスタマイズ
 *
 * `value`というプロパティ名はv-modelで使用される特別な名前である。
 * `input`というイベントはv-modelで使用される特別なイベントである。
 *
 * ただしチェックボックスやラジオボタンでは`value`を別の目的で使用するため、
 * `v-model`は`value`というプロパティ名を使用できない。
 * このような場合は`model`で`v-model`で使用するプロパティ名とイベント名を指定する。
 *
 * 本コンポーネントでは以下のようにプロパティ名とイベント名を設定した:
 * ・プロパティ名: 'checked'
 * ・イベント名: 'change'
 */
interface CustomCheckbox extends CustomCheckbox.Props {}

namespace CustomCheckbox {
  export interface Props {
    checked: boolean
  }

  export const clazz = defineComponent({
    name: 'CustomCheckbox',

    model: {
      prop: 'checked',
      event: 'change',
    },

    props: {
      checked: { type: Boolean, default: false },
    },

    setup(props: Readonly<Props>, context) {
      const state = reactive({
        inputChecked: props.checked,
      })

      watch(
        () => state.inputChecked,
        (newValue, oldValue) => {
          console.log(`①: props.value: "${props.checked}", state.inputChecked: "${state.inputChecked}"`)
          context.emit('change', state.inputChecked)
        }
      )

      watch(
        () => props.checked,
        (newValue, oldValue) => {
          console.log(`②: props.value: "${props.checked}", state.inputChecked: "${state.inputChecked}"`)
          state.inputChecked = props.checked
        }
      )

      return {
        state,
      }
    },
  })
}

export default CustomCheckbox.clazz
export { CustomCheckbox }
</script>
