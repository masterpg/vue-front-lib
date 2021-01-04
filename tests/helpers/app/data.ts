import { TestAuthToken, TestFirebaseUserInput, TestUserInput } from './logic'
import { AuthStatus } from '@/app/logic'

export function GeneralToken(): TestAuthToken {
  return {
    uid: 'test.general',
    authStatus: AuthStatus.Available,
  }
}

export function GeneralFirebaseUser(): Required<TestFirebaseUserInput> {
  return {
    uid: GeneralToken().uid,
    email: 'test.general@example.com',
    emailVerified: true,
    password: 'passpass',
    displayName: '一般ユーザー',
    disabled: false,
    photoURL: 'https://example.com/test.general/user.png',
    customClaims: {
      isAppAdmin: false,
    },
  }
}

export function GeneralUser(): TestUserInput {
  return {
    ...GeneralFirebaseUser(),
    fullName: '一般 太郎',
  }
}

export function AppAdminToken(): TestAuthToken {
  return {
    uid: 'test.app.admin',
    authStatus: AuthStatus.Available,
    isAppAdmin: true,
  }
}

export function AppAdminFirebaseUser(): Required<TestFirebaseUserInput> {
  return {
    uid: AppAdminToken().uid,
    email: 'test.app.admin@example.com',
    emailVerified: true,
    password: 'passpass',
    displayName: 'アプリケーション管理ユーザー',
    disabled: false,
    photoURL: 'https://example.com/test.app.admin/user.png',
    customClaims: {
      isAppAdmin: AppAdminToken().isAppAdmin,
    },
  }
}

export function AppAdminUser(): TestUserInput {
  return {
    ...AppAdminFirebaseUser(),
    fullName: '管理 太郎',
  }
}
