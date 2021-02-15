<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

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
  <q-card class="ProviderListView">
    <!-- タイトル -->
    <q-card-section>
      <div class="title">{{ title }}</div>
    </q-card-section>

    <!-- プロバイダリスト -->
    <q-card-section>
      <div v-show="visibleGoogle" ref="googleSignInButton" class="layout horizontal center sign-in-button google" @click="withGoogle()">
        <img class="icon" src="@/app/assets/icons/google.svg" />
        <div class="label">{{ t('auth.providerList.withGoogle', { type: t('common.signIn') }) }}</div>
      </div>

      <div v-show="visibleFacebook" ref="facebookSignInButton" class="layout horizontal center sign-in-button facebook" @click="withFacebook()">
        <img class="icon" src="@/app/assets/icons/facebook.svg" />
        <div class="label">{{ t('auth.providerList.withFacebook', { type: t('common.signIn') }) }}</div>
      </div>

      <div v-show="visiblePassword" ref="emailSignInButton" class="layout horizontal center sign-in-button email" @click="withEmail()">
        <img class="icon" src="@/app/assets/icons/mail.svg" />
        <div class="label">{{ t('auth.providerList.withEmail', { type: typeName }) }}</div>
      </div>

      <div v-show="visibleAnonymous" ref="anonymousSignInButton" class="layout horizontal center sign-in-button anonymous" @click="withAnonymous()">
        <q-icon name="person_outline" size="18px" />
        <div class="label">{{ t('auth.providerList.withAnonymous', { type: t('common.signIn') }) }}</div>
      </div>
    </q-card-section>

    <!-- ボタンエリア -->
    <q-card-actions align="right">
      <q-btn flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'
import { AuthProviderType } from '@/app/service'
import { useI18n } from '@/app/i18n'

interface ProviderListView extends ProviderListView.Props {}

namespace ProviderListView {
  export interface Props {
    title: string
    type: 'SignIn' | 'SignUp'
    visibleProviders: AuthProviderType[]
  }

  export const clazz = defineComponent({
    name: 'ProviderListView',

    props: {
      title: { type: String, required: true },
      type: { type: String, required: true },
      visibleProviders: {
        type: Array,
        default: () => [AuthProviderType.Google, AuthProviderType.Facebook, AuthProviderType.Password, AuthProviderType.Anonymous],
      },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const i18n = useI18n()

      const typeName = computed(() => {
        return props.type === 'SignIn' ? String(i18n.t('common.signIn')) : String(i18n.t('common.signUp'))
      })

      const visibleGoogle = computed(() => {
        return props.visibleProviders.includes(AuthProviderType.Google)
      })

      const visibleFacebook = computed(() => {
        return props.visibleProviders.includes(AuthProviderType.Facebook)
      })

      const visiblePassword = computed(() => {
        return props.visibleProviders.includes(AuthProviderType.Password)
      })

      const visibleAnonymous = computed(() => {
        return props.visibleProviders.includes(AuthProviderType.Anonymous) && props.type === 'SignIn'
      })

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      function close() {
        ctx.emit('closed')
      }

      async function withGoogle() {
        ctx.emit('select-google')
      }

      async function withFacebook() {
        ctx.emit('select-facebook')
      }

      async function withEmail() {
        ctx.emit('select-email')
      }

      async function withAnonymous() {
        ctx.emit('select-anonymous')
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        ...i18n,
        typeName,
        visibleGoogle,
        visibleFacebook,
        visiblePassword,
        visibleAnonymous,
        close,
        withGoogle,
        withFacebook,
        withEmail,
        withAnonymous,
      }
    },
  })
}

export default ProviderListView.clazz
export { ProviderListView }
</script>
