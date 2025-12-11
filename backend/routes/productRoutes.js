const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.get('/', productController.getAllProducts);
router.get('/service/:serviceType', productController.getProductsByService);
router.post('/', auth, checkRole(['owner']), productController.createProduct);
router.put('/:id', auth, checkRole(['owner']), productController.updateProduct);
router.delete('/:id', auth, checkRole(['owner']), productController.deleteProduct);
// Admin route to fetch all (including inactive) products
router.get('/all', auth, checkRole(['owner']), productController.getAllProductsAdmin);

module.exports = router;
