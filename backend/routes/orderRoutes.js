const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.post('/', auth, checkRole(['user']), orderController.createOrder);
router.get('/user', auth, orderController.getOrdersByUser);
router.get('/owner', auth, checkRole(['owner']), orderController.getOrdersByOwner);
router.get('/courier', auth, checkRole(['courier']), orderController.getOrdersByCourier);
router.patch('/:orderId/assign', auth, checkRole(['courier']), orderController.assignCourier);
router.patch('/:orderId/status', auth, checkRole(['owner', 'courier']), orderController.updateOrderStatus);
router.patch('/:orderId/rate', auth, orderController.rateOrder);

module.exports = router;
