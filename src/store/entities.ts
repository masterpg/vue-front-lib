import * as api from '../api/shop-api';

//--------------------------------------------------
//  Entities
//--------------------------------------------------

export type Product = api.Product;

export interface CartProduct {
  id: number;
  title: string;
  price: number;
  quantity: number;
}

//--------------------------------------------------
//  Enumerations
//--------------------------------------------------

export enum CheckoutStatus {
  None = 'none',
  Failed = 'failed',
  Successful = 'successful',
}
