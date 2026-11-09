// client/src/api/readingsApi.js
import api from './axios';

export const readingsApi = {
  getReadings: async (params = {}) => {
    const res = await api.get('/readings', { params });
    return res.data;
  },
  getReadingById: async (id) => {
    const res = await api.get(`/readings/${id}`);
    return res.data;
  },
  createReading: async (data) => {
    const res = await api.post('/readings', data);
    return res.data;
  },
  updateReading: async (id, data) => {
    const res = await api.put(`/readings/${id}`, data);
    return res.data;
  },
  deleteReading: async (id) => {
    const res = await api.delete(`/readings/${id}`);
    return res.data;
  }
};

