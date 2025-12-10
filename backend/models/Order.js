const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  courierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  items: [
    {
      name: String,
      quantity: Number,
      weight: Number,
      serviceType: {
        type: String,
        enum: ['standard', 'express', 'dry_clean'],
        default: 'standard'
      },
      price: Number
    }
  ],
  totalPrice: {
    type: Number,
    required: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryTime: {
    type: String,
    required: true
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  status: {
    type: String,
    enum: ['pending_owner', 'courier_assigned', 'delivered', 'cancelled'],
    default: 'pending_owner'
  },
  notes: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  },
  // Soft-hide flags per role
  hiddenForUser: {
    type: Boolean,
    default: false
  },
  hiddenForOwner: {
    type: Boolean,
    default: false
  },
  hiddenForCourier: {
    type: Boolean,
    default: false
  },
  review: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Her update'te updatedAt'ı güncelle
orderSchema.pre('findByIdAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Order', orderSchema);
