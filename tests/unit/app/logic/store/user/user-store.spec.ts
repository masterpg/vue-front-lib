import { generateFirestoreId, provideDependency } from '../../../../../helpers/app'
import { UserInfo } from '@/app/logic'
import dayjs from 'dayjs'

//========================================================================
//
//  Test data
//
//========================================================================

const USER_EMPTY: UserInfo = {
  id: '',
  email: '',
  emailVerified: false,
  isAppAdmin: false,
  createdAt: dayjs(0),
  updatedAt: dayjs(0),
  publicProfile: {
    id: '',
    displayName: '',
    photoURL: '',
    createdAt: dayjs(0),
    updatedAt: dayjs(0),
  },
}

const USER_1: UserInfo = {
  id: generateFirestoreId(),
  email: 'taro.yamada@example.com',
  emailVerified: true,
  isAppAdmin: true,
  createdAt: dayjs(),
  updatedAt: dayjs(),
  publicProfile: {
    id: generateFirestoreId(),
    displayName: '山田 太郎',
    photoURL: 'http://example.com/taro.yamada.png',
    createdAt: dayjs(),
    updatedAt: dayjs(),
  },
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('UserStore', () => {
  it('set', () => {
    const { store } = provideDependency()

    // テスト対象実行
    const actual = store.user.set(USER_1)

    // 戻り値の検証
    expect(actual).toEqual(USER_1)
    // ストアの値を検証
    const updated = store.user.value
    expect(updated).toEqual(USER_1)
  })

  it('clear', () => {
    const { store } = provideDependency(({ store }) => {
      store.user.set(USER_1)
    })

    // テスト対象実行
    store.user.clear()

    // ストアの値を検証
    const updated = store.user.value
    expect(updated).toEqual(USER_EMPTY)
  })
})
