import { GQL, GQLMutation, GQLQuery } from '@/gql/types'
import { Component } from 'vue-property-decorator'
import { GQLMutationImpl } from '@/gql/mutation'
import { GQLQueryImpl } from '@/gql/query'
import Vue from 'vue'

@Component
class GQLImpl extends Vue implements GQL {
  readonly query: GQLQuery = new GQLQueryImpl()
  readonly mutation: GQLMutation = new GQLMutationImpl()
}

export let gql: GQLImpl

export function initGQL(): void {
  gql = new GQLImpl()
}

export * from '@/gql/types'
