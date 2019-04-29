import {API, ShopAPI} from '@/api/types'
import {Component} from 'vue-property-decorator'
import {ShopAPIImpl} from '@/api/shop'
import Vue from 'vue'

const debug = process.env.NODE_ENV !== 'production'

@Component
class APIImpl extends Vue implements API {
  readonly shop: ShopAPI = new ShopAPIImpl()
}

export let api: API

export function initAPI(): void {
  api = new APIImpl()
}

export * from '@/api/types'
