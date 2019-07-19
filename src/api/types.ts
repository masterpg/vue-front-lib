//----------------------------------------------------------------------
//
//  APIs
//
//----------------------------------------------------------------------

export interface API {
  readonly shop: ShopAPI
  readonly hello: HelloAPI
}

export interface ShopAPI {
  getProducts(): Promise<Product[]>

  buyProducts(products: Array<{ id: string; quantity: number }>): Promise<void>
}

export interface HelloAPI {
  publicHello(message: string): Promise<string>

  siteHello(message: string): Promise<string>

  authHello(message: string, idToken: string): Promise<string>
}

//----------------------------------------------------------------------
//
//  Entities
//
//----------------------------------------------------------------------

export interface Product {
  id: string
  title: string
  price: number
  inventory: number
}
