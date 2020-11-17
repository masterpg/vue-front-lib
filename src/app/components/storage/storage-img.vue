<script lang="ts">
import { Img, ImgTemplate } from '@/app/components/img'
import axios, { AxiosResponse, Canceler } from 'axios'
import { defineComponent, watch } from '@vue/composition-api'
import { StorageLogic } from '@/app/logic/modules/storage'
import { getIdToken } from '@/app/logic'

interface StorageImg extends StorageImg.Props {}

namespace StorageImg {
  export interface Props extends Img.Props {
    nodeId: string
    autoSpinner: boolean
  }

  export const clazz = defineComponent({
    name: 'StorageImg',

    mixins: [ImgTemplate],

    props: {
      ...Img.props,
      nodeId: { type: String, default: '' },
      autoSpinner: { type: Boolean, default: false },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const base = Img.setup(props, ctx)

      let canceler: Canceler | null = null

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      base.srcChanged.value = async (newValue: string, oldValue?: string) => {
        cancel()
        base.beforeLoad(newValue)
        if (newValue) {
          const response = await load(newValue)
          base.inputSrc.value = window.URL.createObjectURL(response.data)
        } else {
          base.inputSrc.value = ''
        }
      }

      async function nodeIdChanged(newValue: string, oldValue?: string): Promise<void> {
        cancel()
        base.beforeLoad(newValue)
        if (newValue) {
          const response = await load(StorageLogic.getNodeURL(newValue))
          base.inputSrc.value = window.URL.createObjectURL(response.data)
        } else {
          base.inputSrc.value = ''
        }
      }

      /**
       * 指定されたURLの画像をBLOB形式でロードします。
       * @param src
       */
      async function load(src: string): Promise<AxiosResponse> {
        // リクエスト用の認証ヘッダを取得
        const authHeader = await getAuthHeader()

        return await axios.request({
          url: src,
          method: 'get',
          responseType: 'blob',
          headers: { ...authHeader },
          cancelToken: new axios.CancelToken(c => {
            canceler = c
          }),
        })
      }

      /**
       * ロード中の画像がある場合はキャンセルを行います。
       */
      function cancel(): void {
        canceler && canceler()
        canceler = null
      }

      /**
       * リクエスト用の認証ヘッダを取得します。
       */
      async function getAuthHeader(): Promise<{ Authorization?: string }> {
        const idToken = await getIdToken()
        if (!idToken) return {}

        return {
          Authorization: `Bearer ${idToken}`,
        }
      }

      //----------------------------------------------------------------------
      //
      //  Event handlers
      //
      //----------------------------------------------------------------------

      watch(
        () => props.nodeId,
        (newValue: string, oldValue?: string) => {
          nodeIdChanged(newValue, oldValue)
        }
      )

      //----------------------------------------------------------------------
      //
      //  Return
      //
      //----------------------------------------------------------------------

      return {
        ...base,
      }
    },
  })
}

export default StorageImg.clazz
export { StorageImg }
</script>
