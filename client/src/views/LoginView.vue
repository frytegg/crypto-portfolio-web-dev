<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  email: '',
  password: '',
})

const submitting = ref(false)
const localError = ref(null)

async function handleSubmit() {
  localError.value = null
  if (!form.email || !form.password) {
    localError.value = 'Email et mot de passe requis'
    return
  }

  submitting.value = true
  const result = await auth.login({
    email: form.email.trim(),
    password: form.password,
  })
  submitting.value = false

  if (result.ok) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } else {
    localError.value = result.error
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-card">
      <h1>Connexion</h1>
      <p class="subtitle">Accédez à votre portfolio crypto</p>

      <form @submit.prevent="handleSubmit">
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
          <span>Mot de passe</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            :disabled="submitting"
          />
        </label>

        <p v-if="localError" class="error">{{ localError }}</p>

        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <p class="switch">
        Pas encore de compte ?
        <RouterLink :to="{ name: 'register' }">Créer un compte</RouterLink>
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
  max-width: 420px;
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
