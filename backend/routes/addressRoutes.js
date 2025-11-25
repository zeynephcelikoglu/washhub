const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const auth = require('../middleware/auth');

router.get('/:userId', auth, addressController.getAddressesByUser);
router.post('/', auth, addressController.createAddress);
router.patch('/:addressId', auth, addressController.updateAddress);
router.delete('/:addressId', auth, addressController.deleteAddress);

module.exports = router;
