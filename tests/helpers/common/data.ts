import { TestAuthUser, TestFirebaseUserInput, TestUserInput } from '../../mocks/common/logic/api'
import { AuthStatus } from '@/lib'

export const GENERAL_TOKEN: TestAuthUser = {
  uid: 'test.general',
  authStatus: AuthStatus.Available,
}

export const GENERAL_FIREBASE_USER: Required<TestFirebaseUserInput> = {
  uid: GENERAL_TOKEN.uid,
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

export const GENERAL_USER: TestUserInput = {
  ...GENERAL_FIREBASE_USER,
  fullName: '一般 太郎',
}

export const APP_ADMIN_TOKEN: TestAuthUser = {
  uid: 'test.app.admin',
  authStatus: AuthStatus.Available,
  isAppAdmin: true,
}

export const APP_ADMIN_FIREBASE_USER: Required<TestFirebaseUserInput> = {
  uid: APP_ADMIN_TOKEN.uid,
  email: 'test.app.admin@example.com',
  emailVerified: true,
  password: 'passpass',
  displayName: 'アプリケーション管理ユーザー',
  disabled: false,
  photoURL: 'https://example.com/test.app.admin/user.png',
  customClaims: {
    isAppAdmin: APP_ADMIN_TOKEN.isAppAdmin,
  },
}

export const APP_ADMIN_USER: TestUserInput = {
  ...APP_ADMIN_FIREBASE_USER,
  fullName: '管理 太郎',
}
