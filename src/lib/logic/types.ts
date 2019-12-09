import { StorageNode, User } from './store'
import { StorageUploadManager } from './modules/storage'

//========================================================================
//
//  Logic
//
//========================================================================

export interface StorageLogic {
  readonly nodes: StorageNode[]

  getNodeMap(): { [path: string]: StorageNode }

  pullUserNodes(dir?: string): Promise<void>

  createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeUserStorageFiles(filePaths: string[]): Promise<StorageNode[]>

  renameUserStorageDir(dirPath: string, newName: string): Promise<StorageNode[]>

  renameUserStorageFile(filePath: string, newName: string): Promise<StorageNode>

  newUserUploadManager(owner: Element): StorageUploadManager

  newUserUrlUploadManager(owner: Element): StorageUploadManager

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

  addSignedInListener(listener: (user: User) => any): void

  removeSignedInListener(listener: (user: User) => any): void
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
