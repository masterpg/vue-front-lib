import { User } from '@/logic'
import dayjs from 'dayjs'
import { provideDependency } from '../../../../helpers'

//========================================================================
//
//  Test data
//
//========================================================================

const USER_EMPTY: User = {
  id: '',
  email: '',
  displayName: '',
  createdAt: dayjs(0),
  updatedAt: dayjs(0),
}

const USER_1: User = {
  id: 'taro.yamada',
  email: 'taro.yamada@example.com',
  displayName: '山田 太郎',
  createdAt: dayjs(),
  updatedAt: dayjs(),
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

    expect(actual).toEqual(USER_1)

    const updated = store.user.value
    expect(updated).toEqual(USER_1)
  })

  it('set', () => {
    const { store } = provideDependency(({ store }) => {
      store.user.set(USER_1)
    })

    // テスト対象実行
    store.user.clear()

    const updated = store.user.value
    expect(updated).toEqual(USER_EMPTY)
  })
})
