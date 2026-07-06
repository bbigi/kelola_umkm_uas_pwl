<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-users"></i></div>
        <h1 class="page-title-text">Manajemen Karyawan</h1>
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
              <label for="empName">Nama Lengkap *</label>
              <div class="input-wrapper">
                <input 
                  type="text" 
                  id="empName" 
                  v-model="form.name" 
                  class="form-control" 
                  required 
                  placeholder="Nama lengkap karyawan"
                >
                <i class="fas fa-user input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="empEmail">Email Login *</label>
              <div class="input-wrapper">
                <input 
                  type="email" 
                  id="empEmail" 
                  v-model="form.email" 
                  class="form-control" 
                  required 
                  placeholder="email@perusahaan.com"
                >
                <i class="fas fa-envelope input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="empPassword">Password Login *</label>
              <div class="input-wrapper">
                <input 
                  type="password" 
                  id="empPassword" 
                  v-model="form.password" 
                  class="form-control" 
                  :required="!form.id" 
                  placeholder="Kata sandi baru"
                >
                <i class="fas fa-key input-icon"></i>
              </div>
              <small class="text-muted" style="display: block; margin-top: 4px; font-size: 0.75rem;">
                {{ form.id ? 'Kosongkan jika tidak ingin mengubah password saat edit.' : 'Wajib untuk karyawan baru.' }}
              </small>
            </div>

            <div class="form-group-custom">
              <label for="empRole">Hak Akses / Role *</label>
              <div class="input-wrapper">
                <select id="empRole" v-model="form.role" class="form-control" required style="padding-left: 40px;">
                  <option value="kasir">Kasir (Akses POS Kasir & Riwayat)</option>
                  <option value="admin_gudang">Admin Gudang (Akses Inventaris & Supplier)</option>
                  <option value="owner">Owner (Akses Semua Modul Laporan & Analitik)</option>
                </select>
                <i class="fas fa-user-tag input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label>Status Akun</label>
              <div style="margin-top: 8px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input type="checkbox" v-model="form.is_active" :true-value="1" :false-value="0">
                  <span>Aktif / Boleh Login</span>
                </label>
              </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 24px;">
              <button type="button" class="btn btn-outline" style="flex: 1;" @click="resetForm">Reset</button>
              <button type="submit" class="btn btn-primary" style="flex: 2;" :disabled="submitting">
                {{ submitting ? 'Menyimpan...' : 'Simpan Karyawan' }} <i class="fas fa-save" style="margin-left: 4px;"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Table Card -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Daftar Karyawan & Hak Akses</h2>
        </div>
        <div class="card-body" style="padding: 0;">
          <div v-if="loading" class="text-center" style="padding: 60px;">
            <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
            <p style="margin-top: 10px; color: var(--gray-dark);">Memuat data karyawan...</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style="width: 160px; text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="employees.length === 0">
                  <td colspan="5" class="text-center" style="padding: 30px; color: var(--gray-dark);">
                    Belum ada karyawan terdaftar.
                  </td>
                </tr>
                <tr v-else v-for="emp in employees" :key="emp.id">
                  <td><strong>{{ emp.name }}</strong></td>
                  <td>{{ emp.email }}</td>
                  <td>
                    <span v-if="emp.role === 'owner'" class="badge badge-success">Owner (Pemilik)</span>
                    <span v-else-if="emp.role === 'admin_gudang'" class="badge badge-info">Admin Gudang</span>
                    <span v-else class="badge badge-warning">Kasir</span>
                  </td>
                  <td>
                    <button 
                      @click="toggleActive(emp)" 
                      :class="['btn', emp.is_active ? 'btn-success' : 'btn-danger']"
                      style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-sm); border: none;"
                    >
                      {{ emp.is_active ? 'Aktif' : 'Nonaktif' }}
                    </button>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 8px; justify-content: flex-end; width: 100%;">
                      <button @click="editEmployee(emp)" class="btn btn-sm btn-outline" title="Edit">
                        <i class="fas fa-edit" style="color: var(--primary);"></i>
                      </button>
                      <button 
                        v-if="emp.role !== 'owner'" 
                        @click="deleteEmployee(emp)" 
                        class="btn btn-sm btn-outline" 
                        title="Hapus"
                      >
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
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const employees = ref([]);
const loading = ref(true);
const submitting = ref(false);

const message = ref('');
const isError = ref(false);

const form = ref({
  id: null,
  name: '',
  email: '',
  password: '',
  role: 'kasir',
  is_active: 1
});

const formTitle = computed(() => form.value.id ? 'Edit Karyawan' : 'Tambah Karyawan / Akses');

const fetchEmployees = async () => {
  loading.value = true;
  try {
    const res = await api.get('/employees');
    if (res.data.status) {
      employees.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal mengambil data karyawan.', true);
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

const editEmployee = (emp) => {
  form.value = {
    id: emp.id,
    name: emp.name,
    email: emp.email,
    password: '',
    role: emp.role,
    is_active: Number(emp.is_active)
  };
};

const resetForm = () => {
  form.value = {
    id: null,
    name: '',
    email: '',
    password: '',
    role: 'kasir',
    is_active: 1
  };
};

const submitForm = async () => {
  submitting.value = true;
  try {
    const payload = {
      id: form.value.id,
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      is_active: form.value.is_active
    };
    if (form.value.password) {
      payload.password = form.value.password;
    }

    const res = await api.post('/employees', payload);
    if (res.data.status) {
      showAlert(res.data.message);
      resetForm();
      fetchEmployees();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan data karyawan.', true);
  } finally {
    submitting.value = false;
  }
};

const toggleActive = async (emp) => {
  try {
    const res = await api.post(`/employees/toggle/${emp.id}`);
    if (res.data.status) {
      showAlert('Status karyawan berhasil diubah.');
      fetchEmployees();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal mengubah status aktif.', true);
  }
};

const deleteEmployee = async (emp) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus akun karyawan "${emp.name}"?`)) return;
  try {
    const res = await api.delete(`/employees/${emp.id}`);
    if (res.data.status) {
      showAlert(res.data.message);
      fetchEmployees();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menghapus karyawan.', true);
  }
};

onMounted(() => {
  fetchEmployees();
});
</script>

<style scoped>
.form-group-custom select.form-control {
  background-position: calc(100% - 12px) 50%;
}
</style>
