import * as path from 'path'
import { BaseGQLAPIContainer, LibAPIContainer } from '@/lib'
import { Constructor } from 'web-base-lib'
import axios from 'axios'
import { config } from '@/lib/config'
import gql from 'graphql-tag'

//========================================================================
//
//  TestGQLAPIContainerMixin
//
//========================================================================

export interface AuthUser {
  uid: string
  myDirName: string
  email?: string
  isAppAdmin?: boolean
}

export interface CollectionData {
  collectionName: string
  collectionRecords: any[]
}

export interface UploadFileItem {
  fileData: string | Blob | Uint8Array | ArrayBuffer | File
  filePath: string
  contentType: string
}

export interface TestAPIContainer extends LibAPIContainer {
  setTestAuthUser(user: AuthUser): void
  clearTestAuthUser(): void
  putTestData(inputs: CollectionData[]): Promise<void>
  uploadUserTestFiles(user: AuthUser, uploadList: UploadFileItem[])
  uploadTestFiles(uploadList: UploadFileItem[])
  removeUserBaseTestDir(user: AuthUser): Promise<void>
  removeUserTestDir(user: AuthUser, dirPaths: string[]): Promise<void>
  removeUserTestFiles(user: AuthUser, filePaths: string[]): Promise<void>
  removeTestDir(dirPaths: string[]): Promise<void>
  removeTestFiles(filePaths: string[]): Promise<void>
}

const TEMP_ADMIN_USER = { uid: 'temp.admin.user', myDirName: 'temp.admin.user', isAppAdmin: true }

export function TestGQLAPIContainerMixin(superclass: Constructor<BaseGQLAPIContainer>): Constructor<TestAPIContainer> {
  return class extends superclass implements TestAPIContainer {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    protected async getIdToken(): Promise<string> {
      if (this.m_user) {
        return JSON.stringify(this.m_user)
      }
      return ''
    }

    private m_user?: AuthUser

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    setTestAuthUser(user: AuthUser): void {
      this.m_user = user
    }

    clearTestAuthUser(): void {
      this.m_user = undefined
    }

    async putTestData(inputs: CollectionData[]): Promise<void> {
      await this.mutate<{ data: boolean }>({
        mutation: gql`
          mutation PutTestData($inputs: [PutTestDataInput!]!) {
            putTestData(inputs: $inputs)
          }
        `,
        variables: { inputs },
      })
    }

    async uploadUserTestFiles(user: AuthUser, uploadList: UploadFileItem[]): Promise<void> {
      await this.uploadTestFiles(
        uploadList.map(uploadItem => {
          uploadItem.filePath = path.join(this.m_toUserStorageBasePath(user), uploadItem.filePath)
          return uploadItem
        })
      )
    }

    async uploadTestFiles(uploadList: UploadFileItem[]): Promise<void> {
      const userBackup = this.m_user
      this.m_user = TEMP_ADMIN_USER

      const _uploadList = uploadList as (UploadFileItem & { signedUploadUrl: string })[]

      const signedUploadUrls = await this.getSignedUploadUrls(
        _uploadList.map(item => {
          return { filePath: item.filePath, contentType: item.contentType }
        })
      )
      signedUploadUrls.forEach((url, index) => {
        _uploadList[index].signedUploadUrl = url
      })

      await Promise.all(
        _uploadList.map(async uploadItem => {
          const data = await this.m_readAsArrayBuffer(uploadItem.fileData)
          await axios.request({
            url: uploadItem.signedUploadUrl,
            method: 'put',
            data,
            headers: {
              'content-type': 'application/octet-stream',
            },
          })
        })
      )

      await this.handleUploadedFiles(_uploadList.map(uploadItem => uploadItem.filePath))

      this.m_user = userBackup
    }

    async removeUserBaseTestDir(user: AuthUser): Promise<void> {
      await this.removeTestDir([this.m_toUserStorageBasePath(user)])
    }

    async removeUserTestDir(user: AuthUser, dirPaths: string[]): Promise<void> {
      await this.removeTestDir(
        dirPaths.map(dirPath => {
          return path.join(this.m_toUserStorageBasePath(user), dirPath)
        })
      )
    }

    async removeUserTestFiles(user: AuthUser, filePaths: string[]): Promise<void> {
      await this.removeTestFiles(
        filePaths.map(filePath => {
          return path.join(this.m_toUserStorageBasePath(user), filePath)
        })
      )
    }

    async removeTestDir(dirPaths: string[]): Promise<void> {
      const userBackup = this.m_user
      this.m_user = TEMP_ADMIN_USER

      await this.removeStorageDirs(dirPaths)

      this.m_user = userBackup
    }

    async removeTestFiles(filePaths: string[]): Promise<void> {
      const userBackup = this.m_user
      this.m_user = TEMP_ADMIN_USER

      await this.removeStorageFiles(filePaths)

      this.m_user = userBackup
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    private m_toUserStorageBasePath(user: AuthUser): string {
      return path.join(config.storage.usersDir, user.myDirName)
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
