<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.container
  min-width: 300px
  &.pc, &.tab
    max-width: 70vw
  &.sp
    max-width: 90vw

.title
  @extend %text-h6

.message
  white-space: pre-line
</style>

<template>
  <q-dialog ref="dialog" v-model="opened" :persistent="m_persistent" @hide="close(false)">
    <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
      <!-- タイトル -->
      <q-card-section v-if="!!m_title">
        <div class="title">{{ m_title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section class="row items-center">
        <div class="message">{{ m_message }}</div>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-actions class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn v-show="m_type === 'confirm'" flat rounded color="primary" :label="$t('common.cancel')" @click="close(false)" />
        <!-- OKボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.ok')" @click="close(true)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { BaseDialog, NoCache } from '@/example/base'
import { Component, Prop } from 'vue-property-decorator'
import { QDialog } from 'quasar'

interface CompAlertDialogParams {
  type?: 'alert' | 'confirm'
  title?: string
  message?: string
  persistent?: boolean
}

@Component
export default class CompAlertDialog extends BaseDialog<CompAlertDialogParams | undefined, boolean> {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ default: 'alert' })
  type!: 'alert' | 'confirm'

  @Prop({ default: '' })
  title!: string

  @Prop({ default: '' })
  message!: string

  @Prop({ default: true })
  persistent!: boolean

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_type: 'alert' | 'confirm' = 'alert'

  private m_title = ''

  private m_message = ''

  private m_persistent = true

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(params: CompAlertDialogParams = {}): Promise<boolean> {
    this.m_type = this.type
    if (params.type) {
      this.m_type = params.type
    }

    this.m_title = this.title
    if (params.title) {
      this.m_title = params.title
    }

    this.m_message = this.message
    if (params.message) {
      this.m_message = params.message
    }

    this.m_persistent = this.persistent
    if (typeof params.persistent === 'boolean') {
      this.m_persistent = params.persistent
    }

    return this.openProcess(params)
  }

  close(isConfirmed?: boolean): void {
    this.closeProcess(!!isConfirmed)
  }
}
</script>
