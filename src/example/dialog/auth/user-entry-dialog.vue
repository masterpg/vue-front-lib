<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.container
  &.pc, &.tab
    width: 340px
  &.sp
    width: 270px

.title
  @extend %text-h6

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <q-dialog ref="dialog" v-model="opened" persistent>
    <!-- ユーザー情報ビュー -->
    <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ $t('auth.entry.userInfo') }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <!-- 名前インプット -->
        <q-input
          ref="fullNameInput"
          v-model="m_fullName"
          type="text"
          :label="$t('auth.entry.fullName')"
          :error="m_fullNameError"
          :error-message="m_fullNameErrorMessage"
          @input="m_clearErrorMessage()"
        />
        <!-- 表示名インプット -->
        <q-input
          ref="displayNameInput"
          v-model="m_displayName"
          type="text"
          :label="$t('common.displayName')"
          :error="m_displayNameError"
          :error-message="m_displayNameErrorMessage"
          @input="m_clearErrorMessage()"
        />
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="Boolean(m_errorMessage)">
        <span class="error-message">{{ m_errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
        <!-- 登録ボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.entry')" @click="m_entry()" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { BaseDialog, NoCache } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'

@Component({
  components: {},
})
export default class UserEntryDialog extends BaseDialog<void, void> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private m_errorMessage = ''

  private m_fullName: string | null = null

  private get m_fullNameError(): boolean {
    return this.m_validateFullName(this.m_fullName)
  }

  private m_fullNameErrorMessage = ''

  private m_displayName: string | null = null

  private get m_displayNameError(): boolean {
    return this.m_validateDisplayName(this.m_displayName)
  }

  private m_displayNameErrorMessage = ''

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(): Promise<void> {
    return this.openProcess()
  }

  close(): void {
    this.m_clear()
    this.closeProcess()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   *  ビューをクリアします。
   */
  private m_clear(): void {
    this.m_displayName = null
    this.m_errorMessage = ''
  }

  /**
   * エラーメッセージエリアのメッセージをクリアします。
   */
  private m_clearErrorMessage(): void {
    this.m_errorMessage = ''
  }

  /**
   * 登録を行います。
   */
  private async m_entry(): Promise<void> {
    this.$q.loading.show()

    if (!this.m_validate()) {
      this.$q.loading.hide()
    }

    await this.$logic.auth.setUser({
      fullName: this.m_fullName!,
      displayName: this.m_displayName!,
    })

    this.close()

    this.$q.loading.hide()
  }

  //--------------------------------------------------
  //  Validation
  //--------------------------------------------------

  /**
   * 入力値の検証を行います。
   */
  private m_validate(): boolean {
    this.m_fullName = this.m_fullName ?? ''
    if (this.m_validateFullName(this.m_fullName)) {
      return false
    }

    this.m_displayName = this.m_displayName ?? ''
    if (this.m_validateDisplayName(this.m_displayName)) {
      return false
    }

    return true
  }

  /**
   * 名前の検証を行います。
   * @param value
   */
  private m_validateFullName(value: string | null): boolean {
    if (value === null) {
      return false
    }

    if (value === '') {
      const target = String(this.$t('auth.entry.fullName'))
      this.m_fullNameErrorMessage = String(this.$t('error.required', { target }))
      return true
    }

    return false
  }

  /**
   * 表示名の検証を行います。
   * @param value
   */
  private m_validateDisplayName(value: string | null): boolean {
    if (value === null) {
      return false
    }

    if (value === '') {
      const target = String(this.$t('common.displayName'))
      this.m_displayNameErrorMessage = String(this.$t('error.required', { target }))
      return true
    }

    return false
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------
}
</script>
