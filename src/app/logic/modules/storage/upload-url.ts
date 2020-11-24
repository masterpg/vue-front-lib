import { Ref, UnwrapRef, reactive } from '@vue/composition-api'
import { StorageFileUploader, StorageUploader, UploadFileParam } from '@/app/logic/modules/storage/upload'
import axios, { Canceler } from 'axios'
import { StorageLogic } from '@/app/logic/modules/storage/base'
import _path from 'path'
import { injectAPI } from '@/app/logic/api'
import { removeBothEndsSlash } from 'web-base-lib'

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageURLUploader {
  export function newInstance(storageLogic: StorageLogic, owner: Ref<Element | undefined>): StorageUploader {
    const base = StorageUploader.newRawInstance(storageLogic, owner)

    base.createUploadingFiles.value = files => {
      const result: UnwrapRef<StorageFileUploader>[] = []
      for (const file of files) {
        const fileUploader = reactive(
          StorageURLFileUploader.newInstance(storageLogic, {
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
  export function newInstance(storageLogic: StorageLogic, uploadParam: UploadFileParam): StorageFileUploader {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const base = StorageFileUploader.newRawInstance(storageLogic, uploadParam)
    const api = injectAPI()

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

      // アップロード先のURLを取得
      const signedUploadUrl = await getSignedUploadUrl()

      // アップロードデータを取得
      const fileData = await getFileData()

      // アップロード実行
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

      // ファイルアップロード後に必要な処理を実行
      try {
        await storageLogic.handleUploadedFile(base.path.value)
      } catch (err) {
        base.failed.value = true
        throw err
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
        let data: Blob | Uint8Array | ArrayBuffer | File
        if (typeof uploadParam.data === 'string') {
          data = new Blob([uploadParam.data])
        } else {
          data = uploadParam.data
        }

        if (data instanceof Blob) {
          const reader = new FileReader()
          reader.onload = () => {
            resolve(reader.result as ArrayBuffer)
          }
          reader.onerror = () => {
            reject(`Error occurred reading file: "${base.path.value}"`)
          }
          reader.readAsArrayBuffer(data)
        } else {
          resolve(data)
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
