//----------------------------------------------------------------------
//
//  GraphQL
//
//----------------------------------------------------------------------

export interface GQL {
  readonly query: GQLQuery
  readonly mutation: GQLMutation
}

export interface GQLQuery {
  products(): Promise<GQLProduct[]>
  cartItems(): Promise<GQLCartItem[]>
}

export interface GQLMutation {
  addCartItems(
    items: {
      id?: string
      productId: string
      title: string
      price: number
      quantity: number
    }[]
  ): Promise<GQLCartItem[]>

  updateCartItems(items: { id: string; quantity: number }[]): Promise<GQLCartItem[]>

  removeCartItems(cartItemIds: string[]): Promise<GQLCartItem[]>

  checkoutCart(): Promise<boolean>
}

//----------------------------------------------------------------------
//
//  Value objects
//
//----------------------------------------------------------------------

export interface GQLProduct {
  id: string
  title: string
  price: number
  stock: number
}

export interface GQLCartItem {
  id: string
  userId: string
  productId: string
  title: string
  price: number
  quantity: number
}
