<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-file-invoice"></i></div>
        <h1 class="page-title-text">Purchase Orders (PO)</h1>
      </div>
      <button @click="openAddPoModal" class="btn btn-primary">
        <i class="fas fa-plus"></i> Buat PO Baru
      </button>
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
      <p style="margin-top: 10px; color: var(--gray-dark);">Memuat purchase orders...</p>
    </div>

    <!-- PO Table Card -->
    <div v-else class="card">
      <div class="card-header">
        <h2 class="card-title">Riwayat Purchase Order / Restok Barang</h2>
      </div>
      <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Nomor PO</th>
                <th>Tanggal</th>
                <th>Supplier</th>
                <th>Dibuat Oleh</th>
                <th style="text-align: right;">Total Biaya</th>
                <th style="text-align: center;">Status</th>
                <th style="width: 180px; text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pos.length === 0">
                <td colspan="7" class="text-center" style="padding: 30px; color: var(--gray-dark);">
                  Belum ada riwayat Purchase Order.
                </td>
              </tr>
              <tr v-else v-for="po in pos" :key="po.id">
                <td><strong>{{ po.po_number }}</strong></td>
                <td>{{ formatDateTime(po.created_at) }}</td>
                <td>{{ po.supplier_name }}</td>
                <td>{{ po.created_by_name || 'System' }}</td>
                <td style="text-align: right; font-weight: 700;">{{ formatRupiah(po.total) }}</td>
                <td style="text-align: center;">
                  <span v-if="po.status === 'pending'" class="badge badge-warning">Menunggu</span>
                  <span v-else-if="po.status === 'received'" class="badge badge-success">Diterima</span>
                  <span v-else class="badge badge-danger">Batal</span>
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 8px; justify-content: flex-end; width: 100%;">
                    <button 
                      v-if="po.status === 'pending'" 
                      @click="receivePo(po)" 
                      class="btn btn-sm btn-success" 
                      style="border: none; color: white;"
                    >
                      <i class="fas fa-check" style="margin-right: 4px;"></i> Terima Barang
                    </button>
                    <span v-else style="font-size: 0.82rem; color: var(--gray-dark); display: inline-flex; align-items: center; gap: 4px; padding-right: 8px;">
                      <i class="fas fa-lock"></i> Selesai
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add PO Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card" style="max-width: 800px;">
        <div class="modal-header">
          <h3>Buat Purchase Order Baru</h3>
          <button @click="showModal = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="submitPo">
          <div class="modal-body">
            <div class="form-group-custom">
              <label for="poSupplier">Pilih Supplier *</label>
              <div class="input-wrapper">
                <select id="poSupplier" v-model="form.supplier_id" class="form-control" required style="padding-left: 40px;">
                  <option value="">-- Pilih Supplier --</option>
                  <option v-for="s in suppliers" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </option>
                </select>
                <i class="fas fa-truck input-icon"></i>
              </div>
            </div>

            <!-- Items Section -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; margin-top: 24px;">
              <h4 style="font-weight: 700; color: var(--dark);">Daftar Item Barang Restok</h4>
              <button type="button" class="btn btn-sm btn-outline" @click="addPoRow">
                <i class="fas fa-plus"></i> Tambah Baris
              </button>
            </div>

            <div class="table-responsive">
              <table class="table" style="font-size: 0.85rem;">
                <thead>
                  <tr>
                    <th>Produk *</th>
                    <th style="width: 120px; text-align: center;">Qty *</th>
                    <th style="width: 180px; text-align: right;">Harga Beli Unit HPP (Rp) *</th>
                    <th style="width: 60px; text-align: center;">Hapus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in form.items" :key="index">
                    <td>
                      <select 
                        v-model="row.product_id" 
                        class="form-control" 
                        required 
                        style="height: 38px;"
                        @change="onProductSelect(index)"
                      >
                        <option value="">-- Pilih Produk --</option>
                        <option v-for="p in products" :key="p.id" :value="p.id">
                          {{ p.name }} (SKU: {{ p.sku }})
                        </option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        v-model="row.qty" 
                        class="form-control" 
                        min="1" 
                        required 
                        style="text-align: center; height: 38px;"
                      >
                    </td>
                    <td>
                      <input 
                        type="number" 
                        v-model="row.buy_price" 
                        class="form-control" 
                        min="0" 
                        required 
                        style="text-align: right; height: 38px;"
                      >
                    </td>
                    <td style="text-align: center;">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-outline" 
                        style="border-color: var(--danger); color: var(--danger); padding: 6px 10px;"
                        @click="removePoRow(index)"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="form-group-custom" style="margin-top: 24px;">
              <label for="poNote">Catatan / Keterangan Tambahan</label>
              <div class="input-wrapper">
                <textarea 
                  id="poNote" 
                  v-model="form.note" 
                  class="form-control" 
                  placeholder="Tulis instruksi tambahan ke supplier..."
                  style="height: 80px; padding-top: 14px; resize: vertical;"
                ></textarea>
                <i class="fas fa-sticky-note input-icon" style="top: 24px; transform: none;"></i>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showModal = false" class="btn btn-outline">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : 'Simpan & Proses PO' }} <i class="fas fa-paper-plane" style="margin-left: 4px;"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../utils/api';

const pos = ref([]);
const suppliers = ref([]);
const products = ref([]);

const loading = ref(true);
const submitting = ref(false);

const message = ref('');
const isError = ref(false);

const showModal = ref(false);

const form = ref({
  supplier_id: '',
  items: [],
  note: ''
});

const fetchPoData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/inventory/purchase-orders');
    if (res.data.status) {
      pos.value = res.data.data.pos;
      suppliers.value = res.data.data.suppliers;
      products.value = res.data.data.products;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal memuat data Purchase Order.', true);
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

const openAddPoModal = () => {
  form.value = {
    supplier_id: '',
    items: [],
    note: ''
  };
  addPoRow(); // Add initial row
  showModal.value = true;
};

const addPoRow = () => {
  form.value.items.push({
    product_id: '',
    qty: 1,
    buy_price: 0
  });
};

const removePoRow = (index) => {
  form.value.items.splice(index, 1);
};

const onProductSelect = (index) => {
  const row = form.value.items[index];
  const prod = products.value.find(p => p.id === row.product_id);
  if (prod) {
    row.buy_price = Math.round(prod.buy_price);
  }
};

const submitPo = async () => {
  if (form.value.items.length === 0) {
    alert('Harap tambahkan minimal 1 item barang.');
    return;
  }
  
  submitting.value = true;
  try {
    const res = await api.post('/inventory/purchase-orders', form.value);
    if (res.data.status) {
      showAlert(res.data.message);
      showModal.value = false;
      fetchPoData();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan PO.', true);
  } finally {
    submitting.value = false;
  }
};

const receivePo = async (po) => {
  if (!confirm(`Apakah Anda yakin barang untuk PO ${po.po_number} telah diterima seluruhnya?\nTindakan ini akan langsung menambah stok produk di sistem.`)) return;
  try {
    const res = await api.post(`/inventory/purchase-orders/receive/${po.id}`);
    if (res.data.status) {
      showAlert(res.data.message);
      fetchPoData();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal memproses penerimaan barang.', true);
  }
};

const formatRupiah = (val) => {
  if (val === null || val === undefined) return 'Rp 0';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
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
  fetchPoData();
});
</script>

<style scoped>
.form-group-custom select.form-control {
  background-position: calc(100% - 12px) 50%;
}
</style>
