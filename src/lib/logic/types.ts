import { StorageNode, StorageNodeShareSettingsInput } from './api'
import { StorageUploadManager } from './modules/storage'
import { User } from './store'

//========================================================================
//
//  Logic
//
//========================================================================

export interface AuthLogic {
  readonly user: User

  checkSingedIn(): Promise<void>

  signInWithGoogle(): Promise<void>

  signInWithFacebook(): Promise<void>

  signInWithEmailAndPassword(email: string, password: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  signInAnonymously(): Promise<{ result: boolean; code: string; errorMessage: string }>

  sendEmailVerification(continueURL: string): Promise<void>

  sendPasswordResetEmail(email: string, continueURL: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  createUserWithEmailAndPassword(
    email: string,
    password,
    profile: { displayName: string; photoURL: string | null }
  ): Promise<{ result: boolean; code: string; errorMessage: string }>

  signOut(): Promise<void>

  deleteAccount(): Promise<{ result: boolean; code: string; errorMessage: string }>

  updateEmail(newEmail: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]>

  addSignedInListener(listener: (user: User) => any): void

  removeSignedInListener(listener: (user: User) => any): void

  addSignedOutListener(listener: (user: User) => any): void

  removeSignedOutListener(listener: (user: User) => any): void
}

//--------------------------------------------------
//  Storage
//--------------------------------------------------

export interface StorageLogic {
  readonly nodes: StorageNode[]

  readonly baseURL: string

  getNode(key: { id?: string; path?: string }): StorageNode | undefined

  getNodeDict(): { [path: string]: StorageNode }

  getChildren(dirPath?: string): StorageNode[]

  getDirChildren(dirPath?: string): StorageNode[]

  getDescendants(dirPath?: string): StorageNode[]

  getDirDescendants(dirPath: string): StorageNode[]

  getHierarchicalNode(nodePath: string): StorageNode[]

  fetchHierarchicalNode(nodePath: string): Promise<StorageNode[]>

  fetchAncestorDirs(nodePath: string): Promise<StorageNode[]>

  fetchDirDescendants(dirPath?: string): Promise<StorageNode[]>

  fetchDescendants(dirPath?: string): Promise<StorageNode[]>

  fetchDirChildren(dirPath?: string): Promise<StorageNode[]>

  fetchChildren(dirPath?: string): Promise<StorageNode[]>

  fetchHierarchicalDescendants(dirPath?: string): Promise<StorageNode[]>

  createDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeDirs(dirPaths: string[]): Promise<void>

  removeFiles(filePaths: string[]): Promise<void>

  moveDir(fromDirPath: string, toDirPath: string): Promise<void>

  moveFile(fromFilePath: string, toFilePath: string): Promise<void>

  renameDir(dirPath: string, newName: string): Promise<void>

  renameFile(filePath: string, newName: string): Promise<void>

  setDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  setFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  newUploadManager(owner: Element): StorageUploadManager

  sortNodes(nodes: StorageNode[]): StorageNode[]
}

export interface UserStorageLogic extends StorageLogic {
  newUrlUploadManager(owner: Element): StorageUploadManager
}

export interface AppStorageLogic extends StorageLogic {}

//========================================================================
//
//  Value objects
//
//========================================================================

//========================================================================
//
//  Enumerations
//
//========================================================================

export enum AuthProviderType {
  Google = 'google.com',
  Facebook = 'facebook.com',
  Password = 'password',
  Anonymous = 'anonymous',
}
