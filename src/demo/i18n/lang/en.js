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
  serviceWorker: {
    ready: 'ServiceWorker was launched from the cache.',
    installing: 'ServiceWorker is installing.',
    updating: 'ServiceWorker is updating.',
    installed: 'ServiceWorker has been installed.',
    updated: 'ServiceWorker has been updated.',
    active: 'ServiceWorker is now active. You can now operate ServiceWorker.',
    offline: 'ServiceWorker is running in offline mode because it cannot connect to the server.',
    error: 'An error occurred during ServiceWorker registration.',
  },
})
