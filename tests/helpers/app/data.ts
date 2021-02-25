import { TestAuthToken, TestFirebaseUserInput, TestUserInput } from './services'
import { cloneDeep } from 'lodash'

export function GeneralFirebaseUser(): Required<Omit<TestFirebaseUserInput, 'readableNodeId' | 'writableNodeId'>> {
  return cloneDeep(
    ((GeneralFirebaseUser as any).instance = (GeneralFirebaseUser as any).instance || {
      uid: 'test.general',
      email: 'test.general@example.com',
      emailVerified: true,
      password: 'passpass',
      disabled: false,
      authStatus: 'Available',
      isAppAdmin: false,
    })
  )
}

export function GeneralUser(): TestUserInput {
  return cloneDeep(
    ((GeneralUser as any).instance = (GeneralUser as any).instance || {
      ...GeneralFirebaseUser(),
      userName: 'test.general',
      fullName: '一般 太郎',
      photoURL: 'https://example.com/test.general/user.png',
    })
  )
}

export function GeneralToken(): TestAuthToken {
  return cloneDeep(
    ((GeneralToken as any).instance = (GeneralToken as any).instance || {
      uid: GeneralUser().uid,
      email: GeneralUser().email,
      email_verified: GeneralUser().emailVerified,
      authStatus: GeneralUser().authStatus,
      isAppAdmin: GeneralUser().isAppAdmin,
    })
  )
}

export function AppAdminFirebaseUser(): Required<Omit<TestFirebaseUserInput, 'readableNodeId' | 'writableNodeId'>> {
  return cloneDeep(
    ((AppAdminFirebaseUser as any).instance = (AppAdminFirebaseUser as any).instance || {
      uid: 'test.app.admin',
      email: 'test.app.admin@example.com',
      emailVerified: true,
      password: 'passpass',
      disabled: false,
      authStatus: 'Available',
      isAppAdmin: true,
    })
  )
}

export function AppAdminUser(): TestUserInput {
  return cloneDeep(
    ((AppAdminUser as any).instance = (AppAdminUser as any).instance || {
      ...AppAdminFirebaseUser(),
      userName: 'test.app.admin',
      fullName: '管理 太郎',
      photoURL: 'https://example.com/test.app.admin/user.png',
    })
  )
}

export function AppAdminToken(): TestAuthToken {
  return cloneDeep(
    ((AppAdminToken as any).instance = (AppAdminToken as any).instance || {
      uid: AppAdminUser().uid,
      email: AppAdminUser().email,
      email_verified: AppAdminUser().emailVerified,
      authStatus: AppAdminUser().authStatus,
      isAppAdmin: AppAdminUser().isAppAdmin,
    })
  )
}
