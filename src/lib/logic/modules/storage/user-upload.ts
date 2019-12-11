import * as path from 'path'
import { StorageFileUploader, StorageUploadManager } from './base-upload'
import { Dialog } from 'quasar'
import { config } from '../../../config'
import { i18n } from '../../../i18n'
import { store } from '../../store'

export class UserStorageUploadManager extends StorageUploadManager {
  protected async verifyExecutable(): Promise<void> {
    if (!store.user.storageDir) {
      Dialog.create({
        title: String(i18n.t('common.systemError')),
        message: String(i18n.t('error.unexpected')),
      })
      throw new Error(`The user's "storageDir" could not be obtained.`)
    }
  }

  protected createUploadingFiles(files: File[]): StorageFileUploader[] {
    const userStorageDir = store.user.storageDir
    const basePath = path.join(config.storage.usersDir, userStorageDir)

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
}
