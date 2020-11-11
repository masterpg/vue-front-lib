<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.AuthMessageView
  width: 340px
  body.screen--lg &, body.screen--xl &, body.screen--md &
    width: 340px
  body.screen--xs &, body.screen--sm &
    width: 270px

.title
  @extend %text-h6
</style>

<template>
  <q-card class="AuthMessageView">
    <q-form>
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <slot name="message"></slot>
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

interface AuthMessageView extends AuthMessageView.Props {}

namespace AuthMessageView {
  export interface Props {
    title: string
  }

  export const clazz = defineComponent({
    name: 'AuthMessageView',

    props: {
      title: { type: String, required: true },
    },

    setup(props: Readonly<Props>, ctx) {},
  })
}

export default AuthMessageView.clazz
export { AuthMessageView }
</script>
