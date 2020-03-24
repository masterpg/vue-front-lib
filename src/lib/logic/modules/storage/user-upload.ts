import * as _path from 'path'
import { StorageFileUploader, StorageUploadManager } from './base-upload'
import { StorageNode, api } from '../../api'
import { Dialog } from 'quasar'
import { config } from '../../../config'
import { i18n } from '../../../i18n'
import { store } from '../../store'

export class UserStorageUploadManager extends StorageUploadManager {
  protected async verifyExecutable(): Promise<void> {
    if (!store.user.myDirName) {
      Dialog.create({
        title: String(i18n.t('common.systemError')),
        message: String(i18n.t('error.unexpected')),
      })
      throw new Error(`The user's 'myDirName' could not be obtained.`)
    }
  }

  protected createUploadingFiles(files: File[]): StorageFileUploader[] {
    const basePath = _path.join(config.storage.usersDir, store.user.myDirName)

    const result: StorageFileUploader[] = []
    for (const file of files) {
      const fileUploader = new StorageFileUploader({
        data: file,
        name: file.name,
        dirPath: this.getUploadDirPath(file),
        type: file.type,
        basePath,
      })
      result.push(fileUploader)
    }
    return result
  }

  protected async handleUploadedFiles(filePaths: string[]): Promise<void> {
    await api.handleUploadedUserFiles(filePaths)
  }
}
