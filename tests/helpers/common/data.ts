import { TestAuthUser, TestFirebaseUserInput } from '../../mocks/common/logic/api'

export const GENERAL_USER_INPUT: TestFirebaseUserInput = {
  uid: 'test.general',
  customClaims: {
    myDirName: 'test.general',
  },
}

export const GENERAL_USER: TestAuthUser = {
  uid: GENERAL_USER_INPUT.uid,
  myDirName: GENERAL_USER_INPUT.customClaims!.myDirName!,
}

export const APP_ADMIN_USER_INPUT: TestFirebaseUserInput = {
  uid: 'test.app.admin',
  customClaims: {
    myDirName: 'test.app.admin',
    isAppAdmin: true,
  },
}

export const APP_ADMIN_USER: TestAuthUser = {
  uid: APP_ADMIN_USER_INPUT.uid,
  myDirName: APP_ADMIN_USER_INPUT.customClaims!.myDirName!,
  isAppAdmin: APP_ADMIN_USER_INPUT.customClaims!.isAppAdmin,
}
