import { StorageNode, StorageNodeShareSettingsInput } from './api'
import { StorageUploadManager } from './modules/storage'
import { User } from './store'

//========================================================================
//
//  Logic
//
//========================================================================

export interface StorageLogic {
  readonly nodes: StorageNode[]

  readonly baseURL: string

  getNode(path: string): StorageNode | undefined

  getNodeDict(): { [path: string]: StorageNode }

  getChildren(dirPath?: string): StorageNode[]

  getDirChildren(dirPath?: string): StorageNode[]

  getDescendants(dirPath: string): StorageNode[]

  getDirDescendants(dirPath: string): StorageNode[]

  pullDescendants(dirPath?: string): Promise<{ added: StorageNode[]; updated: StorageNode[]; removed: StorageNode[] }>

  pullChildren(dirPath?: string): Promise<{ added: StorageNode[]; updated: StorageNode[]; removed: StorageNode[] }>

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
