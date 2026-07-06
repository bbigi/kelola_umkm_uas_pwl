import { defineStore } from 'pinia';
import api from '../utils/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role || '',
    userName: (state) => state.user?.name || '',
    isOwner: (state) => state.user?.role === 'owner',
    isGudang: (state) => state.user?.role === 'admin_gudang',
    isKasir: (state) => state.user?.role === 'kasir',
  },

  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.status) {
          const { token, user } = response.data;
          this.token = token;
          this.user = user;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          return true;
        }
        return false;
      } catch (err) {
        this.error = err.response?.data?.message || 'Login gagal, periksa koneksi Anda.';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});
