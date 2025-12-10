import api from './client';

export const orderApi = {
  createOrder: (orderData) => 
    api.post('/orders', orderData),
  
  getOrdersByUser: () => 
    api.get(`/orders/user`),
  
  getOrdersByOwner: () => 
    api.get('/orders/owner'),
  
  // Courier-specific endpoints
  getOrdersByCourier: () => 
    api.get('/orders/courier'),
  getOrdersForCourier: () =>
    api.get('/orders/courier'),

  assignCourier: (orderId) =>
    api.patch(`/orders/${orderId}/assign`),

  markDelivered: (orderId) =>
    api.patch(`/orders/${orderId}/status`, { status: 'delivered' }),
  
  updateOrderStatus: (orderId, status) => 
    api.patch(`/orders/${orderId}/status`, { status }),
  
  rateOrder: (orderId, rating, review) => 
    api.patch(`/orders/${orderId}/rate`, { rating, review }),
  deleteOrder: (orderId) =>
    api.delete(`/orders/${orderId}`),
  hideOrder: (orderId) =>
    api.patch(`/orders/${orderId}/hide`),
};
