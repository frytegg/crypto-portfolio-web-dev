// Script d'init joué au premier démarrage du container Mongo (volume vide).
// Crée le user applicatif utilisé par le backend en dev local.
// Si on change ces valeurs, il faut reset le volume : docker compose down -v
db = db.getSiblingDB('crypto_portfolio')

db.createUser({
  user: 'crypto_app',
  pwd: 'dev_password_2026',
  roles: [{ role: 'dbOwner', db: 'crypto_portfolio' }],
})
