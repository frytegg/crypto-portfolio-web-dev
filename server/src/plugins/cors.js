import fastifyCors from '@fastify/cors'
import fp from 'fastify-plugin'

import config from '../config.js'

async function corsPlugin(app) {
  const allowedOrigins = config.corsOrigin
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)

  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // requêtes sans Origin (curl, Postman...) : on laisse passer
      if (!origin) {
        cb(null, true)
        return
      }
      if (allowedOrigins.includes(origin)) {
        cb(null, true)
        return
      }
      cb(new Error(`Origin ${origin} non autorisée par CORS`), false)
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
}

export default fp(corsPlugin)
