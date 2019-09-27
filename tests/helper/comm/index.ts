import * as firebaseAdmin from 'firebase-admin'
import { GQLFacade } from '@/gql'
import { GQLFacadeImpl } from '@/gql/facade'
import gql from 'graphql-tag'

export interface CollectionData {
  collectionName: string
  collectionRecords: any[]
}

export interface AuthUser extends Partial<firebaseAdmin.auth.DecodedIdToken> {
  uid: string
}

export class GQLTestFacade extends GQLFacadeImpl {
  private m_user?: AuthUser

  async putTestData(inputs: CollectionData[]): Promise<void> {
    await this.mutate<{ data: boolean }>({
      mutation: gql`
        mutation PutTestData($inputs: [PutTestDataInput!]!) {
          putTestData(inputs: $inputs)
        }
      `,
      variables: { inputs },
    })
  }

  setAuthUser(user: AuthUser): void {
    this.m_user = user
  }

  clearAuthUser(): void {
    this.m_user = undefined
  }

  protected async getIdToken(): Promise<string> {
    if (this.m_user) {
      return JSON.stringify(this.m_user)
    }
    return ''
  }
}
export const testGQL: GQLFacade = new GQLTestFacade()

export async function putTestData(inputs: CollectionData[]): Promise<void> {
  await (testGQL as GQLTestFacade).putTestData(inputs)
}

export function setAuthUser(user: AuthUser): void {
  ;(testGQL as GQLTestFacade).setAuthUser(user)
}

export function clearAuthUser(): void {
  ;(testGQL as GQLTestFacade).clearAuthUser()
}

export function removeGQLMetadata<T>(data: T): T {
  function _isObject(value: any): boolean {
    return value instanceof Object && !(value instanceof Array)
  }

  function _remove(obj: Object) {
    delete obj['__typename']
  }

  if (Array.isArray(data)) {
    for (const obj of data) {
      removeGQLMetadata(obj)
    }
  } else if (_isObject(data)) {
    _remove(data)
    for (const key of Object.keys(data)) {
      removeGQLMetadata(data[key])
    }
  }
  return data
}
