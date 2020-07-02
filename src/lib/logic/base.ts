import { AuthStatus, StorageNodeType } from './types'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'
import { config } from '@/lib/config'
import { removeEndSlash } from 'web-base-lib'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class BaseLogicStore extends Vue {
  m_db: firebase.firestore.Firestore | null = null

  get db(): firebase.firestore.Firestore {
    if (!this.m_db) this.m_db = firebase.firestore()
    return this.m_db
  }

  authStatus: AuthStatus = AuthStatus.None
}

const logicStore = new BaseLogicStore()

abstract class BaseLogic extends Vue {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected get db(): firebase.firestore.Firestore {
    return logicStore.db
  }

  protected get authStatus(): AuthStatus {
    return logicStore.authStatus
  }

  protected setAuthStatus(value: AuthStatus): void {
    logicStore.authStatus = value
  }

  protected get isSignedIn(): boolean {
    return this.authStatus === AuthStatus.Available
  }
}

/**
 * ノード配列をディレクトリ階層に従ってソートします。
 * @param nodes
 */
function sortStorageNodes<NODE extends { nodeType: StorageNodeType; name: string; dir: string; path: string }>(nodes: NODE[]): NODE[] {
  return nodes.sort((a: NODE, b: NODE) => {
    let strA = a.path
    let strB = b.path
    if (a.nodeType === StorageNodeType.File) {
      strA = `${a.dir}${String.fromCodePoint(0xffff)}${a.name}`
    }
    if (b.nodeType === StorageNodeType.File) {
      strB = `${b.dir}${String.fromCodePoint(0xffff)}${b.name}`
    }

    return strA < strB ? -1 : strA > strB ? 1 : 0
  })
}

/**
 * ストレージノードにアクセスするための基準となるURLです。
 */
function getBaseStorageURL(): string {
  return `${removeEndSlash(config.api.baseURL)}/storage`
}

/**
 * ストレージノードのアクセス先となるURLを取得します。
 * @param nodeId
 */
function getStorageNodeURL(nodeId: string): string {
  return `${getBaseStorageURL()}/${nodeId}`
}

//========================================================================
//
//  Exports
//
//========================================================================

export { BaseLogic, sortStorageNodes, getBaseStorageURL, getStorageNodeURL }
