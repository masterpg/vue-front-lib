import { AuthStatus, UserClaims, UserInfo, UserInfoInput } from '@/app/logic'
import { APIContainer } from '@/app/logic/api'
import { AppAdminToken } from '../data'
import { GQLAPIClient } from '@/app/logic/api/gql/client'
import { RawUser } from '@/app/logic/api/gql'
import axios from 'axios'
import gql from 'graphql-tag'
import path from 'path'
import { removeStartDirChars } from 'web-base-lib'
import { toEntity } from '@/app/logic/api/base'
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
  uploadTestUserFiles(user: TestAuthToken, uploadList: TestUploadFileItem[]): Promise<void>
  removeTestDir(dirPaths: string[]): Promise<void>
  removeTestUserDir(user: TestAuthToken): Promise<void>
  removeTestUserDirs(user: TestAuthToken, dirPaths: string[]): Promise<void>
  removeTestFiles(filePaths: string[]): Promise<void>
  removeTestUserFiles(user: TestAuthToken, filePaths: string[]): Promise<void>
  setTestFirebaseUsers(...users: TestFirebaseUserInput[]): Promise<void>
  deleteTestFirebaseUsers(...uids: string[]): Promise<void>
  setTestUsers(...users: TestUserInput[]): Promise<UserInfo[]>
  deleteTestUsers(...uids: string[]): Promise<void>
}

interface TestAuthToken {
  uid: string
  authStatus: AuthStatus
  isAppAdmin?: boolean
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

interface TestFirebaseUserInput {
  uid: string
  email?: string
  emailVerified?: boolean
  password?: string
  displayName?: string
  disabled?: boolean
  photoURL?: string
  customClaims?: UserClaims
}

type TestUserInput = TestFirebaseUserInput & UserInfoInput

type APIContainerImpl = ReturnType<typeof APIContainer['newRawInstance']>

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TestAPIContainer {
  export function newInstance(): TestAPIContainer {
    const api = APIContainer.newRawInstance()
    return mix(api)
  }

  export function mix<T extends APIContainerImpl>(api: T): TestAPIContainer & T {
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

      const inputs = _uploadList.map(item => ({ id: item.id, path: item.path, contentType: item.contentType }))
      const signedUploadUrls = await api.getSignedUploadUrls(inputs)
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
        const parentPath = removeStartDirChars(path.dirname(uploadItem.path))
        await api.createStorageHierarchicalDirs([parentPath])
        await api.handleUploadedFile({ id: uploadItem.id, path: uploadItem.path })
      }

      _setTestAuthToken(tokenBackup)
    }

    const uploadTestUserFiles: TestAPIContainer['uploadTestUserFiles'] = async (user, uploadList) => {
      await uploadTestFiles(
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
        await api.removeStorageDir(dirPath)
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
        await api.removeStorageFile(filePath)
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

    const setTestFirebaseUsers: TestAPIContainer['setTestFirebaseUsers'] = async users => {
      await clientDev.mutate<{ setTestFirebaseUsers: boolean }>({
        mutation: gql`
          mutation SetTestFirebaseUsers($users: [TestFirebaseUserInput!]!) {
            setTestFirebaseUsers(users: $users)
          }
        `,
        variables: { users },
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

    const setTestUsers: TestAPIContainer['setTestUsers'] = async users => {
      const response = await clientDev.mutate<{ setTestUsers: RawUser[] }>({
        mutation: gql`
          mutation SetTestUsers($users: [TestUserInput!]!) {
            setTestUsers(users: $users) {
              id
              fullName
              email
              emailVerified
              isAppAdmin
              createdAt
              updatedAt
              publicProfile {
                id
                displayName
                photoURL
                createdAt
                updatedAt
              }
            }
          }
        `,
        variables: { users },
      })

      const testUsers = response.data!.setTestUsers
      return testUsers.map(user => {
        return {
          ...toEntity(user),
          publicProfile: toEntity(user.publicProfile),
        }
      })
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
      td.replace(require('@/app/logic/base'), 'getIdToken', () => token)
      td.replace(require('@/app/logic/base'), 'sgetIdToken', () => token)
    }

    async function _getTestAuthToken(): Promise<string | undefined> {
      let idToken: string | undefined
      try {
        idToken = await require('@/app/logic/base').getIdToken()
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
      ...api,
      setTestAuthToken,
      putTestStoreData,
      putTestIndexData,
      uploadTestFiles,
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
