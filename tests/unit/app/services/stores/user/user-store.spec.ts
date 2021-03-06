import { User } from '@/app/services'
import { UserStore } from '@/app/services/stores/user'
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
    const { stores } = provideDependency()
    const user1 = User1()

    // テスト対象実行
    const actual = stores.user.set(user1)

    // 戻り値の検証
    expect(actual).toEqual(user1)
    // ストアの値を検証
    const updated = stores.user.value
    expect(updated).toEqual(user1)
  })

  it('clear', () => {
    const { stores } = provideDependency(({ stores }) => {
      stores.user.set(User1())
    })

    // テスト対象実行
    stores.user.clear()

    // ストアの値を検証
    const updated = stores.user.value
    expect(updated).toEqual(UserStore.createEmptyUser())
  })
})
