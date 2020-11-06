<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

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
  <div class="HomePage layout vertical center" @click="onClick">
    <HelloWorld ref="helloWorld" class="hello-world" title="Welcome to Your Vue2 + Composition API" message="Taro Yamada" />
    <div>{{ JSON.stringify(state.persons) }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref } from '@vue/composition-api'
import { HelloWorld } from '@/demo/components/hello-world'

class Person {
  constructor(public first: string, public last: string) {
    this.fullName = `${first} ${last}`
  }

  readonly fullName: string
}

namespace HomePage {
  export const clazz = defineComponent({
    name: 'HomePage',

    components: {
      HelloWorld: HelloWorld.clazz,
    },

    setup() {
      const helloWorld = ref<HelloWorld>()
      const state = reactive({
        persons: [new Person('Masaaki', 'Hojo')] as Person[],
      })

      onMounted(() => {
        const message = helloWorld.value!.hello()
        console.log(message)
      })

      function onClick() {
        state.persons[0].first = 'Yuki'
      }

      return {
        helloWorld,
        onClick,
        state,
      }
    },
  })
}

export default HomePage.clazz
</script>
