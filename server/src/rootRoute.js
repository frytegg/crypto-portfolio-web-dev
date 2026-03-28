/**
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
async function rootRoutes(fastify) {
  fastify.get('/', async (_request, _reply) => {
    return { hello: 'world' }
  })
}

export default rootRoutes
