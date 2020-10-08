<style lang="sass" scoped>
@import 'src/styles/app.variables'

.HomePage
  padding: 100px 12px 12px 12px

  body.screen--lg &, body.screen--xl &
    margin-top: 48px
  body.screen--md &
    margin: 24px
  body.screen--xs &, body.screen--sm &
    margin: 12px

.hello-world
  margin-top: 50px
</style>

<template>
  <div class="HomePage layout vertical center">
    <HelloWorld ref="helloWorld" class="hello-world" title="Welcome to Your Vue2 + Composition API" message="Taro Yamada" />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api'
import { HelloWorld } from '@/components/hello-world'

namespace HomePage {
  export const clazz = defineComponent({
    name: 'HomePage',

    components: {
      HelloWorld: HelloWorld.clazz,
    },

    setup() {
      const helloWorld = ref<HelloWorld>()

      onMounted(() => {
        const message = helloWorld.value!.hello()
        console.log(message)
      })

      return {
        helloWorld,
      }
    },
  })
}

export default HomePage.clazz
</script>
