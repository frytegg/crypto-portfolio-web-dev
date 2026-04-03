// Récupère les prix crypto via l'API publique CoinGecko.
// Pas de clé API nécessaire mais le rate limit free est vite atteint,
// donc on garde un cache en mémoire de 60s.

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'
const CACHE_TTL_MS = 60 * 1000
const VS_CURRENCY = 'usd'

const priceCache = new Map()

function isFresh(entry) {
  if (!entry) {
    return false
  }
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS
}

export async function getPrices(coingeckoIds, { logger } = {}) {
  const uniqueIds = [...new Set(coingeckoIds.filter(Boolean))]
  const result = {}
  const idsToFetch = []

  for (const id of uniqueIds) {
    const entry = priceCache.get(id)
    if (isFresh(entry)) {
      result[id] = entry.price
    } else {
      idsToFetch.push(id)
    }
  }

  if (idsToFetch.length === 0) {
    return result
  }

  const url = new URL(`${COINGECKO_BASE_URL}/simple/price`)
  url.searchParams.set('ids', idsToFetch.join(','))
  url.searchParams.set('vs_currencies', VS_CURRENCY)

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      throw new Error(`CoinGecko a répondu ${response.status}`)
    }

    const data = await response.json()
    const now = Date.now()

    for (const id of idsToFetch) {
      const price = data[id]?.[VS_CURRENCY]
      if (typeof price === 'number') {
        priceCache.set(id, { price, fetchedAt: now })
        result[id] = price
      } else {
        // id inconnu : on renvoie un éventuel ancien prix en cache, sinon null
        const stale = priceCache.get(id)
        result[id] = stale ? stale.price : null
      }
    }
  } catch (error) {
    logger?.warn?.({ err: error, ids: idsToFetch }, 'Échec de récupération des prix CoinGecko')
    // en cas d'erreur, on retombe sur le cache (même périmé) pour éviter
    // d'afficher du vide dans le dashboard
    for (const id of idsToFetch) {
      const stale = priceCache.get(id)
      result[id] = stale ? stale.price : null
    }
  }

  return result
}

export function clearPriceCache() {
  priceCache.clear()
}
