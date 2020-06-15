import * as _path from 'path'
import { StorageFileUploader, StorageUploader } from '../upload'
import { config } from '../../../../config'
import { store } from '../../../store'

export class UserStorageUploader extends StorageUploader {
  protected async verifyExecutable(): Promise<void> {}

  protected createUploadingFiles(files: File[]): StorageFileUploader[] {
    const basePath = _path.join(config.storage.usersDir, store.user.id)

    const result: StorageFileUploader[] = []
    for (const file of files) {
      const fileUploader = new StorageFileUploader({
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
