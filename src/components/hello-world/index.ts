import { HelloWorld as _HelloWorld, setup } from '@/components/hello-world/script'
import HelloWorldTemplate from '@/components/hello-world/template.vue'
import { defineComponent } from '@vue/composition-api'

type HelloWorld = _HelloWorld

namespace HelloWorld {
  export const clazz = defineComponent({
    name: 'HelloWorld',

    mixins: [HelloWorldTemplate],

    props: {
      title: { type: String },
    },

    setup,
  })
}

export default HelloWorld.clazz
export { HelloWorld }
