import Fastify from 'fastify'

import config from './config.js'
import holdingsRoutes from './holdings/holdings-routes.js'
import envToLogger from './logger.js'
import authPlugin from './plugins/auth.js'
import corsPlugin from './plugins/cors.js'
import mongoosePlugin from './plugins/mongoose.js'
import portfolioRoutes from './portfolio/portfolio-routes.js'
import rootRoutes from './rootRoute.js'
import authRoutes from './users/auth-routes.js'
import usersRoutes from './users/users-routes.js'

async function buildApp() {
  const fastify = Fastify({
    logger: envToLogger[config.env] ?? true,
  })

  await fastify.register(corsPlugin)
  await fastify.register(authPlugin)
  await fastify.register(mongoosePlugin)
  fastify.register(authRoutes, { prefix: '/auth' })
  fastify.register(usersRoutes, { prefix: '/users' })
  fastify.register(holdingsRoutes, { prefix: '/holdings' })
  fastify.register(portfolioRoutes, { prefix: '/portfolio' })
  fastify.register(rootRoutes)

  return fastify
}

export default buildApp
