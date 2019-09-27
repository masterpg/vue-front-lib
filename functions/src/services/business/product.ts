import * as admin from 'firebase-admin'
import { Injectable } from '@nestjs/common'
import { Product } from './types'

@Injectable()
export class ProductService {
  async find(ids?: string[]): Promise<Product[]> {
    const db = admin.firestore()
    if (ids && ids.length) {
      const promises: Promise<Product | undefined>[] = []
      for (const id of ids) {
        promises.push(
          (async () => {
            const doc = await db
              .collection('products')
              .doc(id)
              .get()
            if (doc.exists) {
              return { id: doc.id, ...doc.data() } as Product
            }
            return undefined
          })()
        )
      }
      return (await Promise.all(promises)).reduce(
        (result, product) => {
          if (product) {
            result.push(product)
          }
          return result
        },
        [] as Product[]
      )
    } else {
      const products: Product[] = []
      const snapshot = await db.collection('products').get()
      snapshot.forEach(doc => {
        const product = { id: doc.id, ...doc.data() } as Product
        products.push(product)
      })
      return products
    }
  }
}
