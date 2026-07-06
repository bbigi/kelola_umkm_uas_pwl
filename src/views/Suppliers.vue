<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-truck"></i></div>
        <h1 class="page-title-text">Manajemen Supplier</h1>
      </div>
      <button v-if="canManage" @click="openAddModal" class="btn btn-primary">
        <i class="fas fa-plus"></i> Tambah Supplier
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
      <p style="margin-top: 10px; color: var(--gray-dark);">Memuat data supplier...</p>
    </div>

    <!-- Suppliers Table -->
    <div v-else class="card">
      <div class="card-body" style="padding: 0;">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 80px;">No</th>
              <th>Nama Supplier</th>
              <th>Telepon</th>
              <th>Email</th>
              <th>Alamat</th>
              <th v-if="canManage" style="width: 180px; text-align: right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="suppliers.length === 0">
              <td colspan="6" class="text-center" style="padding: 30px; color: var(--gray-dark);">
                Belum ada supplier terdaftar.
              </td>
            </tr>
            <tr v-else v-for="(sup, index) in suppliers" :key="sup.id">
              <td>{{ index + 1 }}</td>
              <td style="font-weight: 700;">{{ sup.name }}</td>
              <td>{{ sup.phone || '-' }}</td>
              <td>{{ sup.email || '-' }}</td>
              <td>{{ sup.address || '-' }}</td>
              <td v-if="canManage" style="text-align: right;">
                <div style="display: inline-flex; gap: 8px; justify-content: flex-end; width: 100%;">
                  <button @click="openEditModal(sup)" class="btn btn-sm btn-outline" title="Edit">
                    <i class="fas fa-edit" style="color: var(--primary);"></i>
                  </button>
                  <button @click="deleteSupplier(sup)" class="btn btn-sm btn-outline" title="Hapus">
                    <i class="fas fa-trash" style="color: var(--danger);"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form (Add / Edit) -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button @click="showModal = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="submitForm">
          <div class="modal-body">
            <div class="form-group-custom">
              <label for="supName">Nama Supplier</label>
              <div class="input-wrapper">
                <input 
                  type="text" 
                  id="supName" 
                  v-model="form.name" 
                  class="form-control" 
                  placeholder="Contoh: PT. Sumber Makmur" 
                  required
                >
                <i class="fas fa-truck input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="supPhone">No. Telepon / HP</label>
              <div class="input-wrapper">
                <input 
                  type="text" 
                  id="supPhone" 
                  v-model="form.phone" 
                  class="form-control" 
                  placeholder="Contoh: 08123456789"
                >
                <i class="fas fa-phone input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="supEmail">Email</label>
              <div class="input-wrapper">
                <input 
                  type="email" 
                  id="supEmail" 
                  v-model="form.email" 
                  class="form-control" 
                  placeholder="Contoh: sales@sumbermakmur.com"
                >
                <i class="fas fa-envelope input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="supAddress">Alamat Lengkap</label>
              <div class="input-wrapper">
                <textarea 
                  id="supAddress" 
                  v-model="form.address" 
                  class="form-control" 
                  placeholder="Alamat supplier..." 
                  style="height: 100px; padding-top: 14px; resize: vertical;"
                ></textarea>
                <i class="fas fa-location-dot input-icon" style="top: 24px; transform: none;"></i>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showModal = false" class="btn btn-outline">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : 'Simpan Supplier' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../utils/api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const canManage = computed(() => authStore.isOwner || authStore.isGudang);

const suppliers = ref([]);
const loading = ref(true);
const submitting = ref(false);

const showModal = ref(false);
const modalTitle = ref('Tambah Supplier');
const form = ref({
  id: null,
  name: '',
  phone: '',
  email: '',
  address: ''
});

const message = ref('');
const isError = ref(false);

const fetchSuppliers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/suppliers');
    if (res.data.status) {
      suppliers.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal mengambil data supplier.', true);
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

const openAddModal = () => {
  modalTitle.value = 'Tambah Supplier';
  form.value = { id: null, name: '', phone: '', email: '', address: '' };
  showModal.value = true;
};

const openEditModal = (sup) => {
  modalTitle.value = 'Edit Supplier';
  form.value = { 
    id: sup.id, 
    name: sup.name, 
    phone: sup.phone || '', 
    email: sup.email || '', 
    address: sup.address || '' 
  };
  showModal.value = true;
};

const submitForm = async () => {
  submitting.value = true;
  try {
    let res;
    const payload = {
      name: form.value.name,
      phone: form.value.phone,
      email: form.value.email,
      address: form.value.address
    };

    if (form.value.id) {
      res = await api.put(`/suppliers/${form.value.id}`, payload);
    } else {
      res = await api.post('/suppliers', payload);
    }

    if (res.data.status) {
      showAlert(res.data.message);
      showModal.value = false;
      fetchSuppliers();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan supplier.', true);
  } finally {
    submitting.value = false;
  }
};

const deleteSupplier = async (sup) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus supplier "${sup.name}"?`)) return;
  try {
    const res = await api.delete(`/suppliers/${sup.id}`);
    if (res.data.status) {
      showAlert(res.data.message);
      fetchSuppliers();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menghapus supplier.', true);
  }
};

onMounted(() => {
  fetchSuppliers();
});
</script>

<style scoped>
/* Textarea custom padding spacing adjustment with icon positioning */
textarea.form-control {
  padding-left: 48px !important;
}
</style>
