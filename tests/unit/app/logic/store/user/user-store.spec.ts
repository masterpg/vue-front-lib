import { UserInfo } from '@/app/logic'
import dayjs from 'dayjs'
import { provideDependency } from '../../../../../helpers/app'

//========================================================================
//
//  Test data
//
//========================================================================

function EmptyUser(): UserInfo {
  return {
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
}

function User1(): UserInfo {
  return {
    id: UserInfo.generateId(),
    email: 'taro.yamada@example.com',
    emailVerified: true,
    isAppAdmin: true,
    createdAt: dayjs(),
    updatedAt: dayjs(),
    publicProfile: {
      id: UserInfo.generateId(),
      displayName: '山田 太郎',
      photoURL: 'http://example.com/taro.yamada.png',
      createdAt: dayjs(),
      updatedAt: dayjs(),
    },
  }
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('UserStore', () => {
  it('set', () => {
    const { store } = provideDependency()
    const user1 = User1()

    // テスト対象実行
    const actual = store.user.set(user1)

    // 戻り値の検証
    expect(actual).toEqual(user1)
    // ストアの値を検証
    const updated = store.user.value
    expect(updated).toEqual(user1)
  })

  it('clear', () => {
    const { store } = provideDependency(({ store }) => {
      store.user.set(User1())
    })

    // テスト対象実行
    store.user.clear()

    // ストアの値を検証
    const updated = store.user.value
    expect(updated).toEqual(EmptyUser())
  })
})
