import * as firebase from '@firebase/testing'
import { FirestoreExOptions, Timestamp, TimestampEntity } from '@/firestore-ex'
import dayjs, { Dayjs } from 'dayjs'
import crypto from 'crypto'

export class WebFirestoreTestUtil {
  projectId: string
  uid: string
  db: firebase.firestore.Firestore

  constructor() {
    // Use random projectId to separate emulator firestore namespace for concurrent testing
    const randomStr = crypto.randomBytes(10).toString('hex')
    this.projectId = `test-${randomStr}`
    this.uid = 'test-user'

    // Setup web Firestore and admin Firestore with using emulator
    this.db = firebase
      .initializeTestApp({
        projectId: this.projectId,
        auth: { uid: this.uid },
      })
      .firestore()
  }

  // Clear emulator Firestore data
  // Use in 'afterEach'
  async clearFirestoreData() {
    await firebase.clearFirestoreData({ projectId: this.projectId })
  }

  // Delete firebase listener
  // Use in 'afterAll'
  async deleteApps() {
    await Promise.all(firebase.apps().map(app => app.delete()))
  }
}
