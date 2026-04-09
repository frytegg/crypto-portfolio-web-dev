import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { usePortfolioStore } from '../stores/portfolio.js'

// on mock l'API pour tester le store isolément
vi.mock('../services/api.js', () => {
  const mockSummary = {
    items: [
      {
        id: '1',
        symbol: 'BTC',
        coingeckoId: 'bitcoin',
        quantity: 0.5,
        purchasePrice: 40000,
        currentPrice: 60000,
        cost: 20000,
        value: 30000,
        profit: 10000,
        profitPercent: 50,
      },
    ],
    totals: {
      totalCost: 20000,
      totalValue: 30000,
      totalProfit: 10000,
      totalProfitPercent: 50,
      pricedAt: '2026-04-10T12:00:00.000Z',
    },
  }

  return {
    default: {
      get: vi.fn().mockResolvedValue(mockSummary),
      post: vi.fn().mockResolvedValue({ holding: { id: '2' } }),
      put: vi.fn().mockResolvedValue({ holding: { id: '1' } }),
      delete: vi.fn().mockResolvedValue({ message: 'ok' }),
    },
  }
})

describe('portfolio store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    const store = usePortfolioStore()
    expect(store.isEmpty).toBe(true)
    expect(store.totals.totalValue).toBe(0)
  })

  it('loads summary and exposes totals', async () => {
    const store = usePortfolioStore()
    await store.fetchSummary()

    expect(store.isEmpty).toBe(false)
    expect(store.items).toHaveLength(1)
    expect(store.items[0].symbol).toBe('BTC')
    expect(store.totals.totalValue).toBe(30000)
    expect(store.totals.totalProfit).toBe(10000)
    expect(store.totals.totalProfitPercent).toBe(50)
  })

  it('reset clears everything', async () => {
    const store = usePortfolioStore()
    await store.fetchSummary()
    store.reset()

    expect(store.items).toEqual([])
    expect(store.totals.totalValue).toBe(0)
    expect(store.totals.totalCost).toBe(0)
    expect(store.totals.pricedAt).toBe(null)
  })

  it('createHolding triggers a summary refresh', async () => {
    const store = usePortfolioStore()
    const api = (await import('../services/api.js')).default

    await store.createHolding({ symbol: 'ETH', coingeckoId: 'ethereum', quantity: 1, purchasePrice: 2000 })

    expect(api.post).toHaveBeenCalledWith('/holdings', expect.objectContaining({ symbol: 'ETH' }))
    expect(api.get).toHaveBeenCalledWith('/portfolio/summary')
  })
})
