import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import api, { ApiError } from '../services/api.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  async function fetchCurrentUser() {
    loading.value = true
    error.value = null
    try {
      const data = await api.get('/users/me')
      user.value = data.user
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        user.value = null
      } else {
        error.value = err.message
      }
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function login({ email, password }) {
    loading.value = true
    error.value = null
    try {
      const data = await api.post('/auth/login', { email, password })
      user.value = data.user ?? null
      await fetchCurrentUser()
      return { ok: true }
    } catch (err) {
      error.value = err.message
      return { ok: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function register({ email, username, password }) {
    loading.value = true
    error.value = null
    try {
      const data = await api.post('/auth/register', { email, username, password })
      return { ok: true, data }
    } catch (err) {
      error.value = err.message
      return { ok: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // on ignore, on vide l'état client dans tous les cas
    }
    user.value = null
  }

  return {
    user,
    loading,
    error,
    initialized,
    isAuthenticated,
    fetchCurrentUser,
    login,
    register,
    logout,
  }
})
