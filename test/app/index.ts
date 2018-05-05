(async () => {
  mocha.setup({ ui: 'tdd' });

  const apis = await import('../../src/app/apis');
  const stores = await import('../../src/app/stores');
  apis.init();
  stores.init();

  await Promise.all([
    import('./api/shop-api'),
    import('./stores/cart-store'),
    import('./stores/product-store'),
  ]);

  mocha.run();
})();
