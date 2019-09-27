import * as functions from 'firebase-functions'
import { SUPPORTED_REGIONS } from 'firebase-functions'

export const config = new (class {
  functions = new (class {
    get region(): typeof SUPPORTED_REGIONS[number] {
      return functions.config().functions.region || ''
    }
  })()

  readonly storage = new (class {
    get bucket(): string {
      return functions.config().storage.bucket || ''
    }
  })()

  readonly cors = new (class {
    get whitelist(): string[] {
      if (functions.config().cors && functions.config().cors.whitelist) {
        return functions
          .config()
          .cors.whitelist.split(',')
          .map((item: string) => item.trim())
      }
      return []
    }
  })()

  readonly role = new (class {
    get admins(): string[] {
      if (functions.config().role && functions.config().role.admins) {
        return functions
          .config()
          .role.admins.split(',')
          .map((item: string) => item.trim())
      }
      return []
    }
  })()
})()
