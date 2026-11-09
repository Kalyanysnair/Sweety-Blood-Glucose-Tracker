// client/src/api/reportsApi.js
import api from './axios';

export const reportsApi = {
  getDailyReport: async (date) => {
    const res = await api.get('/reports/daily', { params: date ? { date } : {} });
    return res.data;
  },
  getMonthToDateReport: async (date) => {
    const res = await api.get('/reports/month-to-date', { params: date ? { date } : {} });
    return res.data;
  },
  getMonthlyReport: async (date) => {
    const res = await api.get('/reports/monthly', { params: date ? { date } : {} });
    return res.data;
  }
};

