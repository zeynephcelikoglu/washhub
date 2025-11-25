const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  try {
    // Only return active products for general users
    const products = await Product.find({ isActive: true });

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: get all products including inactive
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    // Allow flexible payload but ensure required values exist or default
    const {
      name,
      description = '',
      serviceType = 'standard',
      price = 0,
      basePrice = 0,
      pricePerKg = 0,
      category = 'Genel',
      image = null,
      isActive = true,
      estimatedDays = 3,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Missing required field: name' });
    }

    const product = new Product({
      name,
      description,
      serviceType,
      price: price || basePrice || pricePerKg || 0,
      basePrice: basePrice || price || 0,
      pricePerKg: pricePerKg || 0,
      category,
      image,
      isActive,
      estimatedDays,
    });

    await product.save();

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Apply updates (allow partial)
    Object.keys(updates).forEach((k) => {
      product[k] = updates[k];
    });

    await product.save();
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.remove();
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
