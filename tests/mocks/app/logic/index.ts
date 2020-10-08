import * as td from 'testdouble'
import { AuthLogic, AuthStatus, LogicContainerImpl, UserInfo } from '@/app/logic'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class MockAuthLogic extends Vue implements AuthLogic {
  user = td.object<UserInfo>()
  status = AuthStatus.None
  isSignedIn = false
  checkSingedIn = td.function() as any
  signInWithGoogle = td.function() as any
  signInWithFacebook = td.function() as any
  signInWithEmailAndPassword = td.function() as any
  signInAnonymously = td.function() as any
  sendEmailVerification = td.function() as any
  sendPasswordResetEmail = td.function() as any
  createUserWithEmailAndPassword = td.function() as any
  signOut = td.function() as any
  deleteUser = td.function() as any
  updateEmail = td.function() as any
  fetchSignInMethodsForEmail = td.function() as any
  setUser = td.function() as any
}

@Component
class MockLogicContainer extends LogicContainerImpl {
  protected newAuthLogic(): AuthLogic {
    // 単体テストの対象外の箇所でエラーが発生するためAuthLogicはモックに置き換える。
    // エラー例: UserStore.isSignedInの値が変更されるとAuthLogicのイベントハンドラが実行されてエラーが発生
    return new MockAuthLogic()
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { MockLogicContainer }
