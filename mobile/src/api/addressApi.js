import api from './client';

export const addressApi = {
  getAddresses: (userId) => 
    api.get(`/addresses/${userId}`),
  
  createAddress: (addressData) => {
    // Backend expects: userId, title, street, city, zipCode, phone
    const payload = {
      title: addressData.title,
      street: addressData.street || `${addressData.mahalle || ''}, ${addressData.cadde || ''}`,
      city: addressData.city || 'İstanbul',
      zipCode: addressData.zipCode || '34000',
      phone: addressData.phone,
      isDefault: addressData.isDefault || false,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
    };
    return api.post('/addresses', payload);
  },
  
  updateAddress: (addressId, addressData) => {
    const payload = {
      title: addressData.title,
      street: addressData.street,
      city: addressData.city,
      zipCode: addressData.zipCode,
      phone: addressData.phone,
      isDefault: addressData.isDefault,
    };
    return api.patch(`/addresses/${addressId}`, payload);
  },
  
  deleteAddress: (addressId) => 
    api.delete(`/addresses/${addressId}`),
};
