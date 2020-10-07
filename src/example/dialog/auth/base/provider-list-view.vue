<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.provider-list-view-main

.sign-in-button
  width: 280px
  height: 40px
  border: none
  padding: 0 20px
  cursor: pointer
  box-shadow: $shadow-2

  &:not(:first-child)
    margin-top: 20px

  &.google
    background-color: white
    color: $text-secondary-color

  &.facebook
    background-color: #3b5998
    color: white

  &.email
    background-color: #db4437
    color: white

  &.anonymous
    background-color: #f4b400
    color: white

  .icon
    width: 18px
    height: 18px

  .label
    @extend %text-body2
    font-weight: map_get($text-weights, "medium")
    margin-left: 16px

  *
    pointer-events: none

.sign-in-button:not(:first-child)
  margin-top: 20px

.title
  @extend %text-h6
</style>

<template>
  <q-card class="provider-list-view-main">
    <!-- タイトル -->
    <q-card-section>
      <div class="title">{{ title }}</div>
    </q-card-section>

    <!-- プロバイダリスト -->
    <q-card-section>
      <div v-show="m_visibleGoogle" ref="googleSignInButton" class="layout horizontal center sign-in-button google" @click="m_withGoogle()">
        <img class="icon" src="@/example/assets/icons/google.svg" />
        <div class="label">{{ $t('auth.providerList.withGoogle', { type: $t('common.signIn') }) }}</div>
      </div>

      <div v-show="m_visibleFacebook" ref="facebookSignInButton" class="layout horizontal center sign-in-button facebook" @click="m_withFacebook()">
        <img class="icon" src="@/example/assets/icons/facebook.svg" />
        <div class="label">{{ $t('auth.providerList.withFacebook', { type: $t('common.signIn') }) }}</div>
      </div>

      <div v-show="m_visiblePassword" ref="emailSignInButton" class="layout horizontal center sign-in-button email" @click="m_withEmail()">
        <img class="icon" src="@/example/assets/icons/mail.svg" />
        <div class="label">{{ $t('auth.providerList.withEmail', { type: m_typeName }) }}</div>
      </div>

      <div
        v-show="m_visibleAnonymous"
        ref="anonymousSignInButton"
        class="layout horizontal center sign-in-button anonymous"
        @click="m_withAnonymous()"
      >
        <q-icon name="person_outline" size="18px" />
        <div class="label">{{ $t('auth.providerList.withAnonymous', { type: $t('common.signIn') }) }}</div>
      </div>
    </q-card-section>

    <!-- ボタンエリア -->
    <q-card-actions align="right">
      <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="m_close()" />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { BaseComponent, Resizable } from '@/example/base'
import { Component, Prop } from 'vue-property-decorator'
import { AuthProviderType } from '@/example/logic'
import { mixins } from 'vue-class-component'

@Component({
  components: {},
})
export default class ProviderListView extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  title!: string

  @Prop({ required: true })
  type!: 'signIn' | 'signUp'

  @Prop({ default: () => [AuthProviderType.Google, AuthProviderType.Facebook, AuthProviderType.Password, AuthProviderType.Anonymous] })
  visibleProviders!: AuthProviderType[]

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private get m_typeName(): string {
    return this.type === 'signIn' ? String(this.$t('common.signIn')) : String(this.$t('common.signUp'))
  }

  private get m_visibleGoogle() {
    return this.visibleProviders.includes(AuthProviderType.Google)
  }

  private get m_visibleFacebook() {
    return this.visibleProviders.includes(AuthProviderType.Facebook)
  }

  private get m_visiblePassword() {
    return this.visibleProviders.includes(AuthProviderType.Password)
  }

  private get m_visibleAnonymous() {
    return this.visibleProviders.includes(AuthProviderType.Anonymous) && this.type === 'signIn'
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_withGoogle() {
    this.$emit('select-google')
  }

  private async m_withFacebook() {
    this.$emit('select-facebook')
  }

  private async m_withEmail() {
    this.$emit('select-email')
  }

  private async m_withAnonymous() {
    this.$emit('select-anonymous')
  }

  private m_close() {
    this.$emit('closed')
  }
}
</script>
