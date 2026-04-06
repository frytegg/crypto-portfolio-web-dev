<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()

const form = reactive({
  email: '',
  username: '',
  password: '',
  passwordConfirm: '',
})

const submitting = ref(false)
const localError = ref(null)
const successData = ref(null)

async function handleSubmit() {
  localError.value = null

  if (!form.email || !form.username || !form.password) {
    localError.value = 'Tous les champs sont requis'
    return
  }

  if (form.password.length < 6) {
    localError.value = 'Le mot de passe doit faire au moins 6 caractères'
    return
  }

  if (form.password !== form.passwordConfirm) {
    localError.value = 'Les mots de passe ne correspondent pas'
    return
  }

  submitting.value = true
  const result = await auth.register({
    email: form.email.trim(),
    username: form.username.trim(),
    password: form.password,
  })
  submitting.value = false

  if (result.ok) {
    successData.value = result.data
  } else {
    localError.value = result.error
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-card">
      <h1>Créer un compte</h1>
      <p class="subtitle">Commencez à suivre votre portfolio crypto</p>

      <div v-if="successData" class="success">
        <p><strong>Compte créé !</strong></p>
        <p>{{ successData.message }}</p>
        <p v-if="successData.verificationUrl" class="dev-note">
          Mode dev — valider directement :
          <a :href="successData.verificationUrl" target="_blank" rel="noopener">
            cliquer ici
          </a>
        </p>
        <p class="switch">
          <RouterLink :to="{ name: 'login' }">Retour à la connexion</RouterLink>
        </p>
      </div>

      <form v-else @submit.prevent="handleSubmit">
        <label>
          <span>Email</span>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            :disabled="submitting"
          />
        </label>

        <label>
          <span>Nom d'utilisateur</span>
          <input
            v-model="form.username"
            type="text"
            autocomplete="username"
            required
            :disabled="submitting"
          />
        </label>

        <label>
          <span>Mot de passe</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            required
            :disabled="submitting"
          />
        </label>

        <label>
          <span>Confirmer le mot de passe</span>
          <input
            v-model="form.passwordConfirm"
            type="password"
            autocomplete="new-password"
            required
            :disabled="submitting"
          />
        </label>

        <p v-if="localError" class="error">{{ localError }}</p>

        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Création…' : 'Créer le compte' }}
        </button>
      </form>

      <p v-if="!successData" class="switch">
        Déjà un compte ?
        <RouterLink :to="{ name: 'login' }">Se connecter</RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 460px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
}

.subtitle {
  margin: 0 0 1.5rem;
  color: var(--text-muted);
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
}

input {
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
  border-radius: 6px;
  font-size: 1rem;
}

input:focus {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

button {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--accent);
  color: #0b0b0f;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin: 0;
  padding: 0.6rem 0.75rem;
  background: rgba(220, 60, 60, 0.15);
  border: 1px solid rgba(220, 60, 60, 0.4);
  color: #ff8b8b;
  border-radius: 6px;
  font-size: 0.9rem;
}

.success {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(60, 200, 120, 0.12);
  border: 1px solid rgba(60, 200, 120, 0.4);
  border-radius: 8px;
  color: #a6f0c0;
}

.dev-note {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.dev-note a {
  color: var(--accent);
}

.switch {
  margin: 1.5rem 0 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: center;
}

.switch a {
  color: var(--accent);
  text-decoration: none;
}

.switch a:hover {
  text-decoration: underline;
}
</style>
