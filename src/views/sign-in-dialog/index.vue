<style scoped>
@import '../../styles/typography.css';
@import '../../styles/shadows.css';

.title {
  @extend %comm-font-title;
}

paper-dialog.sp {
  margin: 24px 10px;
}

.sign-in-wrapper {
  & .sign-in-button {
    @extend %comm-shadow-elevation-2dp;
    width: 220px;
    height: 40px;
    border: none;
    padding: 0 20px;
    cursor: pointer;
    & .icon {
      width: 18px;
      height: 18px;
    }
    & .label {
      @extend %comm-font-body2;
      margin-left: 16px;
    }
    & * {
      pointer-events: none;
    }

    &.google {
      background-color: white;
      color: var(--comm-secondary-text-color);
    }

    &.facebook {
      background-color: #3b5998;
      color: white;
    }

    &.email {
      background-color: #db4437;
      color: white;
    }
  }

  & .sign-in-button:not(:first-child) {
    margin-top: 20px;
  }
}
</style>

<template>
  <paper-dialog ref="dialog" modal with-backdrop entry-animation="fade-in-animation" exit-animation="fade-out-animation" :class="{ sp: f_sp }">
    <div>
      <!-- list -->
      <div v-show="m_state === 'list'" class="sign-in-wrapper">
        <div class="title">Sign in</div>

        <div ref="googleSignInButton" class="layout horizontal center sign-in-button google" @click="m_signInWithGoogle">
          <img class="icon" src="assets/images/icons/google.svg" />
          <div class="label">Sign in with Google</div>
        </div>

        <div ref="facebookSignInButton" class="layout horizontal center sign-in-button facebook" @click="m_signInWithFacebook">
          <img class="icon" src="assets/images/icons/facebook.svg" />
          <div class="label">Sign in with Facebook</div>
        </div>

        <div ref="emailSignInButton" class="layout horizontal center sign-in-button email" @click="m_signInWithEmail">
          <img class="icon" src="assets/images/icons/mail.svg" />
          <div class="label">Sign in with Email</div>
        </div>

        <div class="layout horizontal center end-justified comm-mt-20"><paper-button @click="close();">Cancel</paper-button></div>
      </div>

      <!-- email -->
      <email-sign-in-view v-show="m_state === 'email'" ref="emailSignInView"></email-sign-in-view>
    </div>
  </paper-dialog>
</template>

<script lang="ts">
import '@polymer/paper-dialog/paper-dialog';

import EmailSignInView from '@/views/sign-in-dialog/email-sign-in-view.vue';
import { Component } from 'vue-property-decorator';
import { BaseComponent } from '@/base/component';
import { mixins } from 'vue-class-component';

@Component({
  components: {
    'email-sign-in-view': EmailSignInView,
  },
})
export default class SignInDialog extends mixins(BaseComponent) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  m_state: 'list' | 'email' = 'list';

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_dialog(): { open: () => void; close: () => void; fit: () => void } {
    return this.$refs.dialog as any;
  }

  get m_emailSignInView(): EmailSignInView {
    return this.$refs.emailSignInView as any;
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(): void {
    this.m_state = 'list';
    this.m_dialog.open();
    this.correctPosition();
  }

  close(): void {
    this.m_dialog.close();
  }

  correctPosition(): void {
    this.$nextTick(() => this.m_dialog.fit());
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  async m_signInWithGoogle() {
    await this.$stores.auth.signInWithGoogle();
  }

  async m_signInWithFacebook() {
    await this.$stores.auth.signInWithFacebook();
  }

  async m_signInWithEmail() {
    this.m_state = 'email';
    this.m_emailSignInView.init(this);
  }
}
</script>
