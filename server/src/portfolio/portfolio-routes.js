import Holding from '../holdings/holding-schema.js'
import { getPrices } from '../services/price-service.js'

function buildSummary(holdings, prices) {
  let totalValue = 0
  let totalCost = 0

  const items = holdings.map((holding) => {
    const currentPrice = prices[holding.coingeckoId] ?? null
    const cost = holding.quantity * holding.purchasePrice
    const value = currentPrice !== null ? holding.quantity * currentPrice : null
    const profit = value !== null ? value - cost : null
    const profitPercent = value !== null && cost > 0 ? (profit / cost) * 100 : null

    totalCost += cost
    if (value !== null) {
      totalValue += value
    }

    return {
      ...holding.toPublicJSON(),
      currentPrice,
      cost,
      value,
      profit,
      profitPercent,
    }
  })

  const totalProfit = totalValue - totalCost
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  return {
    items,
    totals: {
      totalCost,
      totalValue,
      totalProfit,
      totalProfitPercent,
      pricedAt: new Date().toISOString(),
    },
  }
}

function portfolioRoutes(app) {
  app.addHook('onRequest', app.authenticate)

  app.get('/summary', async (request, reply) => {
    const holdings = await Holding.find({ userId: request.currentUser.id })
      .sort({ createdAt: -1 })

    if (holdings.length === 0) {
      return reply.send(buildSummary([], {}))
    }

    const ids = holdings.map(h => h.coingeckoId)
    const prices = await getPrices(ids, { logger: app.log })

    return reply.send(buildSummary(holdings, prices))
  })
}

export default portfolioRoutes
