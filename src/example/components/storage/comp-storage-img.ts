import { Component, Prop } from 'vue-property-decorator'
import axios, { Canceler } from 'axios'
import CompImg from '@/example/components/img/comp-img.vue'

@Component
export default class CompStorageImg extends CompImg {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ default: false })
  autoSpinner!: boolean

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_cancelRequest: Canceler = () => {}

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected async srcChanged(newValue: string, oldValue?: string) {
    this.img.style.opacity = '0'
    if (this.src) {
      this.spinner(true)
    } else {
      this.spinner(false)
    }

    // 現在の画像のサイズを一旦固定
    // ※画像切り替わり時のガタつき回避のため
    const imgStyle = getComputedStyle(this.img)
    this.img.style.width = imgStyle.width
    this.img.style.height = imgStyle.height

    // 画像ロード処理
    {
      // 既にロード中の画像がある場合があるのでそれはキャンセル
      this.m_cancelRequest()

      // リクエスト用の認証ヘッダを取得
      const authHeader = await this.m_getAuthHeader()

      const response = await axios.request({
        url: newValue,
        method: 'get',
        responseType: 'blob',
        headers: { ...authHeader },
        cancelToken: new axios.CancelToken(c => {
          this.m_cancelRequest = c
        }),
      })

      this.img.src = window.URL.createObjectURL(response.data)
    }
  }

  /**
   * リクエスト用の認証ヘッダを取得します。
   */
  private async m_getAuthHeader(): Promise<{ Authorization?: string }> {
    const currentUser = firebase.auth().currentUser
    if (!currentUser) return {}

    const idToken = await currentUser.getIdToken()
    if (!idToken) return {}

    return {
      Authorization: `Bearer ${idToken}`,
    }
  }
}
