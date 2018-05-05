import Vue from 'vue';
import shopApi from './shop-api';
import { Apis, ShopApi } from './types';
import { Component } from 'vue-property-decorator';

const debug = process.env.NODE_ENV !== 'production';

@Component
class ApisImpl extends Vue implements Apis {

  constructor() {
    super();
    this.m_shop = shopApi;
  }

  private m_shop: ShopApi;

  get shop(): ShopApi {
    return this.m_shop;
  }

}

export function init(): void {
  Object.defineProperty(
    Vue.prototype, '$apis', {
      value: new ApisImpl(),
      writable: false,
    },
  );
}
