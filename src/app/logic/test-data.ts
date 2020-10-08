import { CartItem, Product, User } from '@/app/logic/types'
import dayjs from 'dayjs'

namespace TestData {
  export const user: User = {
    id: 'taro.yamada',
    email: 'taro.yamada@example.com',
    displayName: '山田 太郎',
    createdAt: dayjs('2020-01-01'),
    updatedAt: dayjs('2020-01-01'),
  }
}

export { TestData }
