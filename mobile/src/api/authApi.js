import api from './client';

export const authApi = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (name, email, password, phone, role) => 
    api.post('/auth/register', { name, email, password, phone, role }),
  
  getProfile: () => 
    api.get('/auth/profile'),
};
