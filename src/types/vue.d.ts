import 'vue';
import { Config } from '../app/config';
import { Stores } from '../app/stores/types';
import { Utils } from '../app/utils';

declare module 'vue/types/vue' {
  interface Vue {
    $config: Config;
    $stores: Stores;
    $utils: Utils;
  }
}
