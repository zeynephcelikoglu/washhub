const Address = require('../models/Address');

exports.getAddressesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      addresses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const { title, street, city, zipCode, phone, isDefault, latitude, longitude } = req.body;

    if (!title || !street || !city || !zipCode || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Eğer default olarak işaretlendiyse diğerlerini false yap
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id },
        { isDefault: false }
      );
    }

    const address = new Address({
      userId: req.user.id,
      title,
      street,
      city,
      zipCode,
      phone,
      isDefault: isDefault || false,
      latitude,
      longitude
    });

    await address.save();

    res.status(201).json({
      success: true,
      address
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { title, street, city, zipCode, phone, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id },
        { isDefault: false }
      );
    }

    const address = await Address.findByIdAndUpdate(
      addressId,
      { title, street, city, zipCode, phone, isDefault },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.status(200).json({
      success: true,
      address
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findByIdAndDelete(addressId);

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
