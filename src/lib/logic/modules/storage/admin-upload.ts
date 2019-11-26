import { StorageFileUploader, StorageUploadManager, UploadFileParam } from './base'
import axios, { Canceler } from 'axios'
import { api } from '../../api'

export class AdminStorageUploadManager extends StorageUploadManager {
  protected createUploadingFiles(files: File[]): StorageFileUploader[] {
    const result: StorageFileUploader[] = []
    for (const file of files) {
      result.push(
        new AdminStorageFileUploader({
          data: file,
          name: file.name,
          dirPath: this.getUploadDirPath(file),
          type: file.type,
        })
      )
    }
    return result
  }

  protected async beforeUpload(): Promise<void> {
    const inputs: { filePath: string; contentType: string }[] = []
    for (const uploadingFile of this.uploadingFiles) {
      inputs.push({
        filePath: uploadingFile.path,
        contentType: uploadingFile.type,
      })
    }
    const signedUploadUrls = await api.getSignedUploadUrls(inputs)

    for (let i = 0; i < this.uploadingFiles.length; i++) {
      const uploadingFile = this.uploadingFiles[i] as AdminStorageFileUploader
      uploadingFile.signedUploadUrl = signedUploadUrls[i]
    }
  }
}

class AdminStorageFileUploader extends StorageFileUploader {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(uploadParam: UploadFileParam, signedUploadUrl: string = '') {
    super(uploadParam)
    this.signedUploadUrl = signedUploadUrl
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_uploadedSize: number = 0

  get uploadedSize(): number {
    return this.m_uploadedSize
  }

  private m_progress: number = 0

  get progress(): number {
    return this.m_progress
  }

  private m_completed: boolean = false

  get completed(): boolean {
    return this.m_completed
  }

  private m_failed: boolean = false

  get failed(): boolean {
    return this.m_failed
  }

  private m_canceled: boolean = false

  get canceled(): boolean {
    return this.m_canceled
  }

  get ended(): boolean {
    return this.completed || this.failed || this.canceled
  }

  signedUploadUrl: string = ''

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  cancelRequest: Canceler = () => {}

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  execute(): Promise<void> {
    if (this.canceled) {
      return Promise.resolve()
    }
    if (!this.signedUploadUrl) {
      return Promise.reject(`"signedUploadUrl" is not set.`)
    }

    return new Promise<ArrayBuffer>((resolve, reject) => {
      if (this.uploadParam.data instanceof Blob) {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(reader.result as ArrayBuffer)
        }
        reader.onerror = () => {
          reject(`Error occurred reading file: "${this.path}"`)
        }
        reader.readAsArrayBuffer(this.uploadParam.data)
      } else {
        resolve(this.uploadParam.data)
      }
    })
      .then(data => {
        return axios.request({
          url: this.signedUploadUrl,
          method: 'put',
          data,
          headers: {
            'content-type': 'application/octet-stream',
          },
          onUploadProgress: progressEvent => {
            const { loaded, total } = progressEvent
            this.m_uploadedSize = loaded
            this.m_progress = loaded / total
          },
          cancelToken: new axios.CancelToken(c => {
            this.cancelRequest = c
          }),
        })
      })
      .then(() => {
        this.m_completed = true
      })
      .catch(err => {
        if (!this.canceled) {
          this.m_failed = true
          throw err
        }
      })
  }

  cancel(): void {
    this.cancelRequest()
    this.m_canceled = true
  }
}
