<template>
  <div class="Dialogs">
    <MessageDialog ref="messageDialog" />
    <SignInDialog ref="signInDialog" />
    <SignUpDialog ref="signUpDialog" />
    <EmailChangeDialog ref="emailChangeDialog" />
    <UserDeleteDialog ref="userDeleteDialog" />
    <UserEntryDialog ref="userEntryDialog" />
  </div>
</template>

<script lang="ts">
import { EmailChangeDialog, SignInDialog, SignUpDialog, UserDeleteDialog, UserEntryDialog } from '@/app/dialogs/auth'
import { Ref, defineComponent, onMounted, ref, watch } from '@vue/composition-api'
import { Dialog } from '@/app/components/dialog'
import { MessageDialog } from '@/app/dialogs/message.vue'
import { Route } from 'vue-router'
import { VueRouter } from 'vue-router/types/router'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface Dialogs extends Dialogs.Props {
  getQuery(): { dialogName: DialogNames; dialogParams?: Record<string, unknown> } | undefined
  clearQuery(): void
  readonly message: { open: MessageDialog['open'] }
  readonly signIn: { open: SignInDialog['open'] }
  readonly signUp: { open: SignUpDialog['open'] }
  readonly emailChange: { open: SignUpDialog['open'] }
  readonly userDelete: { open: SignUpDialog['open'] }
  readonly userEntry: { open: UserEntryDialog['open'] }
}

type DialogNames = 'message' | 'signIn' | 'signUp' | 'emailChange' | 'userDelete' | 'userEntry'

//========================================================================
//
//  Implementation
//
//========================================================================

namespace Dialogs {
  export interface Props {}

  //--------------------------------------------------
  //  Component definition
  //--------------------------------------------------

  export const clazz = defineComponent({
    name: 'Dialogs',

    components: {
      MessageDialog: MessageDialog.clazz,
      SignInDialog: SignInDialog.clazz,
      SignUpDialog: SignUpDialog.clazz,
      EmailChangeDialog: EmailChangeDialog.clazz,
      UserDeleteDialog: UserDeleteDialog.clazz,
      UserEntryDialog: UserEntryDialog.clazz,
    },

    setup: (props: Readonly<Props>, ctx) => {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        openDialogByCurrentRoute()
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const router: VueRouter = ctx.root.$router

      const messageDialog = ref() as Ref<MessageDialog>
      const signInDialog = ref() as Ref<SignInDialog>
      const signUpDialog = ref() as Ref<SignUpDialog>
      const emailChangeDialog = ref() as Ref<EmailChangeDialog>
      const userDeleteDialog = ref() as Ref<UserDeleteDialog>
      const userEntryDialog = ref() as Ref<UserEntryDialog>

      const dialogs: { [name: string]: Ref<Dialog<any, any>> } = {
        message: messageDialog,
        signIn: signInDialog,
        signUp: signUpDialog,
        emailChange: emailChangeDialog,
        userDelete: userDeleteDialog,
        userEntry: userEntryDialog,
      }

      //----------------------------------------------------------------------
      //
      //  Methods
      //
      //----------------------------------------------------------------------

      const getQuery: Dialogs['getQuery'] = () => {
        const dialogName = router.currentRoute.query.dialogName as DialogNames | undefined
        if (!dialogName) return

        let dialogParams: Record<string, unknown> | undefined
        const paramStr = router.currentRoute.query.dialogParams as string
        if (paramStr) {
          dialogParams = JSON.parse(decodeURIComponent(paramStr))
        }
        return { dialogName, dialogParams }
      }

      const clearQuery: Dialogs['clearQuery'] = () => {
        const query = { ...router.currentRoute.query }
        delete query.dialogName
        delete query.dialogParams
        router.push({
          path: router.currentRoute.path,
          query,
        })
      }

      const message: Dialogs['message'] = {
        open: params => messageDialog.value.open(params),
      }

      const signIn: Dialogs['signIn'] = {
        open: () => openDialog('signIn'),
      }

      const signUp: Dialogs['signUp'] = {
        open: () => openDialog('signUp'),
      }

      const emailChange: Dialogs['emailChange'] = {
        open: () => openDialog('emailChange'),
      }

      const userDelete: Dialogs['userDelete'] = {
        open: () => openDialog('userDelete'),
      }

      const userEntry: Dialogs['userEntry'] = {
        open: () => openDialog('userEntry'),
      }

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      /**
       * ダイアログを開くためのクエリをURLに付与してダイアログを開きます。
       *
       * URLに付与するダイアログクエリの例:
       *   https://example.com/views/abc-page?dialogName=signIn&dialogParams=%257B%2522account%2522%253A%2522taro%2522%257D
       *
       * @param dialogName ダイアログの名前
       * @param dialogParams ダイアログに渡すパラメータ
       */
      function openDialog(dialogName: string, dialogParams?: any): Promise<any> {
        return new Promise((resolve, reject) => {
          // ダイアログへの遷移を監視
          const stopWatch = watch(
            () => ctx.root.$route,
            (route: Route) => {
              // 監視を終了
              stopWatch()

              // URLからダイアログクエリを取得
              const info = getQuery()
              if (!info) {
                reject(new Error('The dialog query could not be retrieved from the URL.'))
                return
              }

              // URLからダイアログクエリが取得できた場合、対象ダイアログのインスタンスを取得
              const dialog = dialogs[info.dialogName]
              if (!dialog) {
                reject(new Error(`There is no dialog named ${info.dialogName}.`))
                return
              }

              // ダイアログを開く
              dialog.value.open(info.dialogParams).then(result => {
                // ダイアログが閉じられたら、URLからダイアログクエリを削除
                clearQuery()
                // ダイアログが閉じられたことを通知
                resolve(result)
              })
            }
          )

          // 引数で指定されたダイアログへ遷移開始
          router.push({
            path: router.currentRoute.path,
            query: Object.assign({}, router.currentRoute.query, {
              dialogName,
              dialogParams: dialogParams ? encodeURIComponent(JSON.stringify(dialogParams)) : undefined,
            }),
          })
        })
      }

      /**
       * 指定されたルートのURLからダイアログ情報を取得し、
       * ダイアログ情報が取得された場合はそのダイアログを開きます。
       */
      function openDialogByCurrentRoute() {
        // URLからダイアログクエリを取得
        const info = getQuery()
        if (!info) return

        // URLからダイアログクエリが取得できた場合、対象ダイアログのインスタンスを取得
        const dialog = dialogs[info.dialogName]
        if (!dialog) {
          console.warn(`There is no dialog named ${info.dialogName}.`)
          return
        }

        // ダイアログを開く
        dialog.value.open(info.dialogParams).then(() => {
          // ダイアログが閉じられたら、URLからダイアログクエリを削除
          clearQuery()
        })
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      const result: Dialogs = {
        getQuery,
        clearQuery,
        message,
        signIn,
        signUp,
        emailChange,
        userDelete,
        userEntry,
      }

      return {
        ...result,
        messageDialog,
        signInDialog,
        signUpDialog,
        emailChangeDialog,
        userDeleteDialog,
        userEntryDialog,
      }
    },
  })

  //--------------------------------------------------
  //  Dialogs functions
  //--------------------------------------------------

  let dialogs: Ref<Dialogs | undefined>

  function getDialogs(): Dialogs {
    if (!dialogs) {
      throw new Error(`'Dialogs' is not provided.`)
    }
    if (!dialogs.value) {
      throw new Error(`'Dialogs' has not yet been instantiated.`)
    }
    return dialogs.value
  }

  /**
   * Dialogsコンポーネントのインスタンス参照をアプリケーションに提供します。
   * Dialogsの機能を利用するには事前にこのメソッドを呼び出す必要があります。
   * @param dialogsRef
   */
  export function provide(dialogsRef: Ref<Dialogs | undefined>): void {
    dialogs = dialogsRef
  }

  /**
   * ダイアログを開くためのクエリを生成します。
   *
   * ダイアログクエリの例:
   *   dialogName=signIn&dialogParams=%257B%2522account%2522%253A%2522taro%2522%257D
   *
   * @param dialogName ダイアログの名前
   * @param dialogParams ダイアログに渡すパラメータ
   */
  export function createQuery(dialogName: DialogNames, dialogParams?: any): string {
    let result = `dialogName=${dialogName}`
    if (dialogParams) {
      result += `&dialogParams=${encodeURIComponent(JSON.stringify(dialogParams))}`
    }
    return result
  }

  /**
   * 現在URLにURLに付与されているダイアログクエリを取得します。
   */
  export const getQuery: Dialogs['getQuery'] = () => getDialogs().getQuery()

  /**
   * 現在URLに付与されているダイアログクエリを削除します。
   */
  export const clearQuery: Dialogs['clearQuery'] = () => getDialogs().clearQuery()

  export const message: Dialogs['message'] = { open: params => getDialogs().message.open(params) }
  export const signIn: Dialogs['signIn'] = { open: () => getDialogs().signIn.open() }
  export const signUp: Dialogs['signUp'] = { open: () => getDialogs().signUp.open() }
  export const emailChange: Dialogs['emailChange'] = { open: () => getDialogs().emailChange.open() }
  export const userDelete: Dialogs['userDelete'] = { open: () => getDialogs().userDelete.open() }
  export const userEntry: Dialogs['userEntry'] = { open: () => getDialogs().userEntry.open() }
}

//========================================================================
//
//  Exports
//
//========================================================================

export default Dialogs.clazz
export { Dialogs }
</script>
