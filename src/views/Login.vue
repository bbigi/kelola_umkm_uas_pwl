<template>
  <div class="auth-wrapper">
    <!-- Left Panel: Brand & Features (Desktop Only) -->
    <div class="auth-left">
      <div class="brand-logo-container">
        <div class="brand-logo-circle">
          <i class="fas fa-store-alt"></i>
        </div>
        <h2 class="brand-text-title">Kelola<span>UMKM</span></h2>
      </div>
      
      <div class="features-container">
        <div class="features-header">
          <h1>Solusi Cerdas Pengelolaan UMKM</h1>
          <p>Kelola penjualan, inventaris, pengeluaran, dan pantau performa bisnis Anda secara real-time dari satu dashboard modern.</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon-box">
            <i class="fas fa-cash-register"></i>
          </div>
          <div class="feature-text">
            <h3>Point of Sale (Kasir)</h3>
            <p>Transaksi penjualan kasir yang responsif, cepat, dan terintegrasi otomatis dengan stok.</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon-box">
            <i class="fas fa-boxes"></i>
          </div>
          <div class="feature-text">
            <h3>Manajemen Inventaris</h3>
            <p>Pantau stok produk, peringatan batas minimum stok, dan kelola supplier secara efisien.</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon-box">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="feature-text">
            <h3>Laporan Real-time</h3>
            <p>Pantau pendapatan harian, laba-rugi, pengeluaran operasional secara instan.</p>
          </div>
        </div>
      </div>
      
      <div class="auth-left-footer">
        <p>&copy; {{ currentYear }} Kelola UMKM. Hak Cipta Dilindungi.</p>
      </div>
    </div>

    <!-- Right Panel: Login Form -->
    <div class="auth-right">
      <div class="auth-card">
        <!-- Mobile Brand Header (Visible on smaller screens only) -->
        <div class="mobile-brand-header">
          <div class="brand-logo-circle">
            <i class="fas fa-store-alt"></i>
          </div>
          <h2 class="brand-text-title">Kelola<span>UMKM</span></h2>
        </div>
        
        <div class="auth-header">
          <h2>Selamat Datang Kembali</h2>
          <p>Silakan masuk ke akun Anda untuk melanjutkan</p>
        </div>

        <!-- Alert Notification -->
        <div v-if="errorMsg" class="alert alert-error">
          <i class="fas fa-exclamation-circle" style="font-size: 1.1rem;"></i> 
          <span>{{ errorMsg }}</span>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin">
          <div class="form-group-custom">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <input 
                type="email" 
                id="email" 
                v-model="email" 
                class="form-control" 
                placeholder="nama@perusahaan.com" 
                required 
                autocomplete="email"
              >
              <i class="fas fa-envelope input-icon"></i>
            </div>
          </div>
          
          <div class="form-group-custom">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                id="password" 
                v-model="password" 
                class="form-control" 
                placeholder="••••••••" 
                required 
                autocomplete="current-password"
              >
              <i class="fas fa-lock input-icon"></i>
              <i 
                :class="['fas', showPassword ? 'fa-eye-slash' : 'fa-eye', 'toggle-password']" 
                @click="showPassword = !showPassword"
              ></i>
            </div>
          </div>
          
          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="loading"><i class="fas fa-spinner fa-spin"></i> Menghubungkan...</span>
            <span v-else>Masuk ke Dashboard</span>
            <i v-if="!loading" class="fas fa-arrow-right"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMsg = ref('');

const loading = computed(() => authStore.loading);
const currentYear = computed(() => new Date().getFullYear());

const handleLogin = async () => {
  errorMsg.value = '';
  try {
    const success = await authStore.login(email.value, password.value);
    if (success) {
      const userRole = authStore.role;
      if (userRole === 'kasir') {
        router.push({ name: 'Pos' });
      } else if (userRole === 'admin_gudang') {
        router.push({ name: 'Products' });
      } else {
        router.push({ name: 'Dashboard' });
      }
    }
  } catch (err) {
    errorMsg.value = authStore.error || 'Terjadi kesalahan saat masuk. Silakan coba lagi.';
  }
};
</script>

<style scoped>
/* Scoped adjustments or styling overrides specifically for Login if needed */
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  width: 100vw;
  position: absolute;
  top: 0;
  left: 0;
}
.auth-left {
  flex: 1.2;
  background: linear-gradient(135deg, #008d74 0%, #004d40 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px;
  color: var(--white);
  overflow: hidden;
}
.auth-left::before {
  content: '';
  position: absolute;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  top: -100px;
  left: -100px;
  pointer-events: none;
}
.auth-left::after {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 152, 0, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  bottom: -150px;
  right: -100px;
  pointer-events: none;
}
.brand-logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2;
}
.brand-logo-circle {
  width: 44px;
  height: 44px;
  background-color: var(--secondary);
  color: var(--white);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}
.brand-text-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
  color: var(--white);
}
.brand-text-title span {
  color: var(--secondary);
}
.features-container {
  margin: auto 0;
  max-width: 480px;
  z-index: 2;
}
.features-header {
  margin-bottom: 40px;
}
.features-header h1 {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.25;
  margin-bottom: 16px;
  color: #ffffff;
  letter-spacing: -1px;
}
.features-header p {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}
.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
  background: rgba(255, 255, 255, 0.04);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  transition: var(--transition);
}
.feature-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(5px);
}
.feature-icon-box {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: var(--secondary);
  flex-shrink: 0;
}
.feature-text {
  display: flex;
  flex-direction: column;
}
.feature-text h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 4px;
  color: #ffffff;
}
.feature-text p {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  margin: 0;
}
.auth-left-footer {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  z-index: 2;
}
.auth-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  background-color: #ffffff;
  position: relative;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border: none;
  box-shadow: none;
}
.mobile-brand-header {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 40px;
}
.auth-header {
  margin-bottom: 35px;
}
.auth-header h2 {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--dark);
  letter-spacing: -0.8px;
  margin: 0 0 8px;
}
.auth-header p {
  color: var(--gray-dark);
  font-size: 0.92rem;
  margin: 0;
}
.form-group-custom {
  position: relative;
  margin-bottom: 22px;
}
.form-group-custom label {
  display: block;
  font-weight: 700;
  font-size: 0.82rem;
  margin-bottom: 8px;
  color: var(--dark);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.input-wrapper {
  position: relative;
}
.input-wrapper i.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray);
  font-size: 1rem;
  transition: var(--transition);
  pointer-events: none;
}
.input-wrapper .form-control {
  width: 100%;
  padding: 14px 16px 14px 48px;
  height: 52px;
  font-size: 0.92rem;
  background-color: #f8fafc;
  border: 1.5px solid var(--gray-border);
  border-radius: var(--radius);
  transition: var(--transition);
  color: var(--dark);
  font-family: var(--font);
}
.input-wrapper .form-control::placeholder {
  color: var(--gray);
}
.input-wrapper .form-control:focus {
  outline: none;
  border-color: var(--primary);
  background-color: #ffffff;
  box-shadow: 0 0 0 4px rgba(0, 141, 116, 0.1);
}
.input-wrapper .form-control:focus + i.input-icon {
  color: var(--primary);
}
.toggle-password {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray);
  cursor: pointer;
  transition: var(--transition);
  font-size: 1rem;
  padding: 4px;
}
.toggle-password:hover {
  color: var(--primary);
}
.login-btn {
  width: 100%;
  height: 52px;
  font-size: 0.95rem;
  border-radius: var(--radius);
  margin-top: 15px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: var(--primary);
  color: var(--white);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 141, 116, 0.25);
  transition: var(--transition);
}
.login-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 141, 116, 0.35);
}
.login-btn:active {
  transform: translateY(0);
}
.alert {
  padding: 14px 18px;
  border-radius: var(--radius);
  margin-bottom: 24px;
  font-size: 0.88rem;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid transparent;
}
.alert-error {
  background-color: #fef2f2;
  color: #991b1b;
  border-color: #fee2e2;
}

@media (max-width: 1024px) {
  .auth-left {
    display: none;
  }
  .auth-right {
    background: radial-gradient(circle at top right, #e0f2f1 0%, #f8fafc 60%, #e0f2f1 100%);
    padding: 40px 24px;
    width: 100vw;
  }
  .auth-card {
    background: #ffffff;
    padding: 40px 32px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(255, 255, 255, 0.8);
  }
  .mobile-brand-header {
    display: flex;
  }
}
@media (max-width: 480px) {
  .auth-right {
    padding: 20px 16px;
  }
  .auth-card {
    padding: 30px 20px;
    border-radius: 16px;
  }
  .auth-header h2 {
    font-size: 1.5rem;
  }
}
</style>
