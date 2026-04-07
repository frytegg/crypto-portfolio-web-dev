<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { usePortfolioStore } from '../stores/portfolio.js'

const portfolio = usePortfolioStore()
const route = useRoute()
const router = useRouter()

const holdingId = computed(() => route.params.id || null)
const isEdit = computed(() => holdingId.value !== null)

const form = reactive({
  symbol: '',
  coingeckoId: '',
  quantity: '',
  purchasePrice: '',
  purchaseDate: '',
  notes: '',
})

const loading = ref(false)
const submitting = ref(false)
const error = ref(null)

// Raccourcis pour les cryptos les plus courantes
// (l'API CoinGecko utilise des ids comme "bitcoin", pas les symboles)
const suggestions = [
  { symbol: 'BTC', coingeckoId: 'bitcoin', name: 'Bitcoin' },
  { symbol: 'ETH', coingeckoId: 'ethereum', name: 'Ethereum' },
  { symbol: 'SOL', coingeckoId: 'solana', name: 'Solana' },
  { symbol: 'ADA', coingeckoId: 'cardano', name: 'Cardano' },
  { symbol: 'DOT', coingeckoId: 'polkadot', name: 'Polkadot' },
  { symbol: 'MATIC', coingeckoId: 'matic-network', name: 'Polygon' },
  { symbol: 'AVAX', coingeckoId: 'avalanche-2', name: 'Avalanche' },
  { symbol: 'LINK', coingeckoId: 'chainlink', name: 'Chainlink' },
  { symbol: 'XRP', coingeckoId: 'ripple', name: 'XRP' },
  { symbol: 'DOGE', coingeckoId: 'dogecoin', name: 'Dogecoin' },
]

function applySuggestion(suggestion) {
  form.symbol = suggestion.symbol
  form.coingeckoId = suggestion.coingeckoId
}

function toDateInputValue(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(async () => {
  if (isEdit.value) {
    loading.value = true
    try {
      const data = await portfolio.fetchHolding(holdingId.value)
      const h = data.holding
      form.symbol = h.symbol
      form.coingeckoId = h.coingeckoId
      form.quantity = String(h.quantity)
      form.purchasePrice = String(h.purchasePrice)
      form.purchaseDate = toDateInputValue(h.purchaseDate)
      form.notes = h.notes || ''
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  } else {
    form.purchaseDate = toDateInputValue(new Date())
  }
})

async function handleSubmit() {
  error.value = null

  if (!form.symbol || !form.coingeckoId) {
    error.value = 'Symbol et CoinGecko id sont requis'
    return
  }
  const quantity = Number(form.quantity)
  const price = Number(form.purchasePrice)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    error.value = 'Quantité invalide'
    return
  }
  if (!Number.isFinite(price) || price < 0) {
    error.value = "Prix d'achat invalide"
    return
  }

  const payload = {
    symbol: form.symbol,
    coingeckoId: form.coingeckoId,
    quantity,
    purchasePrice: price,
    purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
    notes: form.notes,
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await portfolio.updateHolding(holdingId.value, payload)
    } else {
      await portfolio.createHolding(payload)
    }
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="form-page">
    <div class="form-card">
      <h1>{{ isEdit ? 'Modifier la position' : 'Nouvelle position' }}</h1>

      <div v-if="loading" class="loading">Chargement…</div>

      <form v-else @submit.prevent="handleSubmit">
        <div v-if="!isEdit" class="suggestions">
          <span class="suggest-label">Raccourcis :</span>
          <button
            v-for="s in suggestions"
            :key="s.coingeckoId"
            type="button"
            class="chip"
            @click="applySuggestion(s)"
          >
            {{ s.symbol }}
          </button>
        </div>

        <div class="row">
          <label>
            <span>Symbole</span>
            <input v-model="form.symbol" type="text" placeholder="BTC" required />
          </label>
          <label>
            <span>CoinGecko ID</span>
            <input v-model="form.coingeckoId" type="text" placeholder="bitcoin" required />
          </label>
        </div>

        <div class="row">
          <label>
            <span>Quantité</span>
            <input
              v-model="form.quantity"
              type="number"
              step="any"
              min="0"
              placeholder="0.5"
              required
            />
          </label>
          <label>
            <span>Prix d'achat (USD)</span>
            <input
              v-model="form.purchasePrice"
              type="number"
              step="any"
              min="0"
              placeholder="45000"
              required
            />
          </label>
        </div>

        <label>
          <span>Date d'achat</span>
          <input v-model="form.purchaseDate" type="date" />
        </label>

        <label>
          <span>Notes (optionnel)</span>
          <textarea v-model="form.notes" rows="3" maxlength="500" />
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="actions">
          <RouterLink :to="{ name: 'dashboard' }" class="btn btn-ghost">Annuler</RouterLink>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Ajouter' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.form-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.form-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
}

h1 {
  margin: 0 0 1.5rem;
  font-size: 1.6rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 1fr;
  }
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
}

input,
textarea {
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed var(--border);
  margin-bottom: 0.25rem;
}

.suggest-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-right: 0.25rem;
}

.chip {
  padding: 0.35rem 0.7rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text);
  cursor: pointer;
  font-size: 0.85rem;
}

.chip:hover {
  background: rgba(255, 255, 255, 0.08);
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

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn {
  padding: 0.65rem 1.2rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  font-size: 0.95rem;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}
</style>
