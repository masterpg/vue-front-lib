window.firebase = require('@firebase/testing')
import { Entity, FirestoreEx } from '@/firestore-ex'
import { WebFirestoreTestUtil } from './util'

const util = new WebFirestoreTestUtil()
const db = util.db
const collectionPath = 'batch'
const firestoreEx = new FirestoreEx(db)

interface TestDoc extends Entity {
  title: string
}

afterAll(async () => {
  await util.deleteApps()
})

describe('batch', () => {
  const dao = firestoreEx.collection<TestDoc>({ path: collectionPath })

  afterEach(async () => {
    await util.clearFirestoreData()
  })

  it('bulkAdd', async () => {
    const docs = [{ title: 'aaa' }, { title: 'bbb' }, { title: 'ccc' }]
    await dao.bulkAdd(docs)
    const fetchedDocs = await dao.fetchAll()

    const actualTitles = fetchedDocs.map(doc => doc.title).sort()
    const expectTitles = docs.map(doc => doc.title).sort()
    expect(actualTitles).toEqual(expectTitles)
  })

  it('bulkSet', async () => {
    const docs = [
      { id: 'test1', title: 'aaa' },
      { id: 'test2', title: 'bbb' },
      { id: 'test3', title: 'ccc' },
    ]
    await dao.bulkSet(docs)

    const actualDocs = await dao.fetchAll()
    expect(actualDocs).toEqual(docs)
  })

  it('bulkDelete', async () => {
    const docs = [
      { id: 'test1', title: 'aaa' },
      { id: 'test2', title: 'bbb' },
      { id: 'test3', title: 'ccc' },
    ]
    await dao.set(docs[0])
    await dao.set(docs[1])
    await dao.set(docs[2])

    const docIds = docs.map(doc => doc.id)
    await dao.bulkDelete(docIds)

    const actualDocs = await dao.fetchAll()
    expect(actualDocs).toEqual([])
  })
})
