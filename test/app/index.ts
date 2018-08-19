(async () => {
  mocha.setup({ ui: 'tdd' });

  const utils = await import('../../src/app/base/utils');
  const config = await import('../../src/app/base/config');
  const apis = await import('../../src/app/apis');
  const stores = await import('../../src/app/stores');

  utils.init();
  config.init();
  apis.init();
  stores.init();

  await Promise.all([
    import('./api/shop-api'),
    import('./stores/cart-store'),
    import('./stores/product-store'),
  ]);

  mocha.run();
})();
