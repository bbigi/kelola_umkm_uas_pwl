<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-clipboard-check"></i></div>
        <h1 class="page-title-text">Penyesuaian Stok (Stock Opname)</h1>
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="message" :class="['alert', isError ? 'alert-error' : 'alert-success']">
      <i :class="['fas', isError ? 'fa-exclamation-circle' : 'fa-check-circle']"></i>
      <span>{{ message }}</span>
      <button class="alert-close" @click="message = ''"><i class="fas fa-times"></i></button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center" style="padding: 60px;">
      <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
      <p style="margin-top: 10px; color: var(--gray-dark);">Memuat data stok...</p>
    </div>

    <!-- Main Content Grid -->
    <div v-else style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px;">
      <!-- Form Opname Card -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Mulai Penyesuaian Stok</h2>
        </div>
        <div class="card-body">
          <p class="text-muted" style="margin-bottom: 20px; font-size: 0.9rem;">
            Masukkan jumlah stok fisik yang benar-benar ada di gudang saat ini. Sistem akan secara otomatis menghitung perbedaan dan mencatat log penyesuaian.
          </p>

          <form @submit.prevent="submitOpname">
            <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
              <table class="table" style="font-size: 0.85rem;">
                <thead>
                  <tr>
                    <th>Nama Barang</th>
                    <th style="width: 100px; text-align: center;">Stok Sistem</th>
                    <th style="width: 130px; text-align: center;">Stok Fisik *</th>
                    <th>Alasan Penyesuaian</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in opnameItems" :key="item.product_id">
                    <td>
                      <strong>{{ item.name }}</strong><br>
                      <span style="font-size: 0.75rem; color: var(--gray-dark);">SKU: {{ item.sku }}</span>
                    </td>
                    <td style="text-align: center;">
                      <span class="badge badge-info">{{ item.system_stock }}</span>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        v-model="item.actual_stock" 
                        class="form-control" 
                        style="padding: 6px 10px; text-align: center; height: 34px;" 
                        min="0" 
                        required
                      >
                    </td>
                    <td>
                      <input 
                        type="text" 
                        v-model="item.reason" 
                        class="form-control" 
                        style="padding: 6px 10px; height: 34px;" 
                        placeholder="Rusak, Selisih hitung, dll..."
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary" :disabled="submitting" style="padding: 10px 20px;">
                {{ submitting ? 'Menyimpan...' : 'Simpan Penyesuaian Stok' }} <i class="fas fa-check-double" style="margin-left: 4px;"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- History Card -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Riwayat Log Penyesuaian Stok</h2>
        </div>
        <div class="card-body" style="padding: 0;">
          <div style="max-height: 580px; overflow-y: auto; padding: 20px;">
            <p v-if="adjustments.length === 0" class="text-muted" style="text-align: center; padding: 40px;">
              Belum ada riwayat penyesuaian stok.
            </p>
            <div v-else style="display: flex; flex-direction: column; gap: 14px;">
              <div 
                v-for="adj in adjustments" 
                :key="adj.id" 
                style="border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;"
              >
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                  <strong style="font-size: 0.9rem; color: var(--dark);">{{ adj.product_name }}</strong>
                  <span :class="['badge', adj.difference >= 0 ? 'badge-success' : 'badge-danger']">
                    {{ adj.difference >= 0 ? '+' : '' }}{{ adj.difference }}
                  </span>
                </div>
                <div style="font-size: 0.75rem; color: var(--gray-dark); margin-bottom: 6px;">
                  SKU: {{ adj.sku }} | {{ formatDateTime(adj.created_at) }}
                </div>
                <div style="font-size: 0.82rem; background-color: var(--gray-light); padding: 8px 12px; border-radius: var(--radius-sm); line-height: 1.4;">
                  <strong>Jenis:</strong> <span style="text-transform: uppercase;">{{ adj.type }}</span><br>
                  <strong>Alasan:</strong> {{ adj.reason || '-' }}<br>
                  <strong>Petugas:</strong> {{ adj.user_name || 'System' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../utils/api';

const opnameItems = ref([]);
const adjustments = ref([]);

const loading = ref(true);
const submitting = ref(false);

const message = ref('');
const isError = ref(false);

const fetchOpnameData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/inventory/stock-opname');
    if (res.data.status) {
      adjustments.value = res.data.data.adjustments;
      // Map products list to editable actual stock list
      opnameItems.value = res.data.data.products.map(p => ({
        product_id: p.id,
        name: p.name,
        sku: p.sku,
        system_stock: p.stock,
        actual_stock: p.stock,
        reason: ''
      }));
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal mengambil data stock opname.', true);
  } finally {
    loading.value = false;
  }
};

const showAlert = (msg, err = false) => {
  message.value = msg;
  isError.value = err;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

const submitOpname = async () => {
  // Check if any change has been made
  const changedItems = opnameItems.value.filter(
    item => Number(item.actual_stock) !== Number(item.system_stock)
  );

  if (changedItems.length === 0) {
    alert('Tidak ada perbedaan stok yang dimasukkan untuk disesuaikan.');
    return;
  }

  if (!confirm(`Apakah Anda yakin ingin menyimpan penyesuaian untuk ${changedItems.length} produk?`)) return;

  submitting.value = true;
  try {
    const res = await api.post('/inventory/stock-opname', {
      items: changedItems.map(i => ({
        product_id: i.product_id,
        actual_stock: i.actual_stock,
        reason: i.reason
      }))
    });
    if (res.data.status) {
      showAlert(res.data.message);
      fetchOpnameData();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan penyesuaian stok.', true);
  } finally {
    submitting.value = false;
  }
};

const formatDateTime = (val) => {
  if (!val) return '-';
  const date = new Date(val);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ' ' + date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  fetchOpnameData();
});
</script>

<style scoped>
</style>
