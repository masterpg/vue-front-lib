import { TestAuthToken, TestFirebaseUserInput, TestUserInput } from './services'
import { AuthStatus } from '@/app/services'

export function GeneralToken(): TestAuthToken {
  return {
    uid: 'test.general',
    authStatus: 'Available',
    isAppAdmin: false,
  }
}

export function GeneralFirebaseUser(): Required<Omit<TestFirebaseUserInput, 'readableNodeId' | 'writableNodeId'>> {
  return {
    uid: GeneralToken().uid,
    email: 'test.general@example.com',
    emailVerified: true,
    password: 'passpass',
    disabled: false,
    authStatus: GeneralToken().authStatus,
    isAppAdmin: GeneralToken().isAppAdmin,
  }
}

export function GeneralUser(): TestUserInput {
  return {
    ...GeneralFirebaseUser(),
    userName: 'test.general',
    fullName: '一般 太郎',
    photoURL: 'https://example.com/test.general/user.png',
  }
}

export function AppAdminToken(): TestAuthToken {
  return {
    uid: 'test.app.admin',
    authStatus: 'Available',
    isAppAdmin: true,
  }
}

export function AppAdminFirebaseUser(): Required<Omit<TestFirebaseUserInput, 'readableNodeId' | 'writableNodeId'>> {
  return {
    uid: AppAdminToken().uid,
    email: 'test.app.admin@example.com',
    emailVerified: true,
    password: 'passpass',
    disabled: false,
    authStatus: AppAdminToken().authStatus,
    isAppAdmin: AppAdminToken().isAppAdmin,
  }
}

export function AppAdminUser(): TestUserInput {
  return {
    ...AppAdminFirebaseUser(),
    userName: 'test.app.admin',
    fullName: '管理 太郎',
    photoURL: 'https://example.com/test.app.admin/user.png',
  }
}
