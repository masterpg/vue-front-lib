import 'vue';
import { Stores } from '../app/stores/types';

declare module 'vue/types/vue' {
  interface Vue {
    $stores: Stores;
  }
}
