import { StorageFileUploader, StorageUploadManager } from './base-upload'
import { Dialog } from 'quasar'
import { api } from '../../api'
import { i18n } from '../../../i18n'
import { store } from '../../store'

export class AppStorageUploadManager extends StorageUploadManager {
  protected async verifyExecutable(): Promise<void> {
    const isAppAdmin = await store.user.getIsAppAdmin()
    if (!isAppAdmin) {
      Dialog.create({
        title: String(i18n.t('common.systemError')),
        message: String(i18n.t('error.unexpected')),
      })
      throw new Error(`The user is not an application administrator.`)
    }
  }

  protected createUploadingFiles(files: File[]): StorageFileUploader[] {
    const result: StorageFileUploader[] = []
    for (const file of files) {
      const fileUploader = new StorageFileUploader({
        data: file,
        name: file.name,
        dirPath: this.getUploadDirPath(file),
        type: file.type,
      })
      result.push(fileUploader)
    }
    return result
  }

  protected async handleUploadedFiles(filePaths: string[]): Promise<void> {
    await api.handleUploadedFiles(filePaths)
  }
}
