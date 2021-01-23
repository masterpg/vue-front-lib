const path = require('path')
const dayjs = require('dayjs')
const jsonServer = require('json-server')
const index = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()
const db = router.db

// デフォルトのミドルウェアを設定(logger, static, cors and no-cache)
index.use(middlewares)

// POST、PUT、PATCH、に必要となるボディパーサーを設定
index.use(jsonServer.bodyParser)

//========================================================================
//
//  Helpers
//
//========================================================================

function getUserId(req) {
  const authorization = req.get('Authorization')
  if (!(authorization && authorization.startsWith('Bearer '))) {
    throw new Error('Authorized header is not set.')
  }

  const encodedIdToken = authorization.split('Bearer ')[1]
  if (!encodedIdToken.trim()) {
    throw new Error('The ID token could not be obtained from authorization header.')
  }

  let idTokenObject
  try {
    idTokenObject = JSON.parse(encodedIdToken)
  } catch (err) {
    throw new Error('The format of the ID token is incorrect.')
  }

  if (!idTokenObject.uid) {
    throw new Error('The user id could not be obtained from authorization header.')
  }

  return idTokenObject.uid
}

function generateId() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let autoId = ''
  for (let i = 0; i < 20; i++) {
    autoId += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return autoId
}

//========================================================================
//
//  REST APIs
//
//========================================================================

index.put('/testData', (req, res, next) => {
  const data = req.body

  for (const key in data) {
    db.get(key).remove().write()
    if (Array.isArray(data[key])) {
      db.get(key)
        .push(...data[key])
        .write()
    } else {
      db.set(key, data[key]).write()
    }
  }

  res.header('Content-Type', 'application/json')
  res.send(true)
})

index.get('/products', (req, res, next) => {
  const ids = req.query.ids

  let products = []
  if (ids) {
    for (const id of ids) {
      const product = db.get('products').find({ id }).value()
      product && products.push(product)
    }
  } else {
    products = db.get('products').value()
  }

  res.header('Content-Type', 'application/json')
  res.send(products)
})

index.get('/cartItems', (req, res, next) => {
  const uid = getUserId(req)
  const ids = req.query.ids

  let cartItems = []
  if (ids) {
    for (const id of ids) {
      const cartItem = db.get('cartItems').find({ id, uid }).value()
      cartItem && cartItems.push(cartItem)
    }
  } else {
    cartItems = db.get('cartItems').filter({ uid }).value()
  }

  res.header('Content-Type', 'application/json')
  res.send(cartItems)
})

index.post('/cartItems', (req, res, next) => {
  const uid = getUserId(req)
  const inputs = req.body

  const result = []
  for (const input of inputs) {
    let cartItem = db.get('cartItems').find({ uid, productId: input.productId }).value()
    if (cartItem) {
      throw new Error(`The CartItem trying to add already exists: ${JSON.stringify({ uid, productId: input.productId })}`)
    }

    let product = db.get('products').find({ id: input.productId }).value()
    if (!product) {
      throw new Error(`There are no Product: ${JSON.stringify({ id: input.productId })}`)
    }

    const cartItemId = generateId()
    cartItem = db
      .get('cartItems')
      .push({
        id: cartItemId,
        uid,
        productId: input.productId,
        title: input.title,
        price: input.price,
        quantity: input.quantity,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
      })
      .find({ id: cartItemId })
      .write()

    product = db
      .get('products')
      .find({ id: cartItem.productId })
      .assign({
        stock: product.stock - cartItem.quantity,
        updatedAt: dayjs().toISOString(),
      })
      .write()

    result.push({
      ...cartItem,
      product: { id: product.id, stock: product.stock },
    })
  }

  res.header('Content-Type', 'application/json')
  res.send(result)
})

index.put('/cartItems', (req, res, next) => {
  const uid = getUserId(req)
  const inputs = req.body

  const result = []
  for (const input of inputs) {
    let cartItem = db.get('cartItems').find({ id: input.id, uid }).value()
    if (!cartItem) {
      throw new Error(`There are no CartItem: ${JSON.stringify({ id: input.id, uid })}`)
    }

    const product = db.get('products').find({ id: cartItem.productId }).value()
    if (!product) {
      throw new Error(`There are no Product: ${JSON.stringify({ id: cartItem.productId })}`)
    }

    const addedQuantity = input.quantity - cartItem.quantity
    cartItem = db
      .get('cartItems')
      .find({ id: input.id, uid })
      .assign({
        quantity: input.quantity,
        updatedAt: dayjs().toISOString(),
      })
      .write()

    const stock = product.stock - addedQuantity
    db.get('products')
      .find({ id: cartItem.productId })
      .assign({
        stock,
        updatedAt: dayjs().toISOString(),
      })
      .write()

    result.push({
      ...cartItem,
      product: { id: product.id, stock },
    })
  }

  res.header('Content-Type', 'application/json')
  res.send(result)
})

index.delete('/cartItems', (req, res, next) => {
  const uid = getUserId(req)
  const cartItemIds = req.query.ids

  const result = []
  for (const cartItemId of cartItemIds) {
    const cartItem = db.get('cartItems').find({ id: cartItemId, uid }).value()
    if (!cartItem) {
      throw new Error(`There are no CartItem: ${JSON.stringify({ id: cartItemId, uid })}`)
    }

    const product = db.get('products').find({ id: cartItem.productId }).value()
    if (!cartItem) {
      throw new Error(`There are no Product: ${JSON.stringify({ id: cartItem.productId })}`)
    }

    db.get('cartItems').remove({ id: cartItemId }).write()

    const stock = product.stock + cartItem.quantity
    db.get('products')
      .find({ id: cartItem.productId })
      .assign({
        stock,
        updatedAt: dayjs().toISOString(),
      })
      .write()

    result.push({
      ...cartItem,
      product: { id: product.id, stock },
    })
  }

  res.header('Content-Type', 'application/json')
  res.send(result)
})

index.put('/cartItems/checkout', (req, res, next) => {
  const uid = getUserId(req)

  db.get('cartItems').remove({ uid }).write()

  res.header('Content-Type', 'application/json')
  res.send(true)
})

//========================================================================
//
//  Server setup
//
//========================================================================

// json-serveのデフォルトルーターを設定
index.use(router)

// json-server起動
index.listen(5031, () => {
  console.log('API Server running at: http://localhost:5031/')
})
