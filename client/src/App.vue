<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'

import { useAuthStore } from './stores/auth.js'
import { usePortfolioStore } from './stores/portfolio.js'

const auth = useAuthStore()
const portfolio = usePortfolioStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  portfolio.reset()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app">
    <nav v-if="auth.isAuthenticated" class="navbar">
      <div class="nav-inner">
        <RouterLink :to="{ name: 'dashboard' }" class="brand">
          <span class="logo">◈</span> Crypto Portfolio
        </RouterLink>
        <div class="nav-links">
          <RouterLink :to="{ name: 'dashboard' }">Dashboard</RouterLink>
          <RouterLink :to="{ name: 'holding-new' }">Ajouter</RouterLink>
        </div>
        <div class="nav-user">
          <span v-if="auth.user" class="username">{{ auth.user.username }}</span>
          <button class="logout" @click="handleLogout">Déconnexion</button>
        </div>
      </div>
    </nav>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
:root {
  --bg: #0b0b0f;
  --card-bg: #15151c;
  --input-bg: #1c1c26;
  --border: #2a2a36;
  --text: #e4e4ec;
  --text-muted: #888896;
  --accent: #7ee787;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.brand {
  font-weight: 700;
  font-size: 1.15rem;
  text-decoration: none;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  color: var(--accent);
  font-size: 1.3rem;
}

.nav-links {
  display: flex;
  gap: 1.25rem;
}

.nav-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.95rem;
  padding: 0.35rem 0;
  border-bottom: 2px solid transparent;
}

.nav-links a:hover {
  color: var(--text);
}

.nav-links a.router-link-active {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.logout {
  padding: 0.45rem 0.9rem;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}

.logout:hover {
  background: rgba(255, 255, 255, 0.05);
}

main {
  flex: 1;
}
</style>
