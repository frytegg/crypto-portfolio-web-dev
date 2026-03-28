import { randomBytes } from 'node:crypto'

import config from '../config.js'
import { sendRegistrationEmail } from '../services/mailer.js'
import User from '../users/user-schema.js'
import { hashPassword, verifyPassword } from '../utils/crypto.js'

const emailRegex = /^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|".+")@(?:\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|(?:[a-z\-0-9]+\.)+[a-z]{2,})$/i

function buildVerificationUrl(validationToken) {
  return `${config.appBaseUrl}/users/verify-email?token=${validationToken}`
}

function withVerificationDebugData(payload, validationToken) {
  if (config.env === 'production') {
    return payload
  }

  return {
    ...payload,
    verificationToken: validationToken,
    verificationUrl: buildVerificationUrl(validationToken),
  }
}

async function sendVerificationEmail(app, email, validationToken) {
  const verificationUrl = buildVerificationUrl(validationToken)
  const emailInfo = await sendRegistrationEmail({
    email,
    verificationUrl,
  })

  app.log.info({
    msg: 'Registration email sent',
    email,
    messageId: emailInfo.messageId,
  })
}

/**
 *
 * @param {import('fastify').FastifyInstance} app
 */
function authRoutes(app) {
  app.post('/register', async (request, reply) => {
    // Récupérer et valider les données d'inscription
    const { email, password, username } = request.body

    // Validation basique des champs
    if (!email || !password || !username) {
      return reply.status(400).send({ error: 'Email, password et username requis' })
    }

    // Normaliser l'email (trim et lowercase)
    const normalizedEmail = email.trim().toLowerCase()

    // Valider le format de l'email
    if (!emailRegex.test(normalizedEmail)) {
      return reply.status(400).send({ error: 'Email invalide' })
    }

    // Vérifier si l'utilisateur existe déjà
    // TODO: faire une vérification sur le username aussi
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return reply.status(409).send({ error: 'Cet email est déjà utilisé' })
    }

    // Créer le hash du mot de passe et le token de validation
    const passwordHash = await hashPassword(password)
    const validationToken = randomBytes(32).toString('hex')

    // Créer l'utilisateur dans la base de données (compte non validé)
    const user = await User.create({
      email: normalizedEmail,
      username: `${username}-${validationToken.slice(0, 6)}`,
      passwordHash,
      validationToken,
    })

    try {
      await sendVerificationEmail(app, normalizedEmail, validationToken)
    } catch (error) {
      app.log.error({
        err: error,
        email: normalizedEmail,
      }, 'Failed to send registration email')

      return reply.status(503).send(withVerificationDebugData({
        error: 'Compte créé, mais l\'email de validation n\'a pas pu être envoyé. Réessayez plus tard.',
        email: user.email,
      }, validationToken))
    }

    return reply.status(201).send(withVerificationDebugData({
      message: 'Utilisateur créé avec succès. Veuillez vérifier votre email pour confirmer votre compte.',
      email: user.email,
    }, validationToken))
  })

  app.post('/resend-verification-email', async (request, reply) => {
    // Récupérer l'email de l'utilisateur
    const { email } = request.body

    // Validation basique de l'email
    if (!email) {
      return reply.status(400).send({ error: 'Email requis' })
    }

    // Normaliser l'email (trim et lowercase)
    const normalizedEmail = email.trim().toLowerCase()

    // Valider le format de l'email
    if (!emailRegex.test(normalizedEmail)) {
      return reply.status(400).send({ error: 'Email invalide' })
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findOne({ email: normalizedEmail })

    // Vérifier que l'utilisateur existe
    if (!user) {
      return reply.status(404).send({ error: 'Utilisateur introuvable' })
    }

    // Vérifier que l'email n'est pas déjà validé
    if (user.emailVerified) {
      return reply.status(409).send({ error: 'Adresse email déjà validée' })
    }

    // Générer un nouveau token de validation si l'utilisateur n'en a pas déjà un (ex: si le token précédent a expiré ou a été perdu)
    if (!user.validationToken) {
      user.validationToken = randomBytes(32).toString('hex')
      await user.save()
    }

    // Envoyer l'email de validation
    try {
      await sendVerificationEmail(app, user.email, user.validationToken)
    } catch (error) {
      app.log.error({
        err: error,
        email: user.email,
      }, 'Failed to resend registration email')

      // Renvoyer une 503 pour indiquer que le service de mail est temporairement indisponible, mais sans révéler que l'utilisateur existe ou pas (pour éviter les attaques de type enumeration)
      return reply.status(503).send(withVerificationDebugData({
        error: 'L’email de validation n’a pas pu être envoyé. Réessayez plus tard.',
      }, user.validationToken))
    }

    return reply.send(withVerificationDebugData({
      message: 'Email de validation renvoyé avec succès.',
      email: user.email,
    }, user.validationToken))
  })

  app.post('/login', async (request, reply) => {
    // Récupérer et valider les données de connexion
    const { email, password } = request.body

    // Validation basique des champs
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email et mot de passe requis' })
    }

    // Normaliser l'email (trim et lowercase)
    const normalizedEmail = email.trim().toLowerCase()
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findOne({ email: normalizedEmail })

    // Vérifier que l'utilisateur existe
    if (!user) {
      return reply.status(401).send({ error: 'Identifiants invalides' })
    }

    // Vérifier que le mot de passe est correct
    const passwordMatches = await verifyPassword(password, user.passwordHash)
    if (!passwordMatches) {
      return reply.status(401).send({ error: 'Identifiants invalides' })
    }

    // Vérifier que l'email est validé
    if (!user.emailVerified) {
      return reply.status(403).send({ error: 'Veuillez valider votre adresse email avant de vous connecter' })
    }

    // Générer un token JWT...
    const token = await reply.jwtSign({
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
    }, {
      expiresIn: '300s',
    })

    // ...et le stocker dans un cookie sécurisé
    reply.setCookie(config.jwt.cookieName, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: config.env === 'production',
    })

    return reply.send({ message: 'Authentification réussie' })
  })
}

export default authRoutes
