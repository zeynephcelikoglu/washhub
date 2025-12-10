import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ngrok URL
const NGROK_BASE_URL = 'https://nonmatrimonially-previous-lanette.ngrok-free.dev';

const API_URL = `${NGROK_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
});

// Token'ı her requeste ekle
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;