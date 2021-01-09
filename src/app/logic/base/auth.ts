import { DeepPartial, DeepReadonly, Entities, pickProps } from 'web-base-lib'
import { TimestampEntity, generateEntityId } from '@/app/logic/base/base'
import dayjs from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface UserInfo extends TimestampEntity {
  email: string
  emailVerified: boolean
  isAppAdmin: boolean
  publicProfile: PublicProfile
}

enum AuthStatus {
  None = 'None',
  WaitForEmailVerified = 'WaitForEmailVerified',
  WaitForEntry = 'WaitForEntry',
  Available = 'Available',
}

interface PublicProfile extends TimestampEntity {
  displayName: string
  photoURL?: string
}

interface UserInfoInput {
  fullName: string
  displayName: string
}

namespace UserInfoInput {
  export function rigidify<T extends UserInfoInput | undefined>(input?: UserInfoInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['fullName', 'displayName']) as T
  }
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace UserInfo {
  export function generateId(): string {
    return generateEntityId(Entities.Users.Name)
  }

  export function populate(from: DeepPartial<DeepReadonly<UserInfo>>, to: DeepPartial<UserInfo>): UserInfo {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.email === 'string') to.email = from.email
    if (typeof from.emailVerified === 'boolean') to.emailVerified = from.emailVerified
    if (typeof from.isAppAdmin === 'boolean') to.isAppAdmin = from.isAppAdmin
    if (dayjs.isDayjs(from.createdAt)) to.createdAt = dayjs(from.createdAt)
    if (dayjs.isDayjs(from.updatedAt)) to.updatedAt = dayjs(from.updatedAt)
    if (from.publicProfile) {
      to.publicProfile = to.publicProfile ?? ({} as any)
      if (typeof from.publicProfile.id === 'string') to.publicProfile!.id = from.publicProfile.id
      if (typeof from.publicProfile.displayName === 'string') to.publicProfile!.displayName = from.publicProfile.displayName
      if (typeof from.publicProfile.photoURL === 'string') to.publicProfile!.photoURL = from.publicProfile.photoURL
      if (dayjs.isDayjs(from.publicProfile.createdAt)) to.publicProfile!.createdAt = dayjs(from.publicProfile.createdAt)
      if (dayjs.isDayjs(from.publicProfile.updatedAt)) to.publicProfile!.updatedAt = dayjs(from.publicProfile.updatedAt)
    }
    return to as UserInfo
  }

  export function clone(source: DeepReadonly<UserInfo>): UserInfo {
    return populate(source, {})
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AuthStatus, PublicProfile, UserInfo, UserInfoInput }
