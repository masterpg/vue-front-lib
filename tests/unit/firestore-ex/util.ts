import * as firebaseTesting from '@firebase/rules-unit-testing'
import { Firestore } from '@/firestore-ex/types'
const crypto = require('crypto')

export class WebFirestoreTestUtil {
  projectId: string
  uid: string
  db: Firestore

  constructor() {
    // Use random projectId to separate emulator firestore namespace for concurrent testing
    const randomStr = crypto.randomBytes(10).toString('hex')
    this.projectId = `test-${randomStr}`
    this.uid = 'test-user'

    // Setup web Firestore and admin Firestore with using emulator
    this.db = firebaseTesting
      .initializeTestApp({
        projectId: this.projectId,
        auth: { uid: this.uid },
      })
      .firestore()
  }

  // Clear emulator Firestore data
  // Use in 'afterEach'
  async clearFirestoreData() {
    await firebaseTesting.clearFirestoreData({ projectId: this.projectId })
  }

  // Delete firebase listener
  // Use in 'afterAll'
  async deleteApps() {
    await Promise.all(firebaseTesting.apps().map(app => app.delete()))
  }
}
