import 'vue'
import { LogicContainer } from '@/app/logic'

declare module 'vue/types/vue' {
  interface Vue {
    $logic: LogicContainer
  }
}
