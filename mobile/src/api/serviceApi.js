import api from './client';

export const serviceApi = {
  getAllServices: () => api.get('/services'),
  updateService: (id, data) => api.patch(`/services/${id}`, data),
  deleteService: (id) => api.delete(`/services/${id}`),
};
