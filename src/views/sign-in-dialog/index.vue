<style lang="stylus" scoped>
@import '../../styles/app.variables.styl'

.title {
  @extend $text-h6
}

.sign-in-container {
  .sign-in-button {
    width: 220px
    height: 40px
    border: none
    padding: 0 20px
    cursor: pointer
    box-shadow: $shadow-2
    .icon {
      width: 18px
      height: 18px
    }
    .label {
      @extend $text-body2
      font-weight: $text-weights.medium
      margin-left: 16px
    }
    * {
      pointer-events: none
    }

    &.google {
      background-color: white
      color: $text-secondary-color
    }

    &.facebook {
      background-color: #3b5998
      color: white
    }

    &.email {
      background-color: #db4437
      color: white
    }

    &.anonymous {
      background-color: #f4b400
      color: white
    }
  }

  .sign-in-button:not(:first-child) {
    margin-top: 20px
  }
}
</style>

<template>
  <q-dialog v-model="m_opened" :class="{ sp: screenSize.sp }" class="dialog">
    <q-card>
      <!-- list -->
      <div v-if="m_state === 'list'" class="sign-in-container">
        <q-card-section>
          <div class="title">Sign in</div>
        </q-card-section>
        <q-card-section>
          <div ref="googleSignInButton" class="layout horizontal center sign-in-button google" @click="m_signInWithGoogle">
            <img class="icon" src="@/assets/icons/google.svg" />
            <div class="label">Sign in with Google</div>
          </div>

          <div ref="facebookSignInButton" class="layout horizontal center sign-in-button facebook" @click="m_signInWithFacebook">
            <img class="icon" src="@/assets/icons/facebook.svg" />
            <div class="label">Sign in with Facebook</div>
          </div>

          <div ref="emailSignInButton" class="layout horizontal center sign-in-button email" @click="m_signInWithEmail">
            <img class="icon" src="@/assets/icons/mail.svg" />
            <div class="label">Sign in with Email</div>
          </div>

          <div ref="anonymousSignInButton" class="layout horizontal center sign-in-button anonymous" @click="m_signInWithAnonymous">
            <q-icon name="person_outline" size="18px" />
            <div class="label">Continue as guest</div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat rounded color="primary" label="Cancel" @click="close" />
        </q-card-actions>
      </div>

      <!-- email -->
      <email-sign-in-view v-else-if="m_state === 'email'" ref="emailSignInView"></email-sign-in-view>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { BaseComponent, ResizableMixin } from '@/components'
import { Component, Watch } from 'vue-property-decorator'
import EmailSignInView from '@/views/sign-in-dialog/email-sign-in-view.vue'
import { NoCache } from '@/base/decorators'
import { mixins } from 'vue-class-component'

@Component({
  name: 'sign-in-dialog',
  components: {
    EmailSignInView,
  },
})
export default class SignInDialog extends mixins(BaseComponent, ResizableMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_state: 'list' | 'email' = 'list'

  private m_opened: boolean = false

  @Watch('m_opened')
  private m_openedChanged(newValue: boolean, oldValue: boolean) {
    if (!newValue) {
      this.$emit('closed')
    }
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_emailSignInView(): EmailSignInView {
    return this.$refs.emailSignInView as any
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(): void {
    this.m_state = 'list'
    this.m_opened = true
  }

  close(): void {
    this.m_opened = false
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_signInWithGoogle() {
    await this.$logic.auth.signInWithGoogle()
  }

  private async m_signInWithFacebook() {
    await this.$logic.auth.signInWithFacebook()
  }

  private async m_signInWithEmail() {
    this.m_state = 'email'
    this.$nextTick(() => {
      this.m_emailSignInView.init(this)
    })
  }

  private async m_signInWithAnonymous() {
    await this.$logic.auth.signInAnonymously()
  }
}
</script>
