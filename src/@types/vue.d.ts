import 'vue'
import { LogicContainer } from '@/example/logic'

declare module 'vue/types/vue' {
  interface Vue {
    $logic: LogicContainer
  }
}
