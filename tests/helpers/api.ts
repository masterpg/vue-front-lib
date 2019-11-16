import { BaseAPIContainer, BaseGQLAPIContainer } from '@/lib'
import { Constructor } from 'web-base-lib'
import axios from 'axios'
import gql from 'graphql-tag'

export interface AuthUser {
  uid: string
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

export interface TestAPIContainer extends BaseAPIContainer {
  setTestAuthUser(user: AuthUser): void
  clearTestAuthUser(): void
  putTestData(inputs: CollectionData[]): Promise<void>
  uploadTestFiles(uploadList: UploadFileItem[])
  removeTestStorageFiles(filePaths: string[]): Promise<boolean>
  removeTestStorageDir(dirPath: string): Promise<boolean>
}

export function TestGQLAPIContainerMixin(superclass: Constructor<BaseGQLAPIContainer>): Constructor<TestAPIContainer> {
  return class extends superclass implements TestAPIContainer {
    private m_user?: AuthUser

    setTestAuthUser(user: AuthUser): void {
      this.m_user = user
    }

    clearTestAuthUser(): void {
      this.m_user = undefined
    }

    protected async getIdToken(): Promise<string> {
      if (this.m_user) {
        return JSON.stringify(this.m_user)
      }
      return ''
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

    async uploadTestFiles(uploadList: UploadFileItem[]) {
      const readAsArrayBuffer = (fileData: string | Blob | Uint8Array | ArrayBuffer | File) => {
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

      const _uploadList = uploadList as (UploadFileItem & { signedUploadUrl: string })[]

      const inputs = _uploadList.map(item => {
        return { filePath: item.filePath, contentType: item.contentType }
      })
      const signedUploadUrls = await (async () => {
        const response = await this.query<{ testSignedUploadUrls: string[] }>({
          query: gql`
            query GetTestSignedUploadUrls($inputs: [TestSignedUploadUrlInput!]!) {
              testSignedUploadUrls(inputs: $inputs)
            }
          `,
          variables: { inputs },
        })
        return response.data.testSignedUploadUrls
      })()

      signedUploadUrls.forEach((url, index) => {
        _uploadList[index].signedUploadUrl = url
      })

      const promises: Promise<void>[] = []
      for (const uploadItem of _uploadList) {
        promises.push(
          (async () => {
            const data = await readAsArrayBuffer(uploadItem.fileData)
            await axios.request({
              url: uploadItem.signedUploadUrl,
              method: 'put',
              data,
              headers: {
                'content-type': 'application/octet-stream',
              },
            })
          })()
        )
      }
      await Promise.all(promises)
    }

    async removeTestStorageFiles(filePaths: string[]): Promise<boolean> {
      const response = await this.mutate<{ removeTestStorageFiles: boolean }>({
        mutation: gql`
          mutation RemoveTestStorageFiles($filePaths: [String!]!) {
            removeTestStorageFiles(filePaths: $filePaths)
          }
        `,
        variables: { filePaths },
      })
      return response.data!.removeTestStorageFiles
    }

    async removeTestStorageDir(dirPath: string): Promise<boolean> {
      const response = await this.mutate<{ removeTestStorageDir: boolean }>({
        mutation: gql`
          mutation RemoveTestStorageDir($dirPath: String!) {
            removeTestStorageDir(dirPath: $dirPath)
          }
        `,
        variables: { dirPath },
      })
      return response.data!.removeTestStorageDir
    }
  }
}
