<style lang="stylus" scoped>
@import '../../../assets/styles/_typography.styl';
@import '../../../assets/styles/_shadows.styl';

.title {
  @extend .app-font-title;
}

.sign-in-wrapper {
  .sign-in-button {
    @extend .app-shadow-elevation-2dp;
    width: 220px;
    height: 40px;
    border: none;
    padding: 0 20px;
    cursor: pointer;
    .icon {
      width: 18px;
      height 18px;
    }
    .label {
      @extend .app-font-body2;
      margin-left: 16px;
    }
    * {
      pointer-events: none;
    }

    &.google {
      background-color: white;
      color: var(--app-secondary-text-color);
    }

    &.facebook {
      background-color: #3b5998;
      color: white;
    }
  }

  .sign-in-button:not(:first-child) {
    margin-top: 20px;
  }
}
</style>


<template>
  <paper-dialog
    ref="dialog"
    with-backdrop
    entry-animation="fade-in-animation"
    exit-animation="fade-out-animation"
  >
    <div class="title">Sign in</div>

    <div class="sign-in-wrapper">
      <div
        ref="googleSignInButton"
        class="layout horizontal center sign-in-button google"
        @click="m_signInButtonOnClick"
      >
        <img class="icon" src="assets/images/icons/google.svg"/>
        <div class="label">Sign in with Google</div>
      </div>

      <div
        ref="facebookSignInButton"
        class="layout horizontal center sign-in-button facebook"
        @click="m_signInButtonOnClick"
      >
        <img class="icon" src="assets/images/icons/facebook.svg"/>
        <div class="label">Sign in with Facebook</div>
      </div>
    </div>

  </paper-dialog>
</template>


<script lang="ts">
import * as firebase from 'firebase';
import { Component } from 'vue-property-decorator';
import { ElementComponent } from '../../components';
import { mixins } from 'vue-class-component';

import '@polymer/paper-dialog/paper-dialog';

@Component
export default class SignInDialog extends mixins(ElementComponent) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  m_googleProvider: firebase.auth.GoogleAuthProvider;

  m_facebookProvider: firebase.auth.FacebookAuthProvider;

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_dialog(): { open: () => void } {
    return this.$refs.dialog as any;
  }

  get m_googleSignInButton() {
    return this.$refs.googleSignInButton;
  }

  get m_facebookSignInButton() {
    return this.$refs.facebookSignInButton;
  }

  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.m_googleProvider = new firebase.auth.GoogleAuthProvider();
    this.m_googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

    this.m_facebookProvider = new firebase.auth.FacebookAuthProvider();
    this.m_facebookProvider.addScope('user_birthday');
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(): void {
    this.m_dialog.open();
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * サインイン(リダイレクト形式で)を行います。
   */
  async m_signIn(provider: firebase.auth.AuthProvider) {
    await firebase.auth().signInWithRedirect(provider);
  }

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  /**
   * サインインボタンがクリックされた際のハンドラです。
   * @param e
   */
  async m_signInButtonOnClick(e: Event) {
    let provider: firebase.auth.AuthProvider;
    if (e.target === this.m_googleSignInButton) {
      provider = this.m_googleProvider;
    } else if (e.target === this.m_facebookSignInButton) {
      provider = this.m_facebookProvider;
    } else {
      return;
    }
    await this.m_signIn(provider);
  }
}
</script>
