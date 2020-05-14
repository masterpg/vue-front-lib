import { EncodedObject, Entity, FirestoreEx, Timestamp } from '../../../src/firestore-ex'
import { Dayjs } from 'dayjs'
import { WebFirestoreTestUtil } from './util'
import dayjs from 'dayjs'

const util = new WebFirestoreTestUtil()
const db = util.db
const collectionPath = 'on-snapshot'
const firestoreEx = new FirestoreEx(db)

interface Book extends Entity {
  id: string
  bookTitle: string
  publishedAt: Dayjs
}

interface BookDoc {
  book_title: string
  publishedAt: Timestamp
}

afterAll(async () => {
  await util.deleteApps()
})

describe('onSnapshot test', () => {
  const dao = firestoreEx.collection<Book, BookDoc>({
    path: collectionPath,
    encode: book => {
      const result: EncodedObject<BookDoc> = {}
      if (typeof book.bookTitle === 'string') {
        result.book_title = book.bookTitle
      }
      if (book.publishedAt) {
        const date = (book.publishedAt as Dayjs).toDate()
        result.publishedAt = Timestamp.fromDate(date)
      }
      return result
    },
    decode: doc => {
      return {
        id: doc.id,
        bookTitle: doc.book_title,
        publishedAt: dayjs(doc.publishedAt.toDate()),
      }
    },
  })
  let existsDoc: Book

  beforeEach(async () => {
    const addedDoc = {
      bookTitle: 'exists',
      publishedAt: dayjs(),
    }
    const addedId = await dao.add(addedDoc)
    existsDoc = (await dao.fetch(addedId))!
  })

  afterEach(async () => {
    await util.clearFirestoreData()
  })

  it('observe add change', async done => {
    const addedDoc = {
      bookTitle: 'add',
      publishedAt: dayjs(),
    }

    dao.onSnapshot((querySnapshot, toObject) => {
      querySnapshot.docChanges().forEach(change => {
        if (change.type === 'added' && change.doc.data().book_title === addedDoc.bookTitle) {
          const changedDoc = toObject(change.doc)
          expect(changedDoc).toEqual({
            id: expect.anything(),
            ...addedDoc,
          })
          done()
        }
      })
    })

    await new Promise(resolve => setTimeout(resolve, 100)) // for async stability
    await dao.add(addedDoc)
  })

  it('observe update changes', async done => {
    const updatedDoc = {
      id: existsDoc.id,
      bookTitle: 'update',
      publishedAt: existsDoc.publishedAt,
    }

    dao.onSnapshot((querySnapshot, toObject) => {
      querySnapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const changedDoc = toObject(change.doc)
          expect(changedDoc).toEqual(updatedDoc)
          done()
        }
      })
    })

    await new Promise(resolve => setTimeout(resolve, 100)) // for async stability
    await dao.update(updatedDoc)
  })

  it('observe delete change', async done => {
    // prepare specific doc for delete onSnapshot()
    // because onSnapshot() also triggered deleteCollection() events and it will be conflict.
    const deletedId = await dao.add({
      bookTitle: 'deleted',
      publishedAt: dayjs(),
    })
    const deletedDoc = (await dao.fetch(deletedId))!

    dao.onSnapshot((querySnapshot, toObject) => {
      querySnapshot.docChanges().forEach(change => {
        if (change.type === 'removed' && change.doc.id === deletedDoc.id) {
          const changedDoc = toObject(change.doc)
          expect(changedDoc).toEqual(deletedDoc)
          done()
        }
      })
    })

    await new Promise(resolve => setTimeout(resolve, 100)) // for async stability
    await dao.delete(deletedId)
  })
})
