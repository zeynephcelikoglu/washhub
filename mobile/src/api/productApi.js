import api from './client';

export const productApi = {
  getAllProducts: () => api.get('/products'),
  getAllProductsAdmin: () => api.get('/products/all'),
  getProductsByService: (serviceType) => api.get(`/products/service/${serviceType}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};
