import mongoose from 'mongoose'

import config from '../config.js'

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
async function mongoosePlugin(fastify) {
  fastify.log.info(`Connecting to MongoDB...`)

  await mongoose.connect(config.mongoUri)
  fastify.log.info('Connected to MongoDB')

  fastify.addHook('onClose', async () => {
    await mongoose.connection.close()
  })
}

export default mongoosePlugin
