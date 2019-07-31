import * as firebaseAdmin from 'firebase-admin'
import { Query, Resolver } from 'type-graphql'
import { Product } from './types'
const assign = require('lodash/assign')

@Resolver(of => Product)
export class ProductResolver {
  @Query(returns => [Product])
  async products(): Promise<Product[]> {
    const products: Product[] = []
    const db = firebaseAdmin.firestore()
    const snapshot = await db.collection('products').get()
    snapshot.forEach(doc => {
      const product = assign({ id: doc.id }, doc.data()) as Product
      products.push(product)
    })
    return products
  }
}
