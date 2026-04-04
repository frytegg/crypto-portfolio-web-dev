import { describe, expect, it } from 'vitest'

import { parseHoldingBody } from '../src/holdings/holdings-routes.js'

describe('parseHoldingBody', () => {
  it('accepts a valid creation payload and normalizes it', () => {
    const { data, error } = parseHoldingBody({
      symbol: 'btc',
      coingeckoId: 'Bitcoin',
      quantity: '0.5',
      purchasePrice: '40000',
      purchaseDate: '2026-01-15',
      notes: 'DCA buy',
    })

    expect(error).toBeUndefined()
    expect(data.symbol).toBe('BTC')
    expect(data.coingeckoId).toBe('bitcoin')
    expect(data.quantity).toBe(0.5)
    expect(data.purchasePrice).toBe(40000)
    expect(data.purchaseDate).toBeInstanceOf(Date)
    expect(data.notes).toBe('DCA buy')
  })

  it('rejects missing required fields on full create', () => {
    const { error } = parseHoldingBody({ symbol: 'BTC' })
    expect(error).toMatch(/requis/)
  })

  it('allows missing fields in partial update mode', () => {
    const { data, error } = parseHoldingBody({ quantity: 2 }, { partial: true })
    expect(error).toBeUndefined()
    expect(data.quantity).toBe(2)
    expect(data.symbol).toBeUndefined()
  })

  it('rejects negative quantity', () => {
    const { error } = parseHoldingBody({
      symbol: 'BTC',
      coingeckoId: 'bitcoin',
      quantity: -1,
      purchasePrice: 100,
    })
    expect(error).toMatch(/quantity/)
  })

  it('rejects non-numeric price', () => {
    const { error } = parseHoldingBody({
      symbol: 'BTC',
      coingeckoId: 'bitcoin',
      quantity: 1,
      purchasePrice: 'not a number',
    })
    expect(error).toMatch(/purchasePrice/)
  })

  it('rejects invalid body', () => {
    const { error } = parseHoldingBody(null)
    expect(error).toMatch(/invalide/)
  })

  it('truncates long notes to 500 characters', () => {
    const longNote = 'x'.repeat(700)
    const { data, error } = parseHoldingBody({
      symbol: 'BTC',
      coingeckoId: 'bitcoin',
      quantity: 1,
      purchasePrice: 100,
      notes: longNote,
    })
    expect(error).toBeUndefined()
    expect(data.notes).toHaveLength(500)
  })
})
