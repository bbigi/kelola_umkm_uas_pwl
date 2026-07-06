<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-wallet"></i></div>
        <h1 class="page-title-text">Pemasukan & Pengeluaran</h1>
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="message" :class="['alert', isError ? 'alert-error' : 'alert-success']">
      <i :class="['fas', isError ? 'fa-exclamation-circle' : 'fa-check-circle']"></i>
      <span>{{ message }}</span>
      <button class="alert-close" @click="message = ''"><i class="fas fa-times"></i></button>
    </div>

    <!-- Grid Layout -->
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
      <!-- Form Card -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">{{ formTitle }}</h2>
        </div>
        <div class="card-body">
          <form @submit.prevent="submitForm">
            <div class="form-group-custom">
              <label>Jenis Transaksi *</label>
              <div style="display: flex; gap: 16px; margin-top: 8px;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="radio" v-model="form.type" value="expense">
                  <span>Pengeluaran (Beban)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="radio" v-model="form.type" value="income">
                  <span>Pemasukan Lainnya</span>
                </label>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="expCategory">Kategori / Akun *</label>
              <div class="input-wrapper">
                <input 
                  type="text" 
                  id="expCategory" 
                  v-model="form.category" 
                  class="form-control" 
                  required 
                  placeholder="Gaji Karyawan, Listrik, Sewa Ruko, dll."
                >
                <i class="fas fa-tags input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="expAmount">Nominal Rupiah (Rp) *</label>
              <div class="input-wrapper">
                <input 
                  type="number" 
                  id="expAmount" 
                  v-model="form.amount" 
                  class="form-control" 
                  required 
                  min="0" 
                  placeholder="0"
                >
                <i class="fas fa-money-bill-wave input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="expDate">Tanggal Transaksi *</label>
              <div class="input-wrapper">
                <input 
                  type="date" 
                  id="expDate" 
                  v-model="form.date" 
                  class="form-control" 
                  required
                >
                <i class="fas fa-calendar input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="expDesc">Keterangan / Deskripsi</label>
              <div class="input-wrapper">
                <textarea 
                  id="expDesc" 
                  v-model="form.description" 
                  class="form-control" 
                  placeholder="Tulis deskripsi detail..."
                  style="height: 100px; padding-top: 14px; resize: vertical;"
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

      <!-- Table Card with Filter -->
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <h2 class="card-title">Daftar Buku Kas Operasional</h2>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input 
              type="date" 
              v-model="filter.start" 
              class="form-control" 
              style="width: 140px; height: 36px; padding: 4px 8px; font-size: 0.82rem;"
              @change="fetchRecords"
            >
            <span style="color: var(--gray-dark);">s/d</span>
            <input 
              type="date" 
              v-model="filter.end" 
              class="form-control" 
              style="width: 140px; height: 36px; padding: 4px 8px; font-size: 0.82rem;"
              @change="fetchRecords"
            >
            <select 
              v-model="filter.type" 
              class="form-control" 
              style="width: 120px; height: 36px; padding: 4px 8px; font-size: 0.82rem;"
              @change="fetchRecords"
            >
              <option value="">Semua</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <div v-if="loading" class="text-center" style="padding: 60px;">
            <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
            <p style="margin-top: 10px; color: var(--gray-dark);">Memuat catatan kas...</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Keterangan</th>
                  <th style="text-align: right;">Nominal</th>
                  <th style="width: 120px; text-align: center;">Jenis</th>
                  <th style="width: 120px; text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="records.length === 0">
                  <td colspan="6" class="text-center" style="padding: 30px; color: var(--gray-dark);">
                    Tidak ada catatan keuangan pada periode ini.
                  </td>
                </tr>
                <tr v-else v-for="r in records" :key="r.id">
                  <td>{{ formatDate(r.date) }}</td>
                  <td><strong>{{ r.category }}</strong></td>
                  <td>{{ r.description || '-' }}</td>
                  <td style="text-align: right; font-weight: 700;">{{ formatRupiah(r.amount) }}</td>
                  <td style="text-align: center;">
                    <span :class="['badge', r.type === 'expense' ? 'badge-danger' : 'badge-success']">
                      {{ r.type === 'expense' ? 'Pengeluaran' : 'Pemasukan' }}
                    </span>
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

// Date Helpers
const getMonthStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 2).toISOString().split('T')[0];
};

const getMonthEnd = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().split('T')[0];
};

const records = ref([]);
const loading = ref(true);
const submitting = ref(false);

const message = ref('');
const isError = ref(false);

const filter = ref({
  start: getMonthStart(),
  end: getMonthEnd(),
  type: ''
});

const form = ref({
  id: null,
  type: 'expense',
  category: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  description: ''
});

const formTitle = computed(() => form.value.id ? 'Edit Catatan Keuangan' : 'Catat Pemasukan / Pengeluaran');

const fetchRecords = async () => {
  loading.value = true;
  try {
    const params = {
      start: filter.value.start,
      end: filter.value.end,
      type: filter.value.type
    };
    const res = await api.get('/finance/expenses', { params });
    if (res.data.status) {
      records.value = res.data.data.records;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal memuat data keuangan.', true);
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
    category: r.category,
    amount: Number(r.amount),
    date: r.date,
    description: r.description || ''
  };
};

const resetForm = () => {
  form.value = {
    id: null,
    type: 'expense',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  };
};

const submitForm = async () => {
  submitting.value = true;
  try {
    const res = await api.post('/finance/expenses', form.value);
    if (res.data.status) {
      showAlert(res.data.message);
      resetForm();
      fetchRecords();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan catatan.', true);
  } finally {
    submitting.value = false;
  }
};

const deleteRecord = async (r) => {
  if (!confirm('Apakah Anda yakin ingin menghapus catatan kas ini?')) return;
  try {
    const res = await api.delete(`/finance/expenses/${r.id}`);
    if (res.data.status) {
      showAlert(res.data.message);
      fetchRecords();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menghapus catatan.', true);
  }
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
  fetchRecords();
});
</script>

<style scoped>
textarea.form-control {
  padding-left: 40px !important;
}
</style>
