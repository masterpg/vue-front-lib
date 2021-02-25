import { AuthStatus, User, UserClaims, UserInput } from '@/app/services'
import { RawEntity, toEntities } from '@/app/services/apis/base'
import { pickProps, removeStartDirChars } from 'web-base-lib'
import { APIContainer } from '@/app/services/apis'
import { AppAdminToken } from '../data'
import { GQLAPIClient } from '@/app/services/apis/gql/client'
import axios from 'axios'
import gql from 'graphql-tag'
import path from 'path'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestAPIContainer extends APIContainer {
  setTestAuthToken(token: TestAuthToken | null): void
  putTestStoreData(inputs: PutTestStoreDataInput[]): Promise<void>
  putTestIndexData(input: PutTestIndexDataInput): Promise<void>
  uploadTestFiles(uploadList: TestUploadFileItem[]): Promise<void>
  uploadTestHierarchyFiles(uploadList: TestUploadFileItem[]): Promise<void>
  uploadTestUserFiles(user: TestAuthToken, uploadList: TestUploadFileItem[]): Promise<void>
  removeTestDir(dirPaths: string[]): Promise<void>
  removeTestUserDir(user: TestAuthToken): Promise<void>
  removeTestUserDirs(user: TestAuthToken, dirPaths: string[]): Promise<void>
  removeTestFiles(filePaths: string[]): Promise<void>
  removeTestUserFiles(user: TestAuthToken, filePaths: string[]): Promise<void>
  setTestFirebaseUsers(...users: TestFirebaseUserInput[]): Promise<void>
  deleteTestFirebaseUsers(...uids: string[]): Promise<void>
  setTestUsers(...users: TestUserInput[]): Promise<User[]>
  deleteTestUsers(...uids: string[]): Promise<void>
}

interface TestAuthToken {
  uid: string
  email?: string
  email_verified?: boolean
  isAppAdmin: boolean
  authStatus: AuthStatus
}

interface PutTestStoreDataInput {
  collectionName: string
  collectionRecords: any[]
}

interface PutTestIndexDataInput {
  index: string
  data: any[]
}

interface TestUploadFileItem {
  id: string
  path: string
  contentType: string
  data: string | Blob | Uint8Array | ArrayBuffer | File
}

interface TestFirebaseUserInput extends UserClaims {
  uid: string
  email?: string
  emailVerified?: boolean
  password?: string
  disabled?: boolean
}

namespace TestFirebaseUserInput {
  export function squeeze<T extends TestFirebaseUserInput | undefined>(input?: TestFirebaseUserInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['uid', 'email', 'emailVerified', 'password', 'disabled', 'isAppAdmin', 'authStatus']) as T
  }
}

interface TestUserInput extends TestFirebaseUserInput, UserInput {}

namespace TestUserInput {
  export function squeeze<T extends TestUserInput | undefined>(input?: TestUserInput): T {
    if (!input) return undefined as T
    return pickProps(input, [
      'uid',
      'email',
      'emailVerified',
      'password',
      'disabled',
      'isAppAdmin',
      'authStatus',
      'userName',
      'fullName',
      'photoURL',
    ]) as T
  }
}

type APIContainerImpl = ReturnType<typeof APIContainer['newRawInstance']>

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TestAPIContainer {
  export function newInstance(): TestAPIContainer {
    const apis = APIContainer.newRawInstance()
    return mix(apis)
  }

  export function mix<T extends APIContainerImpl>(apis: T): TestAPIContainer & T {
    const config = useConfig()
    const clientDev = GQLAPIClient.newInstance('dev')

    const setTestAuthToken: TestAPIContainer['setTestAuthToken'] = token => {
      const tokenString = token ? JSON.stringify(token) : undefined
      _setTestAuthToken(tokenString)
    }

    const putTestStoreData: TestAPIContainer['putTestStoreData'] = async inputs => {
      await clientDev.mutate<{ putTestStoreData: boolean }>({
        mutation: gql`
          mutation PutTestStoreData($inputs: [PutTestStoreDataInput!]!) {
            putTestStoreData(inputs: $inputs)
          }
        `,
        variables: { inputs },
      })
    }

    const putTestIndexData: TestAPIContainer['putTestIndexData'] = async input => {
      await clientDev.mutate<{ putTestIndexData: boolean }>({
        mutation: gql`
          mutation PutTestIndexData($input: PutTestIndexDataInput!) {
            putTestIndexData(input: $input)
          }
        `,
        variables: { input },
      })
    }

    const uploadTestFiles: TestAPIContainer['uploadTestFiles'] = async uploadList => {
      const tokenBackup = await _getTestAuthToken()
      setTestAuthToken(AppAdminToken())

      const _uploadList = uploadList.map(item => ({ ...item, signedUploadUrl: '' }))

      const signedUploadUrls = await apis.getSignedUploadUrls(_uploadList)
      signedUploadUrls.forEach((url, index) => {
        _uploadList[index].signedUploadUrl = url
      })

      for (const uploadItem of _uploadList) {
        const data = await readAsArrayBuffer(uploadItem.data)
        await axios.request({
          url: uploadItem.signedUploadUrl,
          method: 'put',
          data,
          headers: {
            'content-type': 'application/octet-stream',
          },
        })
        await apis.handleUploadedFile({ id: uploadItem.id, path: uploadItem.path })
      }

      _setTestAuthToken(tokenBackup)
    }

    const uploadTestHierarchyFiles: TestAPIContainer['uploadTestHierarchyFiles'] = async uploadList => {
      const tokenBackup = await _getTestAuthToken()
      setTestAuthToken(AppAdminToken())

      for (const uploadItem of uploadList) {
        const parentPath = removeStartDirChars(path.dirname(uploadItem.path))
        await apis.createStorageHierarchicalDirs([parentPath])
      }

      await uploadTestFiles(uploadList)

      _setTestAuthToken(tokenBackup)
    }

    const uploadTestUserFiles: TestAPIContainer['uploadTestUserFiles'] = async (user, uploadList) => {
      await uploadTestHierarchyFiles(
        uploadList.map(uploadItem => {
          uploadItem.path = path.join(toUserStorageBasePath(user), uploadItem.path)
          return uploadItem
        })
      )
    }

    const removeTestDir: TestAPIContainer['removeTestDir'] = async dirPaths => {
      const tokenBackup = await _getTestAuthToken()
      setTestAuthToken(AppAdminToken())

      for (const dirPath of dirPaths) {
        await apis.removeStorageDir(dirPath)
      }

      _setTestAuthToken(tokenBackup)
    }

    const removeTestUserDir: TestAPIContainer['removeTestUserDir'] = async user => {
      const tokenBackup = await _getTestAuthToken()
      setTestAuthToken(AppAdminToken())

      await removeTestDir([toUserStorageBasePath(user)])

      _setTestAuthToken(tokenBackup)
    }

    const removeTestUserDirs: TestAPIContainer['removeTestUserDirs'] = async (user, dirPaths) => {
      await removeTestDir(
        dirPaths.map(dirPath => {
          return path.join(toUserStorageBasePath(user), dirPath)
        })
      )
    }

    const removeTestFiles: TestAPIContainer['removeTestFiles'] = async filePaths => {
      const tokenBackup = await _getTestAuthToken()
      setTestAuthToken(AppAdminToken())

      for (const filePath of filePaths) {
        await apis.removeStorageFile(filePath)
      }

      _setTestAuthToken(tokenBackup)
    }

    const removeTestUserFiles: TestAPIContainer['removeTestUserFiles'] = async (user, filePaths) => {
      await removeTestFiles(
        filePaths.map(filePath => {
          return path.join(toUserStorageBasePath(user), filePath)
        })
      )
    }

    const setTestFirebaseUsers: TestAPIContainer['setTestFirebaseUsers'] = async (...users: TestFirebaseUserInput[]) => {
      await clientDev.mutate<{ setTestFirebaseUsers: boolean }>({
        mutation: gql`
          mutation SetTestFirebaseUsers($users: [TestFirebaseUserInput!]!) {
            setTestFirebaseUsers(users: $users)
          }
        `,
        variables: { users: users.map(user => TestFirebaseUserInput.squeeze(user)) },
      })
    }

    const deleteTestFirebaseUsers: TestAPIContainer['deleteTestFirebaseUsers'] = async uids => {
      await clientDev.mutate<{ deleteTestFirebaseUsers: boolean }>({
        mutation: gql`
          mutation DeleteTestFirebaseUsers($uids: [String!]!) {
            deleteTestFirebaseUsers(uids: $uids)
          }
        `,
        variables: { uids },
      })
    }

    const setTestUsers: TestAPIContainer['setTestUsers'] = async (...users: TestUserInput[]) => {
      const response = await clientDev.mutate<{ setTestUsers: RawEntity<User>[] }>({
        mutation: gql`
          mutation SetTestUsers($users: [TestUserInput!]!) {
            setTestUsers(users: $users) {
              id
              email
              emailVerified
              userName
              fullName
              isAppAdmin
              photoURL
              version
              createdAt
              updatedAt
            }
          }
        `,
        variables: { users: users.map(user => TestUserInput.squeeze(user)) },
      })

      const testUsers = response.data!.setTestUsers
      return toEntities(testUsers)
    }

    const deleteTestUsers: TestAPIContainer['deleteTestUsers'] = async uids => {
      await clientDev.mutate<{ deleteTestUsers: boolean }>({
        mutation: gql`
          mutation DeleteTestUsers($uids: [String!]!) {
            deleteTestUsers(uids: $uids)
          }
        `,
        variables: { uids },
      })
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    function _setTestAuthToken(token: string | undefined): void {
      td.replace(require('@/app/services/base'), 'getIdToken', () => token)
      td.replace(require('@/app/services/base'), 'sgetIdToken', () => token)
    }

    async function _getTestAuthToken(): Promise<string | undefined> {
      let idToken: string | undefined
      try {
        idToken = await require('@/app/services/base').getIdToken()
      } catch {}
      return idToken
    }

    function toUserStorageBasePath(user: TestAuthToken): string {
      return path.join(config.storage.user.rootName, user.uid)
    }

    function readAsArrayBuffer(fileData: string | Blob | Uint8Array | ArrayBuffer | File): Promise<ArrayBuffer> {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        if (typeof fileData === 'string') {
          const enc = new TextEncoder()
          resolve(enc.encode(fileData))
        } else if (fileData instanceof Blob) {
          const reader = new FileReader()
          reader.onload = () => {
            resolve(reader.result as ArrayBuffer)
          }
          reader.onerror = err => {
            reject(err)
          }
          reader.readAsArrayBuffer(fileData)
        } else {
          resolve(fileData)
        }
      })
    }

    return {
      ...apis,
      setTestAuthToken,
      putTestStoreData,
      putTestIndexData,
      uploadTestFiles,
      uploadTestHierarchyFiles,
      uploadTestUserFiles,
      removeTestDir,
      removeTestUserDir,
      removeTestUserDirs,
      removeTestFiles,
      removeTestUserFiles,
      setTestFirebaseUsers,
      deleteTestFirebaseUsers,
      setTestUsers,
      deleteTestUsers,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { PutTestStoreDataInput, TestAPIContainer, TestAuthToken, TestFirebaseUserInput, TestUserInput, TestUploadFileItem }
