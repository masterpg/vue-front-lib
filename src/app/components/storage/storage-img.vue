<script lang="ts">
import { Img, ImgTemplate } from '@/app/components/img'
import { StorageUtil, getIdToken } from '@/app/service'
import axios, { AxiosResponse, Canceler } from 'axios'
import { defineComponent, onMounted, onUnmounted, ref, watch } from '@vue/composition-api'

interface StorageImg extends StorageImg.Props, Img {}

namespace StorageImg {
  export interface Props extends Img.Props {
    nodeId: string
    cache: { [src: string]: string } | null
  }

  export const clazz = defineComponent({
    name: 'StorageImg',

    mixins: [ImgTemplate],

    props: {
      ...Img.props,
      nodeId: { type: String, default: '' },
      cache: { type: Object, default: null },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        // nodeIdがバインディングではなく直打ちされた場合、
        // 直打ち分のnodeIdChanged()が呼び出されない挙動の対応
        props.nodeId && nodeIdChanged(props.nodeId)
      })

      onUnmounted(() => {
        // キャッシュが有効でない場合、オブジェクトURLをメモリから解放する
        if (!props.cache) {
          base.imgSrc.value && window.URL.revokeObjectURL(base.imgSrc.value)
        }
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const base = Img.setup(props, ctx)

      let canceler: Canceler | null = null

      // プロパティとして入力された画像ソース
      const inputSrc = ref('')

      //----------------------------------------------------------------------
      //
      //  Methods
      //
      //----------------------------------------------------------------------

      base.clear.value = () => {
        base.clear.super()
        ctx.emit('update:nodeId', '')
      }

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      async function nodeIdChanged(newValue: string, oldValue?: string): Promise<void> {
        await base.load()
      }

      base.load.value = async () => {
        // 画像の入力ソースを取得
        let src: string
        if (props.nodeId) {
          src = StorageUtil.getNodeURL(props.nodeId)
        } else {
          src = props.src
        }

        // 遅延ロードが有効な場合
        if (props.lazy) {
          // 次の条件が整っている場合のみ画像ロードが行われる
          // - 表示領域に本コンポーネントが表示されている
          // - 現画像の入力ソースとは別のソースが指定されている
          const doLoad = base.isAppeared.value && inputSrc.value !== src
          if (!doLoad) return
        }

        cancel()
        base.beforeLoad(src)

        // 画像の入力ソースを保存
        inputSrc.value = src

        // 画像の入力ソースが空の場合、画像をクリアして終了
        if (!inputSrc.value) {
          base.imgSrc.value = ''
          return
        }

        // キャッシュがある場合
        if (props.cache && props.cache[src]) {
          base.imgSrc.value = props.cache[src]
        }
        // キャッシュがない場合
        else {
          // リクエスト用の認証ヘッダを取得
          const authHeader = await getAuthHeader()

          // 画像データをサーバーから取得
          let response: AxiosResponse
          try {
            response = await axios.request({
              url: src,
              method: 'get',
              responseType: 'blob',
              headers: { ...authHeader },
              cancelToken: new axios.CancelToken(c => {
                canceler = c
              }),
            })
          } catch (err) {
            base.clearDisplay()
            return
          }

          // 取得した画像データからオブジェクトURLを生成
          base.imgSrc.value = window.URL.createObjectURL(response.data)
          // オブジェクトURLをキャッシュ
          props.cache && (props.cache[src] = base.imgSrc.value)
        }
      }

      base.clearDisplay.value = () => {
        base.clearDisplay.super()
        inputSrc.value = ''
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

      watch(
        () => base.imgSrc.value,
        (newValue: string, oldValue?: string) => {
          // キャッシュが有効でない場合、前のオブジェクトURLをメモリから解放する
          if (!props.cache) {
            oldValue && window.URL.revokeObjectURL(oldValue)
          }
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
