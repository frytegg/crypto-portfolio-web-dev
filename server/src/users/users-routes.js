import mongoose from 'mongoose'

import User from './user-schema.js'

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 20

function toPublicUser(user) {
  if (!user) {
    return null
  }
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function usersRoutes(app) {
  // Validation d'email via le token reçu par mail (route publique)
  app.get('/verify-email', async (request, reply) => {
    const { token } = request.query

    if (!token || typeof token !== 'string') {
      return reply.status(400).send({ error: 'Token manquant' })
    }

    const user = await User.findOne({ validationToken: token })

    if (!user) {
      return reply.status(404).send({ error: 'Token invalide ou expiré' })
    }

    if (user.emailVerified) {
      return reply.send({ message: 'Email déjà validé', email: user.email })
    }

    user.emailVerified = true
    user.validationToken = null
    await user.save()

    return reply.send({
      message: 'Email validé avec succès',
      email: user.email,
    })
  })

  // Retourne l'utilisateur connecté
  app.get('/me', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    return reply.send({ user: request.currentUser })
  })

  // Liste paginée des utilisateurs
  app.get('', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const page = Math.max(1, Number(request.query.page) || 1)
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(request.query.pageSize) || DEFAULT_PAGE_SIZE),
    )
    const search = typeof request.query.search === 'string' ? request.query.search.trim() : ''

    const filter = search
      ? {
          $or: [
            { email: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
          ],
        }
      : {}

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ])

    return reply.send({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items: users.map(toPublicUser),
    })
  })

  app.get('/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params

    if (!mongoose.isValidObjectId(id)) {
      return reply.status(400).send({ error: 'ID invalide' })
    }

    const user = await User.findById(id).lean()

    if (!user) {
      return reply.status(404).send({ error: 'Utilisateur introuvable' })
    }

    return reply.send({ user: toPublicUser(user) })
  })

  // Suppression de compte : un utilisateur ne peut supprimer que le sien
  app.delete('/:id', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params

    if (!mongoose.isValidObjectId(id)) {
      return reply.status(400).send({ error: 'ID invalide' })
    }

    if (id !== request.currentUser.id) {
      return reply.status(403).send({ error: 'Vous ne pouvez supprimer que votre propre compte' })
    }

    const deleted = await User.findByIdAndDelete(id)

    if (!deleted) {
      return reply.status(404).send({ error: 'Utilisateur introuvable' })
    }

    reply.clearCookie('token', { path: '/' })

    return reply.send({ message: 'Compte supprimé avec succès' })
  })
}

export default usersRoutes
