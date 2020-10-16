<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.UserStoragePage
</style>

<template>
  <div>
    UserStoragePage
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

interface Props {}

namespace UserStoragePage {
  export const clazz = defineComponent({
    name: 'UserStoragePage',
  })
}

export default UserStoragePage.clazz
</script>
