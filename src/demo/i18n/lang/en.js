import merge from 'lodash/merge'

export default merge(require('@/app/i18n/lang/en').default, {
  app: {
    updated: 'The application has been updated.',
  },
  abc: {
    hello: 'Hi {name}!',
    today: 'Today is {date}.',
  },
  shop: {
    products: 'Products',
    yourCurt: 'Your Curt',
    price: 'Price',
    stock: 'Stock',
    total: 'Total',
    checkout: 'Checkout',
  },
})
