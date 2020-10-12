window.firebase = require('@firebase/testing')
import { EncodedObject, Entity, FieldValue, FirestoreEx, Timestamp } from '@/firestore-ex'
import dayjs, { Dayjs } from 'dayjs'
import { WebFirestoreTestUtil } from './util'

const util = new WebFirestoreTestUtil()
const db = util.db
const collectionPath = 'encode-decode'
const firestoreEx = new FirestoreEx(db)

interface Book extends Entity {
  bookTitle: string
  publishedAt: Dayjs
  stocks: number
  description?: string
}

interface BookDoc {
  book_title: string
  publishedAt: Timestamp
  stocks: number
  description?: string
}

afterAll(async () => {
  await util.deleteApps()
})

describe('encode and decode', () => {
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
      if (typeof book.stocks !== 'undefined') {
        result.stocks = book.stocks
      }
      if (typeof book.description === 'string') {
        result.description = book.description
      }
      return result
    },
    decode: doc => {
      return {
        id: doc.id,
        bookTitle: doc.book_title,
        publishedAt: dayjs(doc.publishedAt.toDate()), // Firestore timestamp to JS Date
        stocks: doc.stocks as number,
        description: doc.description,
      }
    },
  })

  const now = dayjs()

  afterEach(async () => {
    await util.clearFirestoreData()
  })

  it('add with encode/decode', async () => {
    const doc = {
      bookTitle: 'add',
      publishedAt: now,
      stocks: 10,
    }
    const addedBookId = await dao.add(doc)

    const fetchedBook = (await dao.fetch(addedBookId))!
    expect(fetchedBook).toEqual({
      id: addedBookId,
      bookTitle: doc.bookTitle,
      publishedAt: doc.publishedAt,
      stocks: doc.stocks,
    })
  })

  it('set with encode/decode', async () => {
    const doc = {
      id: 'test1',
      bookTitle: 'set',
      publishedAt: now,
      stocks: 10,
    }
    const setBookId = await dao.set(doc)

    const fetchedBook = (await dao.fetch(setBookId))!
    expect(fetchedBook).toEqual({
      id: setBookId,
      bookTitle: doc.bookTitle,
      publishedAt: doc.publishedAt,
      stocks: doc.stocks,
    })
  })

  it('update with encode/decode', async () => {
    const baseStocks = 10
    const bookId = await dao.add({
      bookTitle: 'add',
      publishedAt: now,
      stocks: baseStocks,
    })
    const addedBook = (await dao.fetch(bookId))!

    const updatedTitle = 'update'
    const incrementalStocks = 5
    const updatedDescription = 'hogehoge'
    await dao.update({
      id: bookId,
      bookTitle: updatedTitle,
      stocks: FieldValue.increment(incrementalStocks),
      description: updatedDescription,
    })

    const fetchedBook = (await dao.fetch(bookId))!
    expect(fetchedBook.bookTitle).toBe(updatedTitle)
    expect(fetchedBook.stocks).toBe(baseStocks + incrementalStocks)
    expect(fetchedBook.description).toBe(updatedDescription)
  })
})
