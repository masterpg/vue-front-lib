import { APIStorageNodeType as StorageNodeType } from './api'
import { StorageUploadManager } from './modules/storage'
import { User } from './store'

//========================================================================
//
//  Logic
//
//========================================================================

export interface StorageLogic {
  toURL(path: string): string

  getUserNodes(dir?: string): Promise<StorageNodeBag>

  createUserStorageDirs(dirPaths: string[]): Promise<StorageNodeBag>

  removeUserStorageFiles(filePaths: string[]): Promise<StorageNodeBag>

  removeUserStorageDir(dirNode: string): Promise<StorageNodeBag>

  newUserUploadManager(owner: Element): StorageUploadManager

  newAdminUploadManager(owner: Element): StorageUploadManager
}

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
}

//========================================================================
//
//  Value objects
//
//========================================================================

export interface StorageNodeBag {
  list: StorageNode[]
  map: { [path: string]: StorageNode }
}

export interface StorageNode {
  nodeType: StorageNodeType
  name: string
  dir: string
  path: string
  parent?: StorageNode
  children: StorageNode[]
}

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

export { StorageNodeType }
