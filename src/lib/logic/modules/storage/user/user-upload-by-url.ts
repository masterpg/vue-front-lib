import * as _path from 'path'
import { StorageFileUploader, StorageUploader, UploadFileParam } from '../upload'
import axios, { Canceler } from 'axios'
import { Dialog } from 'quasar'
import { api } from '../../../api'
import { config } from '../../../../config'
import { i18n } from '../../../../i18n'
import { store } from '../../../store'

export class UserStorageUrlUploadManager extends StorageUploader {
  protected async verifyExecutable(): Promise<void> {
    if (!store.user.myDirName) {
      Dialog.create({
        title: String(i18n.t('common.systemError')),
        message: String(i18n.t('error.unexpected')),
      })
      throw new Error(`User's 'myDirName' could not be obtained.`)
    }
  }

  protected createUploadingFiles(files: File[]): StorageFileUploader[] {
    const userStorageDir = store.user.myDirName
    const basePath = _path.join(config.storage.usersDir, userStorageDir)

    const result: StorageFileUploader[] = []
    for (const file of files) {
      const fileUploader = new UserStorageUrlFileUploader({
        data: file,
        name: file.name,
        dir: this.getUploadDirPath(file),
        type: file.type,
        basePath,
      })
      result.push(fileUploader)
    }
    return result
  }
}

class UserStorageUrlFileUploader extends StorageFileUploader {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(uploadParam: UploadFileParam) {
    super(uploadParam)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_cancelRequest: Canceler = () => {}

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async execute(): Promise<void> {
    if (this.canceled) {
      return
    }

    const signedUploadUrl = await this.m_getSignedUploadUrl()
    const fileData = await this.m_getFileData()

    try {
      await axios.request({
        url: signedUploadUrl,
        method: 'put',
        data: fileData,
        headers: {
          'content-type': 'application/octet-stream',
        },
        onUploadProgress: progressEvent => {
          const { loaded, total } = progressEvent
          this.setUploadedSize(loaded)
          this.setProgress(loaded / total)
        },
        cancelToken: new axios.CancelToken(c => {
          this.m_cancelRequest = c
        }),
      })
    } catch (err) {
      if (!this.canceled) {
        this.setFailed(true)
        throw err
      }
      return
    }

    this.setCompleted(true)
  }

  cancel(): void {
    this.m_cancelRequest()
    this.setCanceled(true)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_getFileData(): Promise<ArrayBuffer> {
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
  }

  private async m_getSignedUploadUrl(): Promise<string> {
    const params = [
      {
        filePath: _path.join(this.uploadParam.basePath || '', this.path),
        contentType: this.uploadParam.type,
      },
    ]
    return (await api.getSignedUploadUrls(params))[0]
  }
}
