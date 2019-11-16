import { Dialog } from '../../../base/component'
import { Route } from 'vue-router'
import Vue from 'vue'
import { Watch } from 'vue-property-decorator'
import { router } from '../../../router'

/**
 * URLで表示するタイプのダイアログを管理するクラスです。
 * このタイプのダイアログを管理する必要がある場合、
 * 本クラスを継承し、必要な抽象メンバーを実装してください。
 */
export abstract class BaseHistoryDialogManager extends Vue {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  /**
   * 管理すべきダイアログを取得します。
   *
   * 実装例:
   * ```
   * protected get dialogs(): { [dialogName: string]: Dialog } {
   *   return {
   *     SampleOneDialog: this.$refs.sampleOneDialog as Dialog,
   *     SampleTwoDialog: this.$refs.sampleTwoDialog as Dialog,
   *   }
   * }
   * ```
   */
  protected abstract readonly dialogs: { [dialogName: string]: Dialog }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ダイアログを開きます。
   * @param dialogName ダイアログ名を指定。
   * @param dialogParams ダイアログに渡すパラメータを指定。
   */
  open<PARAMS>(dialogName: string, dialogParams?: PARAMS): void {
    router.addDialogInfoToURL(dialogName, dialogParams)
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * ルーターの遷移を監視し、遷移があった際にURLからダイアログ情報を取得。
   * ダイアログ情報が取得された場合はそのダイアログを開きます。
   * @param to
   * @param from
   */
  @Watch('$route')
  private m_$routeOnChange(to: Route, from: Route) {
    // URLからダイアログ情報を取得
    const info = router.getDialogInfo(to)
    if (!info) return

    // URLからダイアログ情報できた場合、対象ダイアログのインスタンスを取得
    const dialog = this.dialogs[info.dialogName]
    if (!dialog) {
      console.warn(`There is no dialog named ${info.dialogName}.`)
      return
    }

    // ダイアログを開く
    dialog.open(info.dialogParams).then(() => {
      router.removeDialogInfoFromURL()
    })
  }
}
