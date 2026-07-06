<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-handshake"></i></div>
        <h1 class="page-title-text">Hutang Piutang</h1>
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="message" :class="['alert', isError ? 'alert-error' : 'alert-success']">
      <i :class="['fas', isError ? 'fa-exclamation-circle' : 'fa-check-circle']"></i>
      <span>{{ message }}</span>
      <button class="alert-close" @click="message = ''"><i class="fas fa-times"></i></button>
    </div>

    <!-- Grid Layout -->
    <div style="display: grid; grid-template-columns: 1fr 2.2fr; gap: 24px;">
      <!-- Form Card -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">{{ formTitle }}</h2>
        </div>
        <div class="card-body">
          <form @submit.prevent="submitForm">
            <div class="form-group-custom">
              <label>Jenis Catatan *</label>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="radio" v-model="form.type" value="receivable">
                  <span>Piutang (Toko Diutangi)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="radio" v-model="form.type" value="payable">
                  <span>Hutang Toko (Toko Berhutang)</span>
                </label>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="recName">Nama Kontak *</label>
              <div class="input-wrapper">
                <input 
                  type="text" 
                  id="recName" 
                  v-model="form.name" 
                  class="form-control" 
                  required 
                  placeholder="Contoh: Pak Budi, PT Restu Jaya"
                >
                <i class="fas fa-user input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="recPhone">Nomor Telepon</label>
              <div class="input-wrapper">
                <input 
                  type="text" 
                  id="recPhone" 
                  v-model="form.phone" 
                  class="form-control" 
                  placeholder="0812xxxxxxxx"
                >
                <i class="fas fa-phone input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="recAmount">Total Nominal (Rp) *</label>
              <div class="input-wrapper">
                <input 
                  type="number" 
                  id="recAmount" 
                  v-model="form.amount" 
                  class="form-control" 
                  required 
                  min="1" 
                  placeholder="0"
                >
                <i class="fas fa-money-bill input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="recPaidAmount">Jumlah Yang Sudah Dibayar (Rp)</label>
              <div class="input-wrapper">
                <input 
                  type="number" 
                  id="recPaidAmount" 
                  v-model="form.paid_amount" 
                  class="form-control" 
                  min="0"
                >
                <i class="fas fa-coins input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="recDueDate">Tanggal Jatuh Tempo</label>
              <div class="input-wrapper">
                <input 
                  type="date" 
                  id="recDueDate" 
                  v-model="form.due_date" 
                  class="form-control"
                >
                <i class="fas fa-calendar input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="recDesc">Keterangan Tambahan</label>
              <div class="input-wrapper">
                <textarea 
                  id="recDesc" 
                  v-model="form.description" 
                  class="form-control" 
                  placeholder="Tulis alasan hutang atau detail lainnya..."
                  style="height: 80px; padding-top: 14px; resize: vertical;"
                ></textarea>
                <i class="fas fa-sticky-note input-icon" style="top: 24px; transform: none;"></i>
              </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 24px;">
              <button type="button" class="btn btn-outline" style="flex: 1;" @click="resetForm">Reset</button>
              <button type="submit" class="btn btn-primary" style="flex: 2;" :disabled="submitting">
                {{ submitting ? 'Menyimpan...' : 'Simpan Catatan' }} <i class="fas fa-save" style="margin-left: 4px;"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Table Card -->
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <h2 class="card-title">Daftar Buku Hutang Piutang</h2>
          <div style="display: flex; gap: 8px;">
            <select 
              v-model="filter.type" 
              class="form-control" 
              style="width: 140px; height: 36px; padding: 4px 8px; font-size: 0.82rem;"
              @change="fetchReceivables"
            >
              <option value="">Semua Jenis</option>
              <option value="receivable">Piutang (Toko Diutangi)</option>
              <option value="payable">Hutang Toko</option>
            </select>
            <select 
              v-model="filter.status" 
              class="form-control" 
              style="width: 140px; height: 36px; padding: 4px 8px; font-size: 0.82rem;"
              @change="fetchReceivables"
            >
              <option value="">Semua Status</option>
              <option value="outstanding">Belum Bayar</option>
              <option value="partial">Dicicil</option>
              <option value="paid">Lunas</option>
            </select>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <div v-if="loading" class="text-center" style="padding: 60px;">
            <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
            <p style="margin-top: 10px; color: var(--gray-dark);">Memuat catatan...</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Kontak</th>
                  <th>Jenis</th>
                  <th style="text-align: right;">Total</th>
                  <th style="text-align: right;">Dibayar</th>
                  <th style="text-align: right;">Sisa</th>
                  <th>Jatuh Tempo</th>
                  <th style="text-align: center;">Status</th>
                  <th style="width: 120px; text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="receivables.length === 0">
                  <td colspan="8" class="text-center" style="padding: 30px; color: var(--gray-dark);">
                    Tidak ada data hutang piutang.
                  </td>
                </tr>
                <tr v-else v-for="r in receivables" :key="r.id">
                  <td>
                    <strong>{{ r.name }}</strong><br>
                    <span style="font-size: 0.75rem; color: var(--gray-dark);">{{ r.phone || '-' }}</span>
                  </td>
                  <td>
                    <span :class="['badge', r.type === 'receivable' ? 'badge-info' : 'badge-danger']">
                      {{ r.type === 'receivable' ? 'Piutang' : 'Hutang Toko' }}
                    </span>
                  </td>
                  <td style="text-align: right;">{{ formatRupiah(r.amount) }}</td>
                  <td style="text-align: right;">{{ formatRupiah(r.paid_amount) }}</td>
                  <td style="text-align: right; font-weight: 700;">{{ formatRupiah(Number(r.amount) - Number(r.paid_amount)) }}</td>
                  <td>
                    <span v-if="r.due_date" :style="isOverdue(r) ? 'color: var(--danger); font-weight: bold;' : ''">
                      {{ formatDate(r.due_date) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td style="text-align: center;">
                    <span v-if="r.status === 'paid'" class="badge badge-success">Lunas</span>
                    <span v-else-if="r.status === 'partial'" class="badge badge-warning">Dicicil</span>
                    <span v-else class="badge badge-danger">Belum Bayar</span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 8px; justify-content: flex-end; width: 100%;">
                      <button @click="editRecord(r)" class="btn btn-sm btn-outline" title="Edit">
                        <i class="fas fa-edit" style="color: var(--primary);"></i>
                      </button>
                      <button @click="deleteRecord(r)" class="btn btn-sm btn-outline" title="Hapus">
                        <i class="fas fa-trash" style="color: var(--danger);"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../utils/api';

const receivables = ref([]);
const loading = ref(true);
const submitting = ref(false);

const message = ref('');
const isError = ref(false);

const filter = ref({
  type: '',
  status: ''
});

const form = ref({
  id: null,
  type: 'receivable',
  name: '',
  phone: '',
  amount: '',
  paid_amount: 0,
  due_date: '',
  description: ''
});

const formTitle = computed(() => form.value.id ? 'Edit Hutang / Piutang' : 'Catat Hutang / Piutang');

const fetchReceivables = async () => {
  loading.value = true;
  try {
    const params = {
      type: filter.value.type,
      status: filter.value.status
    };
    const res = await api.get('/finance/receivables', { params });
    if (res.data.status) {
      receivables.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal mengambil data hutang piutang.', true);
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

const editRecord = (r) => {
  form.value = {
    id: r.id,
    type: r.type,
    name: r.name,
    phone: r.phone || '',
    amount: Number(r.amount),
    paid_amount: Number(r.paid_amount),
    due_date: r.due_date || '',
    description: r.description || ''
  };
};

const resetForm = () => {
  form.value = {
    id: null,
    type: 'receivable',
    name: '',
    phone: '',
    amount: '',
    paid_amount: 0,
    due_date: '',
    description: ''
  };
};

const submitForm = async () => {
  submitting.value = true;
  try {
    const res = await api.post('/finance/receivables', form.value);
    if (res.data.status) {
      showAlert(res.data.message);
      resetForm();
      fetchReceivables();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan catatan.', true);
  } finally {
    submitting.value = false;
  }
};

const deleteRecord = async (r) => {
  if (!confirm('Apakah Anda yakin ingin menghapus data hutang piutang ini?')) return;
  try {
    const res = await api.delete(`/finance/receivables/${r.id}`);
    if (res.data.status) {
      showAlert(res.data.message);
      fetchReceivables();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menghapus catatan.', true);
  }
};

const isOverdue = (r) => {
  if (!r.due_date || r.status === 'paid') return false;
  return new Date(r.due_date) < new Date();
};

const formatRupiah = (val) => {
  if (val === null || val === undefined) return 'Rp 0';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
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
  fetchReceivables();
});
</script>

<style scoped>
textarea.form-control {
  padding-left: 40px !important;
}
</style>
