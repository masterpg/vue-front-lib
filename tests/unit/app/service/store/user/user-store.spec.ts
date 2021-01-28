import { User } from '@/app/service'
import { UserStore } from '@/app/service/store/user'
import dayjs from 'dayjs'
import { provideDependency } from '../../../../../helpers/app'

//========================================================================
//
//  Test data
//
//========================================================================

function User1(): User {
  return {
    id: User.generateId(),
    email: 'taro.yamada@example.com',
    emailVerified: true,
    userName: 'taro.yamada',
    fullName: '山田 太郎',
    isAppAdmin: true,
    photoURL: 'http://example.com/taro.yamada.png',
    version: 1,
    createdAt: dayjs(),
    updatedAt: dayjs(),
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
    expect(updated).toEqual(UserStore.createEmptyUser())
  })
})
