import mongoose from 'mongoose'

const { Schema } = mongoose

const holdingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 16,
  },
  // identifiant CoinGecko (ex: "bitcoin"), utilisé pour récupérer le prix
  coingeckoId: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 64,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
    maxlength: 500,
  },
}, {
  timestamps: true,
})

holdingSchema.index({ userId: 1, createdAt: -1 })

holdingSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    symbol: this.symbol,
    coingeckoId: this.coingeckoId,
    quantity: this.quantity,
    purchasePrice: this.purchasePrice,
    purchaseDate: this.purchaseDate,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export default mongoose.model('Holding', holdingSchema)
