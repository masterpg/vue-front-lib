import 'vue';
import { Stores } from '../app/stores/types';
import { Config } from '../app/config';

declare module 'vue/types/vue' {
  interface Vue {
    $config: Config;
    $stores: Stores;
  }
}
