const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

exports.createOrder = async (req, res) => {
  try {
    const { items, totalPrice, pickupDate, pickupTime, deliveryDate, deliveryTime, addressId, notes } = req.body;

    // Validate all required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items must be a non-empty array' });
    }
    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ message: 'Invalid totalPrice' });
    }
    if (!pickupDate) return res.status(400).json({ message: 'Missing pickupDate' });
    if (!pickupTime) return res.status(400).json({ message: 'Missing pickupTime' });
    if (!deliveryDate) return res.status(400).json({ message: 'Missing deliveryDate' });
    if (!deliveryTime) return res.status(400).json({ message: 'Missing deliveryTime' });
    if (!addressId) return res.status(400).json({ message: 'Missing addressId' });

    const order = new Order({
      userId: req.user.id,
      items,
      totalPrice,
      pickupDate,
      pickupTime,
      deliveryDate,
      deliveryTime,
      addressId,
      notes: notes || '',
      status: 'pending_owner'
    });

    await order.save();

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId })
      .populate('addressId')
      .populate('ownerId', 'name phone rating')
      .populate('courierId', 'name phone rating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrdersByOwner = async (req, res) => {
  try {
    // Return all orders relevant to owner (active + history)
    const orders = await Order.find({
      status: { $in: ['pending_owner', 'courier_assigned', 'delivered', 'cancelled'] }
    })
      .populate('userId', 'name phone email')
      .populate('addressId')
      .populate('courierId', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrdersByCourier = async (req, res) => {
  try {
    const courierId = req.user.id;

    // Return active courier_assigned orders (available or assigned to me)
    // and history orders (delivered/cancelled) that are assigned to me
    const orders = await Order.find({
      $or: [
        { status: 'courier_assigned', $or: [{ courierId: courierId }, { courierId: null }, { courierId: { $exists: false } }] },
        { status: { $in: ['delivered', 'cancelled'] }, courierId: courierId }
      ]
    })
      .populate('userId', 'name phone email')
      .populate('addressId')
      .populate('courierId', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role || null;

    const validStatuses = ['pending_owner', 'courier_assigned', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Status transitions allowed
    const statusFlow = {
      'pending_owner': ['courier_assigned', 'cancelled'],
      'courier_assigned': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    if (!statusFlow[order.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    // If courier is marking delivered, ensure they are assigned courier
    if (status === 'delivered' && currentUserRole === 'courier') {
      if (!order.courierId) {
        return res.status(403).json({ message: 'Order is not assigned to any courier' });
      }
      if (order.courierId.toString() !== currentUserId) {
        return res.status(403).json({ message: 'You are not the assigned courier for this order' });
      }
    }

    order.status = status;

    await order.save();

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign courier to an unassigned order (courier claims it)
exports.assignCourier = async (req, res) => {
  try {
    const { orderId } = req.params;
    const courierId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'courier_assigned') {
      return res.status(400).json({ message: 'Order is not available for courier assignment' });
    }

    if (order.courierId && order.courierId.toString() !== courierId) {
      return res.status(400).json({ message: 'Order already assigned to another courier' });
    }

    // assign
    order.courierId = courierId;
    await order.save();

    const populated = await Order.findById(orderId).populate('userId', 'name phone email').populate('addressId').populate('courierId', 'name phone');

    res.status(200).json({ success: true, order: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body;

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { rating, review },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Owner rating'ini güncelle
    if (order.ownerId) {
      const owner = await User.findById(order.ownerId);
      const allOrders = await Order.find({ ownerId: order.ownerId, rating: { $ne: null } });
      const avgRating = allOrders.reduce((sum, o) => sum + o.rating, 0) / allOrders.length;
      owner.rating = avgRating;
      await owner.save();
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
