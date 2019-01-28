import { BaseStore } from '@/stores/base'
import { Component } from 'vue-property-decorator'
import { NoCache } from '@/base/component'
import { Product, ProductStore } from '@/stores/types'

export interface ProductState {
  all: Product[]
}

@Component
export class ProductStoreImpl extends BaseStore<ProductState> implements ProductStore {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
    this.f_initState({
      all: [],
    })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get allProducts(): Product[] {
    return this.$utils.cloneDeep(this.f_state.all)
  }

  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  async created() {
    await this.getAllProducts()

    // "products"の変更をリッスン
    this.f_db.collection('products').onSnapshot((snapshot) => {
      snapshot.forEach((doc) => {
        // ローカルデータ(バックエンドにまだ書き込みされていないデータ)は無視する
        if (doc.metadata.hasPendingWrites) return
        // 取得した商品をStateへ書き込み
        const stateProduct = this.m_getStateProductById(doc.id)
        if (stateProduct) {
          this.$utils.assignIn(stateProduct, doc.data())
        } else {
          const product = this.$utils.assignIn({ id: doc.id }, doc.data()) as Product
          this.f_state.all.push(product)
        }
      })
    })
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getProductById(productId: string): Product | undefined | null {
    const stateProduct = this.m_getStateProductById(productId)
    return this.$utils.cloneDeep(stateProduct)
  }

  decrementProductInventory(productId: string): void {
    const stateProduct = this.m_getStateProductById(productId)
    if (stateProduct) {
      stateProduct.inventory--
    }
  }

  async getAllProducts(): Promise<void> {
    const products: Product[] = []
    const snapshot = await this.f_db.collection('products').get()
    snapshot.forEach((doc) => {
      const product = this.$utils.assignIn({ id: doc.id }, doc.data()) as Product
      products.push(product)
    })
    this.f_state.all = products
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  m_getStateProductById(productId: string): Product | undefined | null {
    return this.f_state.all.find((item) => item.id === productId)
  }
}

export function newProductStore(): ProductStore {
  return new ProductStoreImpl()
}
