//----------------------------------------------------------------------
//
//  Apis
//
//----------------------------------------------------------------------

export interface Apis {
  readonly shop: ShopApi;
}

export interface ShopApi {
  getProducts(): Promise<Product[]>;

  buyProducts(products: Array<{ id: number, quantity: number }>): Promise<void>;
}

//----------------------------------------------------------------------
//
//  Entities
//
//----------------------------------------------------------------------

export interface Product {
  id: number;
  title: string;
  price: number;
  inventory: number;
}
