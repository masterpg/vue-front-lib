import { Apis } from '../../src/app/apis/types';
import { Stores } from '../../src/app/stores/types';

declare interface TestStore<S> {
  initState(state: S): void;
  state: S;
  $apis: Apis;
  $stores: Stores;
}
