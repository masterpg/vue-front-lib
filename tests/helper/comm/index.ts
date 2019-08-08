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

interface GQLTestFacade extends GQLFacade {
  putTestData(testData: CollectionData[]): Promise<void>
  setAuthUser(user: AuthUser): void
  clearAuthUser(): void
}

export class GQLTestFacadeImpl extends GQLFacadeImpl implements GQLTestFacade {
  private m_user?: AuthUser

  async putTestData(testData: CollectionData[]): Promise<void> {
    await this.mutate<{ data: boolean }>({
      mutation: gql`
        mutation PutTestData($testData: [PutTestDataInput!]!) {
          putTestData(testData: $testData)
        }
      `,
      variables: { testData },
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
export const testGQL: GQLFacade = new GQLTestFacadeImpl()

export async function putTestData(testData: CollectionData[]): Promise<void> {
  await (testGQL as GQLTestFacade).putTestData(testData)
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
