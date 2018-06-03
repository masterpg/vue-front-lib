import { APIs } from '../../src/app/apis/types';
import { Stores } from '../../src/app/stores/types';

declare interface TestStore<S> {
  initState(state: S): void;
  state: S;
  $apis: APIs;
  $stores: Stores;
}
