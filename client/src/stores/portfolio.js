import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import api from '../services/api.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const items = ref([])
  const totals = ref({
    totalCost: 0,
    totalValue: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
    pricedAt: null,
  })
  const loading = ref(false)
  const error = ref(null)

  const isEmpty = computed(() => items.value.length === 0)

  async function fetchSummary() {
    loading.value = true
    error.value = null
    try {
      const data = await api.get('/portfolio/summary')
      items.value = data.items
      totals.value = data.totals
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function fetchHolding(id) {
    return api.get(`/holdings/${id}`)
  }

  async function createHolding(payload) {
    const data = await api.post('/holdings', payload)
    await fetchSummary()
    return data.holding
  }

  async function updateHolding(id, payload) {
    const data = await api.put(`/holdings/${id}`, payload)
    await fetchSummary()
    return data.holding
  }

  async function deleteHolding(id) {
    await api.delete(`/holdings/${id}`)
    await fetchSummary()
  }

  function reset() {
    items.value = []
    totals.value = {
      totalCost: 0,
      totalValue: 0,
      totalProfit: 0,
      totalProfitPercent: 0,
      pricedAt: null,
    }
    error.value = null
  }

  return {
    items,
    totals,
    loading,
    error,
    isEmpty,
    fetchSummary,
    fetchHolding,
    createHolding,
    updateHolding,
    deleteHolding,
    reset,
  }
})
