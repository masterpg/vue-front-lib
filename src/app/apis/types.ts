//----------------------------------------------------------------------
//
//  APIs
//
//----------------------------------------------------------------------

export interface APIs {
  readonly shop: ShopAPI;
}

export interface ShopAPI {
  getProducts(): Promise<Product[]>;

  buyProducts(products: Array<{ id: number; quantity: number }>): Promise<void>;
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
