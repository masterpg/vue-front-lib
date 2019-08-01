import * as cors from 'cors'
import * as functions from 'firebase-functions'
const options = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true)
      return
    }

    if (!origin) {
      callback(new Error('Not allowed empty origin by CORS.'))
    } else {
      const whitelist = functions.config().cors.whitelist.split(',')
      if (whitelist.length === 0 || whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS.'))
      }
    }
  },
}

export default function(origin: boolean) {
  if (origin) {
    return cors(options)
  } else {
    return cors()
  }
}
