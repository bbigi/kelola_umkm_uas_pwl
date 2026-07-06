<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-chart-line"></i></div>
        <h1 class="page-title-text">Laporan Laba / Rugi</h1>
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="message" class="alert alert-error">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ message }}</span>
      <button class="alert-close" @click="message = ''"><i class="fas fa-times"></i></button>
    </div>

    <!-- Period Filter Card -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <h2 class="card-title">Filter Periode Laporan</h2>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input 
            type="date" 
            v-model="filter.start" 
            class="form-control" 
            style="width: 160px; height: 38px; padding: 4px 8px;"
          >
          <span style="color: var(--gray-dark);">s/d</span>
          <input 
            type="date" 
            v-model="filter.end" 
            class="form-control" 
            style="width: 160px; height: 38px; padding: 4px 8px;"
          >
          <button @click="fetchProfitLoss" class="btn btn-primary" :disabled="loading">
            <i class="fas fa-search"></i> Tampilkan Laporan
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center" style="padding: 60px;">
      <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
      <p style="margin-top: 10px; color: var(--gray-dark);">Menghitung laporan laba rugi...</p>
    </div>

    <!-- Statement Card -->
    <div v-else class="card" style="max-width: 800px; margin: 0 auto 30px;">
      <div class="card-header" style="text-align: center; display: block; padding: 30px 24px;">
        <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--dark); margin-bottom: 6px; letter-spacing: 1px;">LAPORAN LABA / RUGI</h1>
        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 0;">
          Periode: <strong>{{ formatDate(filter.start) }}</strong> s/d <strong>{{ formatDate(filter.end) }}</strong>
        </p>
      </div>
      <div class="card-body" style="padding: 30px;">
        <!-- P&L Table representation -->
        <div style="display: flex; flex-direction: column; gap: 16px; font-size: 1.05rem;">
          
          <!-- Pendapatan -->
          <div style="border-bottom: 2px solid var(--dark); padding-bottom: 8px; font-weight: 700; font-size: 1.15rem; display: flex; justify-content: space-between; color: var(--dark);">
            <span>PENDAPATAN</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px;">
            <span>Penjualan Bersih (POS)</span>
            <strong>{{ formatRupiah(pl.revenue) }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            <span>Pemasukan Lain-lain</span>
            <strong>{{ formatRupiah(pl.other_income) }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 600; background-color: var(--gray-light); padding: 12px 20px; border-radius: var(--radius-sm);">
            <span>TOTAL PENDAPATAN (A)</span>
            <span>{{ formatRupiah(Number(pl.revenue) + Number(pl.other_income)) }}</span>
          </div>

          <!-- Harga Pokok Penjualan -->
          <div style="border-bottom: 2px solid var(--dark); padding-bottom: 8px; margin-top: 16px; font-weight: 700; font-size: 1.15rem; display: flex; justify-content: space-between; color: var(--dark);">
            <span>HARGA POKOK PENJUALAN (HPP)</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            <span>Harga Pokok Penjualan (HPP) Barang Terjual</span>
            <strong style="color: var(--danger);">{{ formatRupiah(pl.cogs) }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 600; background-color: var(--gray-light); padding: 12px 20px; border-radius: var(--radius-sm);">
            <span>TOTAL HPP (B)</span>
            <span style="color: var(--danger);">{{ formatRupiah(pl.cogs) }}</span>
          </div>

          <!-- Laba Kotor -->
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.15rem; background-color: var(--primary-light); color: var(--primary); padding: 14px 20px; border-radius: var(--radius-sm); margin-top: 10px;">
            <span>LABA KOTOR (C = A - B)</span>
            <span>{{ formatRupiah(Number(pl.gross_profit) + Number(pl.other_income)) }}</span>
          </div>

          <!-- Pengeluaran Operasional -->
          <div style="border-bottom: 2px solid var(--dark); padding-bottom: 8px; margin-top: 16px; font-weight: 700; font-size: 1.15rem; display: flex; justify-content: space-between; color: var(--dark);">
            <span>BEBAN OPERASIONAL & BIAYA</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            <span>Beban Operasional Toko</span>
            <strong style="color: var(--danger);">{{ formatRupiah(pl.expenses) }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 600; background-color: var(--gray-light); padding: 12px 20px; border-radius: var(--radius-sm);">
            <span>TOTAL BEBAN OPERASIONAL (D)</span>
            <span style="color: var(--danger);">{{ formatRupiah(pl.expenses) }}</span>
          </div>

          <!-- Laba/Rugi Bersih -->
          <div 
            style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.3rem; padding: 18px 20px; border-radius: var(--radius); margin-top: 20px;"
            :style="netProfitStyle"
          >
            <span>LABA / RUGI BERSIH (C - D)</span>
            <span>{{ formatRupiah(pl.net_profit) }}</span>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../utils/api';

// Date Helpers
const getMonthStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 2).toISOString().split('T')[0];
};

const getMonthEnd = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().split('T')[0];
};

const filter = ref({
  start: getMonthStart(),
  end: getMonthEnd()
});

const pl = ref({
  revenue: 0,
  other_income: 0,
  cogs: 0,
  gross_profit: 0,
  expenses: 0,
  net_profit: 0
});

const loading = ref(true);
const message = ref('');

const fetchProfitLoss = async () => {
  loading.value = true;
  message.value = '';
  try {
    const params = {
      start: filter.value.start,
      end: filter.value.end
    };
    const res = await api.get('/finance/profit-loss', { params });
    if (res.data.status) {
      pl.value = res.data.data.pl;
    }
  } catch (err) {
    console.error(err);
    message.value = 'Gagal menghitung laporan laba rugi.';
  } finally {
    loading.value = false;
  }
};

const netProfitStyle = computed(() => {
  const isProfit = Number(pl.value.net_profit) >= 0;
  return {
    backgroundColor: isProfit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
    color: isProfit ? '#065f46' : '#991b1b',
    border: `1px solid ${isProfit ? '#a7f3d0' : '#fecaca'}`
  };
});

const formatRupiah = (val) => {
  if (val === null || val === undefined) return 'Rp 0';
  const num = Number(val);
  const prefix = num < 0 ? '-Rp ' : 'Rp ';
  return prefix + Math.abs(num).toLocaleString('id-ID');
};

const formatDate = (val) => {
  if (!val) return '-';
  const date = new Date(val);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

onMounted(() => {
  fetchProfitLoss();
});
</script>

<style scoped>
</style>
