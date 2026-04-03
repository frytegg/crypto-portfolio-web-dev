import mongoose from 'mongoose'

import Holding from './holding-schema.js'

// Valide et normalise les données d'un holding (création ou update partiel).
// Retourne { data } en cas de succès, { error } sinon.
// Exporté pour être testé unitairement.
export function parseHoldingBody(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object') {
    return { error: 'Corps de requête invalide' }
  }

  const fields = ['symbol', 'coingeckoId', 'quantity', 'purchasePrice', 'purchaseDate', 'notes']
  const data = {}

  for (const field of fields) {
    if (body[field] !== undefined) {
      data[field] = body[field]
    }
  }

  if (!partial) {
    for (const required of ['symbol', 'coingeckoId', 'quantity', 'purchasePrice']) {
      if (data[required] === undefined || data[required] === null || data[required] === '') {
        return { error: `Le champ "${required}" est requis` }
      }
    }
  }

  if (data.symbol !== undefined) {
    if (typeof data.symbol !== 'string') {
      return { error: 'symbol doit être une chaîne' }
    }
    data.symbol = data.symbol.trim().toUpperCase()
    if (data.symbol.length === 0 || data.symbol.length > 16) {
      return { error: 'symbol doit faire 1 à 16 caractères' }
    }
  }

  if (data.coingeckoId !== undefined) {
    if (typeof data.coingeckoId !== 'string') {
      return { error: 'coingeckoId doit être une chaîne' }
    }
    data.coingeckoId = data.coingeckoId.trim().toLowerCase()
    if (data.coingeckoId.length === 0 || data.coingeckoId.length > 64) {
      return { error: 'coingeckoId doit faire 1 à 64 caractères' }
    }
  }

  if (data.quantity !== undefined) {
    const quantity = Number(data.quantity)
    if (!Number.isFinite(quantity) || quantity < 0) {
      return { error: 'quantity doit être un nombre positif' }
    }
    data.quantity = quantity
  }

  if (data.purchasePrice !== undefined) {
    const price = Number(data.purchasePrice)
    if (!Number.isFinite(price) || price < 0) {
      return { error: 'purchasePrice doit être un nombre positif' }
    }
    data.purchasePrice = price
  }

  if (data.purchaseDate !== undefined) {
    const date = new Date(data.purchaseDate)
    if (Number.isNaN(date.getTime())) {
      return { error: 'purchaseDate doit être une date valide' }
    }
    data.purchaseDate = date
  }

  if (data.notes !== undefined) {
    if (typeof data.notes !== 'string') {
      return { error: 'notes doit être une chaîne' }
    }
    data.notes = data.notes.slice(0, 500)
  }

  return { data }
}

function holdingsRoutes(app) {
  // toutes les routes holdings sont protégées
  app.addHook('onRequest', app.authenticate)

  app.get('', async (request, reply) => {
    const holdings = await Holding.find({ userId: request.currentUser.id })
      .sort({ createdAt: -1 })

    return reply.send({
      items: holdings.map(h => h.toPublicJSON()),
    })
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params

    if (!mongoose.isValidObjectId(id)) {
      return reply.status(400).send({ error: 'ID invalide' })
    }

    const holding = await Holding.findOne({
      _id: id,
      userId: request.currentUser.id,
    })

    if (!holding) {
      return reply.status(404).send({ error: 'Position introuvable' })
    }

    return reply.send({ holding: holding.toPublicJSON() })
  })

  app.post('', async (request, reply) => {
    const { data, error } = parseHoldingBody(request.body)
    if (error) {
      return reply.status(400).send({ error })
    }

    const holding = await Holding.create({
      ...data,
      userId: request.currentUser.id,
    })

    return reply.status(201).send({ holding: holding.toPublicJSON() })
  })

  app.put('/:id', async (request, reply) => {
    const { id } = request.params

    if (!mongoose.isValidObjectId(id)) {
      return reply.status(400).send({ error: 'ID invalide' })
    }

    const { data, error } = parseHoldingBody(request.body, { partial: true })
    if (error) {
      return reply.status(400).send({ error })
    }

    const holding = await Holding.findOneAndUpdate(
      { _id: id, userId: request.currentUser.id },
      { $set: data },
      { new: true, runValidators: true },
    )

    if (!holding) {
      return reply.status(404).send({ error: 'Position introuvable' })
    }

    return reply.send({ holding: holding.toPublicJSON() })
  })

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params

    if (!mongoose.isValidObjectId(id)) {
      return reply.status(400).send({ error: 'ID invalide' })
    }

    const deleted = await Holding.findOneAndDelete({
      _id: id,
      userId: request.currentUser.id,
    })

    if (!deleted) {
      return reply.status(404).send({ error: 'Position introuvable' })
    }

    return reply.send({ message: 'Position supprimée' })
  })
}

export default holdingsRoutes
