const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Genel'
  },
  description: {
    type: String,
    default: ''
  },
  serviceType: {
    type: String,
    enum: ['standard', 'express', 'dry_clean'],
    default: 'standard'
  },
  // Backwards compatible fields
  basePrice: {
    type: Number,
    default: 0
  },
  pricePerKg: {
    type: Number,
    default: 0
  },
  // New unified price field (preferred)
  price: {
    type: Number,
    default: 0
  },
  estimatedDays: {
    type: Number,
    default: 3
  },
  image: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure price exists (prefer explicit price, fallback to basePrice)
productSchema.pre('save', function (next) {
  if (!this.price || this.price === 0) {
    if (this.basePrice) this.price = this.basePrice;
    else if (this.pricePerKg) this.price = this.pricePerKg;
    else this.price = 0;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
