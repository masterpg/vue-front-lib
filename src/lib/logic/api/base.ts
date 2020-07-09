import { AuthStatus, StorageNode, TimestampEntity, UserInfo, UserInfoInput } from '../types'
import { OmitEntityTimestamp } from '@/firestore-ex'
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

  getStorageNode(nodePath: string): Promise<APIStorageNode | undefined>

  getStorageDirDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageDirChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageHierarchicalNodes(nodePath: string): Promise<APIStorageNode[]>

  getStorageAncestorDirs(nodePath: string): Promise<APIStorageNode[]>

  createStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  removeStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string): Promise<StoragePaginationResult>

  removeStorageFile(filePath: string): Promise<APIStorageNode | undefined>

  moveStorageDir(options: StoragePaginationOptionsInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult>

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode>

  renameStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult>

  renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode>

  setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<APIStorageNode>

  setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<APIStorageNode>

  handleUploadedFile(filePath: string): Promise<APIStorageNode>

  getSignedUploadUrls(params: { filePath: string; contentType?: string }[]): Promise<string[]>

  //--------------------------------------------------
  //  Helpers
  //--------------------------------------------------

  /**
   * ページングが必要なノード検索APIをページングがなくなるまで実行し結果を取得します。
   * 注意: ノード検索API関数の第一引数は検索オプション`StoragePaginationOptionsInput`
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

export interface AppConfigResponse {
  usersDir: string
  docsDir: string
}

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

export interface StorageNodeShareSettingsInput {
  isPublic: boolean | null
  readUIds: string[] | null
  writeUIds: string[] | null
}

export interface StoragePaginationOptionsInput {
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
