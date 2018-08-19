import 'vue';
import { Config } from '../app/base/config';
import { Utils } from '../app/base/utils';
import { Stores } from '../app/stores';

declare module 'vue/types/vue' {
  interface Vue {
    $config: Config;
    $utils: Utils;
    $stores: Stores;
  }
}
