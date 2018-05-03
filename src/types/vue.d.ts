import 'vue';
import { AppStore } from '../app/store/types';

declare module 'vue/types/vue' {
  interface Vue {
    $appStore: AppStore;
  }
}
