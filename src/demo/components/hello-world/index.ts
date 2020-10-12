import { HelloWorld as _HelloWorld, setup } from '@/demo/components/hello-world/script'
import HelloWorldTemplate from '@/demo/components/hello-world/template.vue'
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
