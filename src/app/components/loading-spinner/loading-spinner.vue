<style lang="sass" scoped>
@import 'src/app/styles/app.variables'
</style>

<template>
  <q-icon class="LoadingSpinner" :color="color" :size="size">
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 50 50"
      style="enable-background:new 0 0 50 50;"
      xml:space="preserve"
    >
      <path
        d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"
      >
        <animateTransform
          attributeType="xml"
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.6s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  </q-icon>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

interface LoadingSpinner extends LoadingSpinner.Props {}

namespace LoadingSpinner {
  export interface Props {
    size: string
    color: string
  }

  export const clazz = defineComponent({
    name: 'LoadingSpinner',

    props: {
      size: { type: String, default: '26px' },
      color: { type: String, default: 'grey-6' },
    },

    setup(props: Readonly<Props>, ctx) {},
  })
}

export default LoadingSpinner.clazz
export { LoadingSpinner }
</script>
