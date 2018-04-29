import 'vue';
import { AppStore } from '../store/types';

declare module 'vue/types/vue' {
  interface Vue {
    $appStore: AppStore;
  }
}
