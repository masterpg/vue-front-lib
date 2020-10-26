import { StorageFileUploader, StorageUploader, StorageUploaderDependency, UploadFileParam } from '@/app/logic/modules/storage/upload'
import { UnwrapRef, reactive } from '@vue/composition-api'
import axios, { Canceler } from 'axios'
import _path from 'path'
import { removeBothEndsSlash } from 'web-base-lib'

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageURLUploader {
  export function newInstance(dependency: StorageUploaderDependency, owner: Element): StorageUploader {
    const base = StorageUploader.newRawInstance(dependency, owner)

    base.createUploadingFiles.value = files => {
      const result: UnwrapRef<StorageFileUploader>[] = []
      for (const file of files) {
        const fileUploader = reactive(
          StorageURLFileUploader.newInstance(dependency, {
            data: file,
            name: file.name,
            dir: base.getUploadDirPath(file),
            contentType: file.type,
          })
        )
        result.push(fileUploader)
      }
      return result
    }

    return {
      ...base,
    }
  }
}

namespace StorageURLFileUploader {
  export function newInstance(dependency: StorageUploaderDependency, uploadParam: UploadFileParam): StorageFileUploader {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const base = StorageFileUploader.newRawInstance(dependency, uploadParam)
    const { api, storageLogic } = dependency

    let canceler: Canceler | null = null

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    base.execute.value = async () => {
      if (base.canceled.value) {
        return
      }

      const signedUploadUrl = await getSignedUploadUrl()
      const fileData = await getFileData()

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
            base.uploadedSize.value = loaded
            base.progress.value = loaded / total
          },
          cancelToken: new axios.CancelToken(c => {
            canceler = c
          }),
        })
      } catch (err) {
        if (!base.canceled.value) {
          base.failed.value = true
          throw err
        }
        return
      }

      base.completed.value = true
    }

    base.cancel.value = () => {
      canceler && canceler()
      base.canceled.value = true
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    async function getFileData(): Promise<ArrayBuffer> {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        if (uploadParam.data instanceof Blob) {
          const reader = new FileReader()
          reader.onload = () => {
            resolve(reader.result as ArrayBuffer)
          }
          reader.onerror = () => {
            reject(`Error occurred reading file: "${base.path.value}"`)
          }
          reader.readAsArrayBuffer(uploadParam.data)
        } else {
          resolve(uploadParam.data)
        }
      })
    }

    async function getSignedUploadUrl(): Promise<string> {
      const basePath = removeBothEndsSlash(storageLogic.basePath.value)
      const params = [
        {
          filePath: _path.join(basePath, base.path.value),
          contentType: uploadParam.contentType,
        },
      ]
      return (await api.getSignedUploadUrls(params))[0]
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageURLUploader }
