<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-gauge-high"></i></div>
        <h1 class="page-title-text">Dashboard</h1>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center" style="padding: 60px;">
      <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
      <p style="margin-top: 10px; color: var(--gray-dark);">Memuat ringkasan data...</p>
    </div>

    <div v-else>
      <!-- Stats row -->
      <div class="lessa-stat-row">
        <div class="lessa-stat-col">
          <div class="lessa-stat-icon-box">
            <i class="fas fa-coins"></i>
          </div>
          <div class="lessa-stat-info">
            <span class="lessa-stat-label">Penjualan Hari Ini</span>
            <span class="lessa-stat-val">{{ formatRupiah(stats.daily?.total_revenue || 0) }}</span>
          </div>
        </div>
        
        <div class="lessa-stat-col">
          <div class="lessa-stat-icon-box">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="lessa-stat-info">
            <span class="lessa-stat-label">Transaksi Hari Ini</span>
            <span class="lessa-stat-val">{{ formatNumber(stats.daily?.total_transactions || 0) }}</span>
          </div>
        </div>

        <div class="lessa-stat-col">
          <div class="lessa-stat-icon-box">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div class="lessa-stat-info">
            <span class="lessa-stat-label">Omset Bulan Ini</span>
            <span class="lessa-stat-val">{{ formatRupiah(stats.monthly?.total_revenue || 0) }}</span>
          </div>
        </div>

        <div class="lessa-stat-col">
          <div class="lessa-stat-icon-box">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="lessa-stat-info">
            <span class="lessa-stat-label">Laba Bersih Bulan Ini</span>
            <span class="lessa-stat-val">{{ formatRupiah(stats.pl?.net_profit || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Main sections -->
      <div class="dashboard-section">
        <!-- Left: sales chart -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <span class="card-title">Grafik Pendapatan</span>
              <span class="card-title-trend-badge badge-success" style="background-color: var(--success-light); color: var(--success);">
                <i class="fas fa-arrow-trend-up"></i> +23% minggu ini
              </span>
            </div>
            <i class="fas fa-chart-area text-muted" style="color: var(--gray);"></i>
          </div>
          <div class="card-body">
            <div style="position: relative; height: 280px; width: 100%;">
              <canvas id="salesChartCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Right: Info cards & Top products -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- PO Banner -->
          <div class="info-gradient-card">
            <h3 class="info-card-title">Butuh Restok Barang Dagangan?</h3>
            <p class="info-card-text">Stok produk menipis? Buat Purchase Order (PO) ke Supplier terdaftar sekarang juga secara digital.</p>
            <router-link :to="{ name: 'Products' }" class="info-card-btn">
              Kelola Stok Barang <i class="fas fa-arrow-right"></i>
            </router-link>
          </div>

          <!-- Top sellers -->
          <div class="card" style="flex: 1;">
            <div class="card-header">
              <span class="card-title">Produk Terlaris Bulan Ini</span>
              <i class="fas fa-crown" style="color: var(--secondary);"></i>
            </div>
            <div class="card-body">
              <div class="best-seller-grid">
                <p v-if="!stats.top_products || stats.top_products.length === 0" class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 20px;">
                  Belum ada penjualan bulan ini.
                </p>
                <div v-else v-for="item in stats.top_products.slice(0, 3)" :key="item.product_id" class="best-seller-item">
                  <div class="best-seller-img">
                    <i class="fas fa-hamburger" style="color: var(--primary);"></i>
                  </div>
                  <span class="best-seller-name">{{ item.product_name }}</span>
                  <span class="best-seller-qty">{{ item.total_qty }} Porsi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts & Financial PL summary -->
      <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; margin-bottom: 24px; margin-top: 24px;">
        <!-- Stock Warnings -->
        <div class="card">
          <div class="card-header" style="border-bottom: 1px solid var(--danger-light);">
            <span class="card-title" style="color: var(--danger);">
              <i class="fas fa-exclamation-triangle"></i> Peringatan Stok Minimum
            </span>
          </div>
          <div class="card-body" style="padding: 16px;">
            <p v-if="!stats.low_stock || stats.low_stock.length === 0" class="text-muted" style="text-align: center; padding: 20px;">
              Semua produk memiliki stok yang aman.
            </p>
            <ul v-else style="list-style: none; display: flex; flex-direction: column; gap: 10px; padding: 0; margin: 0;">
              <li v-for="prod in stats.low_stock" :key="prod.id" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gray-border); padding-bottom: 8px;">
                <div>
                  <span style="font-weight: 700;">{{ prod.name }}</span><br>
                  <span style="font-size: 0.75rem; color: var(--gray-dark);">SKU: {{ prod.sku }}</span>
                </div>
                <span class="badge badge-danger">{{ prod.stock }} {{ prod.unit }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Profit loss summary -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Ringkasan Laporan Keuangan</span>
            <i class="fas fa-file-invoice-dollar" style="color: var(--primary);"></i>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; justify-content: space-between; font-weight: 600;">
                <span>Pendapatan Kotor:</span>
                <strong style="color: var(--primary);">{{ formatRupiah(stats.pl?.revenue || 0) }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 600;">
                <span>HPP (Harga Pokok Penjualan):</span>
                <strong style="color: var(--danger);">{{ formatRupiah(stats.pl?.cogs || 0) }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 600;">
                <span>Beban Operasional:</span>
                <strong style="color: var(--danger);">{{ formatRupiah((stats.pl?.expenses || 0) - (stats.pl?.other_income || 0)) }}</strong>
              </div>
              <div style="border-top: 1px solid var(--gray-border); padding-top: 12px; display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800;">
                <span>Laba Bersih:</span>
                <span :style="{ color: (stats.pl?.net_profit || 0) >= 0 ? 'var(--primary)' : 'var(--danger)' }">
                  {{ formatRupiah(stats.pl?.net_profit || 0) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import api from '../utils/api';
import Chart from 'chart.js/auto';

const stats = ref({});
const loading = ref(true);
let chartInstance = null;

const formatRupiah = (val) => {
  return 'Rp ' + Number(val).toLocaleString('id-ID');
};

const formatNumber = (val) => {
  return Number(val).toLocaleString('id-ID');
};

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const response = await api.get('/dashboard');
    if (response.data.status) {
      stats.value = response.data.data;
      loading.value = false; // Set loading to false so the canvas is rendered in the DOM
      
      // Render chart on next DOM update
      await nextTick();
      renderChart(stats.value.chart_data || []);
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    loading.value = false;
  }
};

const renderChart = (chartData) => {
  const canvas = document.getElementById('salesChartCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = chartData.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  });
  const totals = chartData.map(item => item.total);

  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(0, 141, 116, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 141, 116, 0.00)');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Omset Penjualan (Rp)',
        data: totals,
        borderColor: '#008d74',
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        borderWidth: 4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#008d74',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Inter',
              weight: 600
            }
          }
        },
        y: {
          grid: {
            color: '#f1f5f9'
          },
          ticks: {
            font: {
              family: 'Inter',
              weight: 600
            },
            callback: function(value) {
              return 'Rp ' + value.toLocaleString('id-ID');
            }
          }
        }
      }
    }
  });
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
/* Scoped tweaks for dashboard components */
.lessa-stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .lessa-stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .lessa-stat-row {
    grid-template-columns: 1fr;
  }
}
</style>
