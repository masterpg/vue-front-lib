import { HelloAPI, REST, ShopAPI } from '@/rest/types'
import { Component } from 'vue-property-decorator'
import { HelloAPIImpl } from '@/rest/modules/hello'
import { ShopAPIImpl } from '@/rest/modules/shop'
import Vue from 'vue'

const debug = process.env.NODE_ENV !== 'production'

@Component
class RESTImpl extends Vue implements REST {
  readonly shop: ShopAPI = new ShopAPIImpl()
  readonly hello: HelloAPI = new HelloAPIImpl()
}

export let rest: REST

export function initREST(): void {
  rest = new RESTImpl()
}

export * from '@/rest/types'
