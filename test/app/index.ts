(async () => {
  mocha.setup({ ui: 'tdd' });

  const apis = await import('../../src/app/apis');
  const config = await import('../../src/app/config');
  const stores = await import('../../src/app/stores');
  const utils = await import('../../src/app/utils');

  config.init();
  utils.init();
  apis.init();
  stores.init();

  await Promise.all([
    import('./api/shop-api'),
    import('./stores/cart-store'),
    import('./stores/product-store'),
  ]);

  mocha.run();
})();
