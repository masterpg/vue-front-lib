import 'vue';
import { VuexStore } from '../store/base';

declare module 'vue/types/vue' {
  interface Vue {
    // @ts-ignore
    $store: VuexStore;
  }
}
