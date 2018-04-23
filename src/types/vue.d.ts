import 'vue';
import { AppStore, VuexStore } from '../store';

declare module 'vue/types/vue' {
  interface Vue {
    $appStore: AppStore;
    // @ts-ignore
    $store: VuexStore;
  }
}
