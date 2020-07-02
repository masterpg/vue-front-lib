import * as path from 'path'
import { AuthStatus, BaseGQLAPIContainer, LibAPIContainer, RawUser, UserClaims, UserInfo, UserInfoInput } from '@/lib'
import { Constructor } from 'web-base-lib'
import axios from 'axios'
import { config } from '@/lib/config'
import gql from 'graphql-tag'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestAuthUser {
  uid: string
  authStatus: AuthStatus
  isAppAdmin?: boolean
}

interface CollectionData {
  collectionName: string
  collectionRecords: any[]
}

interface UploadFileItem {
  fileData: string | Blob | Uint8Array | ArrayBuffer | File
  filePath: string
  contentType: string
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

interface TestAPIContainer extends LibAPIContainer {
  setTestAuthToken(token: TestAuthUser): void
  clearTestAuthUser(): void
  putTestStoreData(inputs: CollectionData[]): Promise<void>
  uploadTestUserFiles(user: TestAuthUser, uploadList: UploadFileItem[])
  uploadTestFiles(uploadList: UploadFileItem[])
  removeTestUserDir(user: TestAuthUser): Promise<void>
  removeTestUserDirs(user: TestAuthUser, dirPaths: string[]): Promise<void>
  removeTestUserFiles(user: TestAuthUser, filePaths: string[]): Promise<void>
  removeTestDir(dirPaths: string[]): Promise<void>
  removeTestFiles(filePaths: string[]): Promise<void>
  setTestFirebaseUsers(...users: TestFirebaseUserInput[]): Promise<void>
  deleteTestFirebaseUsers(...uids: string[]): Promise<void>
  setTestUsers(...users: TestUserInput[]): Promise<UserInfo[]>
  deleteTestUsers(...uids: string[]): Promise<void>
}

//========================================================================
//
//  Implementation
//
//========================================================================

const TEMP_ADMIN_USER: TestAuthUser = {
  uid: 'temp.admin.user',
  authStatus: AuthStatus.Available,
  isAppAdmin: true,
}

function TestGQLAPIContainerMixin(superclass: Constructor<BaseGQLAPIContainer>): Constructor<TestAPIContainer> {
  return class extends superclass implements TestAPIContainer {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    protected async getIdToken(): Promise<string> {
      if (this.m_token) {
        return JSON.stringify(this.m_token)
      }
      return ''
    }

    private m_token?: TestAuthUser

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    setTestAuthToken(token: TestAuthUser): void {
      this.m_token = token
    }

    clearTestAuthUser(): void {
      this.m_token = undefined
    }

    async putTestStoreData(inputs: CollectionData[]): Promise<void> {
      await this.mutate<{ putTestStoreData: boolean }>({
        mutation: gql`
          mutation PutTestStoreData($inputs: [PutTestStoreDataInput!]!) {
            putTestStoreData(inputs: $inputs)
          }
        `,
        variables: { inputs },
      })
    }

    async uploadTestUserFiles(user: TestAuthUser, uploadList: UploadFileItem[]): Promise<void> {
      await this.uploadTestFiles(
        uploadList.map(uploadItem => {
          uploadItem.filePath = path.join(this.m_toUserStorageBasePath(user), uploadItem.filePath)
          return uploadItem
        })
      )
    }

    async uploadTestFiles(uploadList: UploadFileItem[]): Promise<void> {
      const userBackup = this.m_token
      this.m_token = TEMP_ADMIN_USER

      const _uploadList = uploadList as (UploadFileItem & { signedUploadUrl: string })[]

      const signedUploadUrls = await this.getSignedUploadUrls(
        _uploadList.map(item => {
          return { filePath: item.filePath, contentType: item.contentType }
        })
      )
      signedUploadUrls.forEach((url, index) => {
        _uploadList[index].signedUploadUrl = url
      })

      for (const uploadItem of _uploadList) {
        const data = await this.m_readAsArrayBuffer(uploadItem.fileData)
        await axios.request({
          url: uploadItem.signedUploadUrl,
          method: 'put',
          data,
          headers: {
            'content-type': 'application/octet-stream',
          },
        })
        await this.handleUploadedFile(uploadItem.filePath)
      }

      this.m_token = userBackup
    }

    async removeTestUserDir(user: TestAuthUser): Promise<void> {
      await this.removeTestDir([this.m_toUserStorageBasePath(user)])
    }

    async removeTestUserDirs(user: TestAuthUser, dirPaths: string[]): Promise<void> {
      await this.removeTestDir(
        dirPaths.map(dirPath => {
          return path.join(this.m_toUserStorageBasePath(user), dirPath)
        })
      )
    }

    async removeTestUserFiles(user: TestAuthUser, filePaths: string[]): Promise<void> {
      await this.removeTestFiles(
        filePaths.map(filePath => {
          return path.join(this.m_toUserStorageBasePath(user), filePath)
        })
      )
    }

    async removeTestDir(dirPaths: string[]): Promise<void> {
      const userBackup = this.m_token
      this.m_token = TEMP_ADMIN_USER

      for (const dirPath of dirPaths) {
        await this.callStoragePaginationAPI(this.removeStorageDir, null, dirPath)
      }

      this.m_token = userBackup
    }

    async removeTestFiles(filePaths: string[]): Promise<void> {
      const userBackup = this.m_token
      this.m_token = TEMP_ADMIN_USER

      for (const filePath of filePaths) {
        await this.removeStorageFile(filePath)
      }

      this.m_token = userBackup
    }

    async setTestFirebaseUsers(...users: TestFirebaseUserInput[]): Promise<void> {
      await this.mutate<{ setTestFirebaseUsers: boolean }>({
        mutation: gql`
          mutation SetTestFirebaseUsers($users: [TestFirebaseUserInput!]!) {
            setTestFirebaseUsers(users: $users)
          }
        `,
        variables: { users },
      })
    }

    async deleteTestFirebaseUsers(...uids: string[]): Promise<void> {
      await this.mutate<{ deleteTestFirebaseUsers: boolean }>({
        mutation: gql`
          mutation DeleteTestFirebaseUsers($uids: [String!]!) {
            deleteTestFirebaseUsers(uids: $uids)
          }
        `,
        variables: { uids },
      })
    }

    async setTestUsers(...users: TestUserInput[]): Promise<UserInfo[]> {
      const response = await this.mutate<{ setTestUsers: RawUser[] }>({
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
          ...this.toTimestampEntity(user),
          publicProfile: this.toTimestampEntity(user.publicProfile),
        }
      })
    }

    async deleteTestUsers(...uids: string[]): Promise<void> {
      await this.mutate<{ deleteTestUsers: boolean }>({
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

    private m_toUserStorageBasePath(user: TestAuthUser): string {
      return path.join(config.storage.usersDir, user.uid)
    }

    private m_readAsArrayBuffer(fileData: string | Blob | Uint8Array | ArrayBuffer | File): Promise<ArrayBuffer> {
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
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestAuthUser, CollectionData, TestAPIContainer, TestFirebaseUserInput, TestUserInput, TestGQLAPIContainerMixin, UploadFileItem }
