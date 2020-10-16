<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.AppStoragePage
</style>

<template>
  <div>
    AppStoragePage
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

interface Props {}

namespace AppStoragePage {
  export const clazz = defineComponent({
    name: 'AppStoragePage',
  })
}

export default AppStoragePage.clazz
</script>
