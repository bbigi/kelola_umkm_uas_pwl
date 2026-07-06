<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-tags"></i></div>
        <h1 class="page-title-text">Kategori Produk</h1>
      </div>
      <button v-if="canManage" @click="openAddModal" class="btn btn-primary">
        <i class="fas fa-plus"></i> Tambah Kategori
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
      <p style="margin-top: 10px; color: var(--gray-dark);">Memuat data kategori...</p>
    </div>

    <!-- Categories List -->
    <div v-else class="card">
      <div class="card-body" style="padding: 0;">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 80px;">No</th>
              <th>Nama Kategori</th>
              <th>Slug (URL)</th>
              <th v-if="canManage" style="width: 180px; text-align: right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categories.length === 0">
              <td colspan="4" class="text-center" style="padding: 30px; color: var(--gray-dark);">
                Belum ada kategori terdaftar.
              </td>
            </tr>
            <tr v-else v-for="(cat, index) in categories" :key="cat.id">
              <td>{{ index + 1 }}</td>
              <td style="font-weight: 700;">{{ cat.name }}</td>
              <td><code class="code-badge">{{ cat.slug }}</code></td>
              <td v-if="canManage" style="text-align: right;">
                <div style="display: inline-flex; gap: 8px; justify-content: flex-end; width: 100%;">
                  <button @click="openEditModal(cat)" class="btn btn-sm btn-outline" title="Edit">
                    <i class="fas fa-edit" style="color: var(--primary);"></i>
                  </button>
                  <button @click="deleteCategory(cat)" class="btn btn-sm btn-outline" title="Hapus">
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
              <label for="catName">Nama Kategori</label>
              <div class="input-wrapper">
                <input 
                  type="text" 
                  id="catName" 
                  v-model="form.name" 
                  class="form-control" 
                  placeholder="Contoh: Makanan, Minuman, Snak" 
                  required
                >
                <i class="fas fa-tag input-icon"></i>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showModal = false" class="btn btn-outline">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : 'Simpan Kategori' }}
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

const categories = ref([]);
const loading = ref(true);
const submitting = ref(false);

const showModal = ref(false);
const modalTitle = ref('Tambah Kategori');
const form = ref({
  id: null,
  name: ''
});

const message = ref('');
const isError = ref(false);

const fetchCategories = async () => {
  loading.value = true;
  try {
    const res = await api.get('/categories');
    if (res.data.status) {
      categories.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal mengambil data kategori.', true);
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
  modalTitle.value = 'Tambah Kategori';
  form.value = { id: null, name: '' };
  showModal.value = true;
};

const openEditModal = (cat) => {
  modalTitle.value = 'Edit Kategori';
  form.value = { id: cat.id, name: cat.name };
  showModal.value = true;
};

const submitForm = async () => {
  submitting.value = true;
  try {
    let res;
    if (form.value.id) {
      res = await api.put(`/categories/${form.value.id}`, { name: form.value.name });
    } else {
      res = await api.post('/categories', { name: form.value.name });
    }

    if (res.data.status) {
      showAlert(res.data.message);
      showModal.value = false;
      fetchCategories();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan kategori.', true);
  } finally {
    submitting.value = false;
  }
};

const deleteCategory = async (cat) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`)) return;
  try {
    const res = await api.delete(`/categories/${cat.id}`);
    if (res.data.status) {
      showAlert(res.data.message);
      fetchCategories();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menghapus kategori.', true);
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.code-badge {
  background-color: var(--gray-light);
  color: var(--primary-dark);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.82rem;
}
</style>
