import { APIs } from '../../src/app/apis/types';
import { Stores } from '../../src/app/stores/types';

declare interface TestStore<S> {
  $apis: APIs;
  $stores: Stores;
}
