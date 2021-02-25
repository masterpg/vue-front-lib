import { AuthStatus, TimestampEntity, generateEntityId } from '@/app/services/base/base'
import { DeepPartial, DeepReadonly, Entities, pickProps } from 'web-base-lib'
import dayjs from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface User extends TimestampEntity {
  email: string
  emailVerified: boolean
  userName: string
  fullName: string
  isAppAdmin: boolean
  photoURL?: string
}

interface UserInput {
  userName: string
  fullName: string
  photoURL?: string
}

namespace UserInput {
  export function squeeze<T extends UserInput | undefined>(input?: UserInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['userName', 'fullName', 'photoURL']) as T
  }
}

interface SetUserInfoResult {
  status: SetUserInfoResultStatus
  user?: User
}

type SetUserInfoResultStatus = 'AlreadyExists' | 'Success'

interface AuthDataResult {
  status: AuthStatus
  token: string
  user?: User
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace User {
  export function generateId(): string {
    return generateEntityId(Entities.Users.Name)
  }

  export function populate(from: DeepPartial<DeepReadonly<User>>, to: DeepPartial<User>): User {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.email === 'string') to.email = from.email
    if (typeof from.emailVerified === 'boolean') to.emailVerified = from.emailVerified
    if (typeof from.userName === 'string') to.userName = from.userName
    if (typeof from.fullName === 'string') to.fullName = from.fullName
    if (typeof from.isAppAdmin === 'boolean') to.isAppAdmin = from.isAppAdmin
    if (typeof from.photoURL === 'string') to.photoURL = from.photoURL
    if (typeof from.version === 'number') to.version = from.version
    if (dayjs.isDayjs(from.createdAt)) to.createdAt = dayjs(from.createdAt)
    if (dayjs.isDayjs(from.updatedAt)) to.updatedAt = dayjs(from.updatedAt)
    return to as User
  }

  export function clone(source: DeepReadonly<User>): User {
    return populate(source, {})
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AuthDataResult, SetUserInfoResult, SetUserInfoResultStatus, User, UserInput }
