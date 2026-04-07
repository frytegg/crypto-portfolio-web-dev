<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { usePortfolioStore } from '../stores/portfolio.js'

const portfolio = usePortfolioStore()
const router = useRouter()

const REFRESH_INTERVAL_MS = 60 * 1000
let intervalId = null

const deletingId = ref(null)

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function formatMoney(value) {
  if (value === null || value === undefined) {
    return '—'
  }
  return formatter.format(value)
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return '—'
  }
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatQuantity(value) {
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 8 })
}

const lastUpdated = computed(() => {
  if (!portfolio.totals.pricedAt) {
    return null
  }
  return new Date(portfolio.totals.pricedAt).toLocaleTimeString()
})

async function handleDelete(item) {
  if (!confirm(`Supprimer la position ${item.symbol} ?`)) {
    return
  }
  deletingId.value = item.id
  try {
    await portfolio.deleteHolding(item.id)
  } finally {
    deletingId.value = null
  }
}

function goToEdit(item) {
  router.push({ name: 'holding-edit', params: { id: item.id } })
}

onMounted(async () => {
  await portfolio.fetchSummary()
  intervalId = setInterval(() => {
    portfolio.fetchSummary()
  }, REFRESH_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <section class="dashboard">
    <header class="page-header">
      <div>
        <h1>Mon Portfolio</h1>
        <p v-if="lastUpdated" class="updated">
          Dernière mise à jour : {{ lastUpdated }}
        </p>
      </div>
      <RouterLink :to="{ name: 'holding-new' }" class="btn btn-primary">
        + Ajouter une position
      </RouterLink>
    </header>

    <div class="totals">
      <div class="total-card">
        <span class="label">Valeur actuelle</span>
        <span class="value">{{ formatMoney(portfolio.totals.totalValue) }}</span>
      </div>
      <div class="total-card">
        <span class="label">Coût total</span>
        <span class="value">{{ formatMoney(portfolio.totals.totalCost) }}</span>
      </div>
      <div class="total-card" :class="{ positive: portfolio.totals.totalProfit >= 0, negative: portfolio.totals.totalProfit < 0 }">
        <span class="label">Profit / Perte</span>
        <span class="value">
          {{ formatMoney(portfolio.totals.totalProfit) }}
          <small>({{ formatPercent(portfolio.totals.totalProfitPercent) }})</small>
        </span>
      </div>
    </div>

    <div v-if="portfolio.loading && portfolio.isEmpty" class="empty">
      Chargement du portfolio…
    </div>

    <div v-else-if="portfolio.error" class="error">
      {{ portfolio.error }}
    </div>

    <div v-else-if="portfolio.isEmpty" class="empty">
      <p>Aucune position pour le moment.</p>
      <RouterLink :to="{ name: 'holding-new' }" class="btn btn-primary">
        Ajouter votre première position
      </RouterLink>
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Actif</th>
            <th class="num">Quantité</th>
            <th class="num">Prix d'achat</th>
            <th class="num">Prix actuel</th>
            <th class="num">Valeur</th>
            <th class="num">P&L</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in portfolio.items" :key="item.id">
            <td>
              <strong>{{ item.symbol }}</strong>
              <br />
              <small class="muted">{{ item.coingeckoId }}</small>
            </td>
            <td class="num">{{ formatQuantity(item.quantity) }}</td>
            <td class="num">{{ formatMoney(item.purchasePrice) }}</td>
            <td class="num">{{ formatMoney(item.currentPrice) }}</td>
            <td class="num">{{ formatMoney(item.value) }}</td>
            <td
              class="num"
              :class="{ positive: item.profit > 0, negative: item.profit < 0 }"
            >
              {{ formatMoney(item.profit) }}
              <br />
              <small>{{ formatPercent(item.profitPercent) }}</small>
            </td>
            <td class="actions">
              <button class="btn btn-ghost" @click="goToEdit(item)">Éditer</button>
              <button
                class="btn btn-danger"
                :disabled="deletingId === item.id"
                @click="handleDelete(item)"
              >
                {{ deletingId === item.id ? '…' : 'Supprimer' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
}

.updated {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.totals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.total-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.total-card .label {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.total-card .value {
  font-size: 1.6rem;
  font-weight: 600;
}

.total-card .value small {
  font-size: 0.85rem;
  font-weight: 400;
  opacity: 0.85;
}

.total-card.positive .value {
  color: #4ade80;
}

.total-card.negative .value {
  color: #f87171;
}

.empty,
.error {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-muted);
}

.empty .btn {
  margin-top: 1rem;
  display: inline-block;
}

.error {
  color: #ff8b8b;
  border-color: rgba(220, 60, 60, 0.4);
}

.table-wrapper {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

th,
td {
  padding: 0.9rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

tbody tr:last-child td {
  border-bottom: none;
}

th {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.02);
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.muted {
  color: var(--text-muted);
}

.positive {
  color: #4ade80;
}

.negative {
  color: #f87171;
}

.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn {
  display: inline-block;
  padding: 0.5rem 0.9rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
}

.btn-primary {
  background: var(--accent);
  color: #0b0b0f;
}

.btn-ghost {
  background: transparent;
  border-color: var(--border);
  color: var(--text);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn-danger {
  background: transparent;
  border-color: rgba(220, 60, 60, 0.5);
  color: #ff8b8b;
}

.btn-danger:hover {
  background: rgba(220, 60, 60, 0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
