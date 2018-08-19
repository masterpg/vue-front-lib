import { APIs } from '../../src/app/apis';
import { Stores } from '../../src/app/stores';

declare interface TestStore<S> {
  $apis: APIs;
  $stores: Stores;
}
