import {
  AuthStatus,
  CreateArticleDirInput,
  CreateStorageNodeInput,
  SetArticleSortOrderInput,
  StorageNode,
  StorageNodeKeyInput,
  StorageNodeShareSettingsInput,
  TimestampEntity,
  UserInfo,
  UserInfoInput,
} from '../types'
import { OmitEntityTimestamp } from '@/firestore-ex'
import { StorageConfig } from '@/lib/config'
import dayjs from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

export interface LibAPIContainer {
  getAppConfig(): Promise<AppConfigResponse>

  //--------------------------------------------------
  //  User
  //--------------------------------------------------

  getAuthData(): Promise<AuthDataResult>

  setOwnUserInfo(input: UserInfoInput): Promise<UserInfo>

  deleteOwnUser(): Promise<boolean>

  //--------------------------------------------------
  //  Storage
  //--------------------------------------------------

  getStorageNode(input: StorageNodeKeyInput): Promise<APIStorageNode | undefined>

  getStorageDirDescendants(input: StoragePaginationInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageDescendants(input: StoragePaginationInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageDirChildren(input: StoragePaginationInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageChildren(input: StoragePaginationInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageHierarchicalNodes(nodePath: string): Promise<APIStorageNode[]>

  getStorageAncestorDirs(nodePath: string): Promise<APIStorageNode[]>

  createStorageDir(dirPath: string, input?: CreateStorageNodeInput): Promise<APIStorageNode>

  createStorageHierarchicalDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  removeStorageDir(input: StoragePaginationInput | null, dirPath: string): Promise<StoragePaginationResult>

  removeStorageFile(filePath: string): Promise<APIStorageNode | undefined>

  moveStorageDir(input: StoragePaginationInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult>

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode>

  renameStorageDir(input: StoragePaginationInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult>

  renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode>

  setStorageDirShareSettings(dirPath: string, input: StorageNodeShareSettingsInput): Promise<APIStorageNode>

  setStorageFileShareSettings(filePath: string, input: StorageNodeShareSettingsInput): Promise<APIStorageNode>

  handleUploadedFile(filePath: string): Promise<APIStorageNode>

  getSignedUploadUrls(params: { filePath: string; contentType?: string }[]): Promise<string[]>

  //--------------------------------------------------
  //  Article
  //--------------------------------------------------

  createArticleDir(dirPath: string, input: CreateArticleDirInput): Promise<APIStorageNode>

  setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<APIStorageNode>

  //--------------------------------------------------
  //  Helpers
  //--------------------------------------------------

  /**
   * ページングが必要なノード検索APIをページングがなくなるまで実行し結果を取得します。
   * 注意: ノード検索API関数の第一引数は検索オプション`StoragePaginationInput`
   *       であることを前提とします。
   *
   * @param func ノード検索API関数を指定
   * @param params ノード検索APIに渡す引数を指定
   */
  callStoragePaginationAPI<FUNC extends (...args: any[]) => Promise<StoragePaginationResult>>(
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<APIStorageNode[]>
}

export interface APIEntity {
  id: string
}

export interface RawTimestampEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export type ToRawTimestampEntity<T> = OmitEntityTimestamp<T> & RawTimestampEntity

//--------------------------------------------------
//  Foundation
//--------------------------------------------------

export interface AppConfigResponse extends StorageConfig {}

//--------------------------------------------------
//  User
//--------------------------------------------------

export interface AuthDataResult {
  status: AuthStatus
  token: string
  user?: UserInfo
}

//--------------------------------------------------
//  Storage
//--------------------------------------------------

export interface APIStorageNode extends Omit<StorageNode, 'url'> {}

export interface StoragePaginationInput {
  maxChunk?: number
  pageToken?: string
}

export interface StoragePaginationResult {
  list: APIStorageNode[]
  nextPageToken?: string
}

//========================================================================
//
//  Implementation
//
//========================================================================

export function toTimestampEntity<T extends RawTimestampEntity>(entity: T): OmitEntityTimestamp<T> & TimestampEntity {
  const { createdAt, updatedAt, ...otherEntity } = entity
  return {
    ...otherEntity,
    createdAt: dayjs(createdAt),
    updatedAt: dayjs(updatedAt),
  }
}

export function toTimestampEntities<T extends RawTimestampEntity>(entities: T[]): (OmitEntityTimestamp<T> & TimestampEntity)[] {
  return entities.map(entity => toTimestampEntity(entity))
}
