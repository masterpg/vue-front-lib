<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.auth-message-view-main
  &.pc, &.tab
    width: 340px
  &.sp
    width: 270px

.title
  @extend %text-h6
</style>

<template>
  <q-card class="auth-message-view-main" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
    <q-form>
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <slot name="message"></slot>
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script lang="ts">
import { BaseComponent, Resizable } from '@/app/base'
import { Component, Prop } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'

@Component
export default class AuthMessageView extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop()
  title!: string
}
</script>
