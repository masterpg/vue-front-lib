<script lang="ts">
import { Img, ImgTemplate } from '@/app/components/img'
import axios, { Canceler } from 'axios'
import { defineComponent } from '@vue/composition-api'

interface StorageImg extends StorageImg.Props {}

namespace StorageImg {
  export interface Props extends Img.Props {
    autoSpinner: boolean
  }

  export const clazz = defineComponent({
    name: 'StorageImg',

    mixins: [ImgTemplate],

    props: {
      ...Img.props,
      autoSpinner: { type: Boolean, default: false },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const base = Img.setup(props, ctx)

      let cancelRequest: Canceler = () => {}

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      base.srcChanged.value = async (newValue: string, oldValue?: string) => {
        await base.srcChanged.super(newValue, oldValue)

        // 既にロード中の画像がある場合があるのでそれはキャンセル
        cancelRequest()

        // リクエスト用の認証ヘッダを取得
        const authHeader = await getAuthHeader()

        const response = await axios.request({
          url: newValue,
          method: 'get',
          responseType: 'blob',
          headers: { ...authHeader },
          cancelToken: new axios.CancelToken(c => {
            cancelRequest = c
          }),
        })

        base.img.value!.src = window.URL.createObjectURL(response.data)
      }

      /**
       * リクエスト用の認証ヘッダを取得します。
       */
      async function getAuthHeader(): Promise<{ Authorization?: string }> {
        // eslint-disable-next-line no-undef
        const currentUser = firebase.auth().currentUser
        if (!currentUser) return {}

        const idToken = await currentUser.getIdToken()
        if (!idToken) return {}

        return {
          Authorization: `Bearer ${idToken}`,
        }
      }

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
