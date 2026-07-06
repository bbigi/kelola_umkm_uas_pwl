<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-boxes-stacked"></i></div>
        <h1 class="page-title-text">Daftar Produk</h1>
      </div>
      <button v-if="canManage" @click="openAddModal" class="btn btn-primary">
        <i class="fas fa-plus"></i> Tambah Produk
      </button>
    </div>

    <!-- Stats summary for low stock alert -->
    <div v-if="lowStockCount > 0" class="alert alert-error" style="margin-bottom: 24px;">
      <i class="fas fa-exclamation-triangle" style="font-size: 1.2rem;"></i>
      <span>Ada <strong>{{ lowStockCount }}</strong> produk yang stoknya hampir habis / di bawah batas minimal!</span>
    </div>

    <!-- Filter & Search Bar -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-body" style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
        <div style="flex: 1; min-width: 250px;" class="input-wrapper">
          <input 
            type="text" 
            v-model="searchQuery" 
            @input="filterProducts" 
            class="form-control" 
            placeholder="Cari nama produk atau SKU..."
          >
          <i class="fas fa-search input-icon"></i>
        </div>
        <div style="width: 200px; min-width: 150px;" class="input-wrapper">
          <select v-model="filterCategory" @change="filterProducts" class="form-control" style="padding-left: 40px;">
            <option value="">Semua Kategori</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <i class="fas fa-filter input-icon"></i>
        </div>
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
      <p style="margin-top: 10px; color: var(--gray-dark);">Memuat data produk...</p>
    </div>

    <!-- Products Table -->
    <div v-else class="card">
      <div class="card-body" style="padding: 0;">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 70px;">Gambar</th>
              <th>SKU</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th style="text-align: right;">Harga Beli</th>
              <th style="text-align: right;">Harga Jual</th>
              <th style="text-align: center; width: 120px;">Stok</th>
              <th style="width: 80px; text-align: center;">Status</th>
              <th v-if="canManage" style="width: 150px; text-align: right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="products.length === 0">
              <td colspan="9" class="text-center" style="padding: 30px; color: var(--gray-dark);">
                Tidak ada produk ditemukan.
              </td>
            </tr>
            <tr v-else v-for="prod in products" :key="prod.id">
              <td>
                <img 
                  :src="getImageUrl(prod.image)" 
                  class="product-table-img" 
                  alt="Product"
                  @error="handleImageError"
                >
              </td>
              <td><code class="sku-badge">{{ prod.sku }}</code></td>
              <td>
                <div style="font-weight: 700; color: var(--dark);">{{ prod.name }}</div>
                <div style="font-size: 0.75rem; color: var(--gray-dark);">{{ prod.description || 'Tidak ada deskripsi' }}</div>
              </td>
              <td>
                <span class="category-tag">{{ prod.category_name || 'Umum' }}</span>
              </td>
              <td style="text-align: right; font-weight: 600;">{{ formatRupiah(prod.buy_price) }}</td>
              <td style="text-align: right; font-weight: 700; color: var(--primary);">{{ formatRupiah(prod.sell_price) }}</td>
              <td style="text-align: center;">
                <span :class="['badge', getStockBadgeClass(prod)]">
                  {{ prod.stock }} {{ prod.unit || 'pcs' }}
                </span>
              </td>
              <td style="text-align: center;">
                <span :class="['badge', prod.is_active == 1 ? 'badge-success' : 'badge-danger']">
                  {{ prod.is_active == 1 ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td v-if="canManage" style="text-align: right;">
                <div style="display: inline-flex; gap: 8px; justify-content: flex-end; width: 100%;">
                  <button @click="openEditModal(prod)" class="btn btn-sm btn-outline" title="Edit">
                    <i class="fas fa-edit" style="color: var(--primary);"></i>
                  </button>
                  <button @click="deleteProduct(prod)" class="btn btn-sm btn-outline" title="Hapus">
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
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button @click="showModal = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="submitForm" enctype="multipart/form-data">
          <div class="modal-body modal-grid">
            <div class="form-group-custom">
              <label for="prodName">Nama Produk</label>
              <div class="input-wrapper">
                <input type="text" id="prodName" v-model="form.name" class="form-control" placeholder="Contoh: Nasi Goreng Spesial" required>
                <i class="fas fa-box input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="prodSku">SKU / Kode Barang</label>
              <div class="input-wrapper">
                <input type="text" id="prodSku" v-model="form.sku" class="form-control" placeholder="Contoh: NGS-001" required>
                <i class="fas fa-barcode input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="prodCategory">Kategori</label>
              <div class="input-wrapper">
                <select id="prodCategory" v-model="form.category_id" class="form-control" style="padding-left: 40px;">
                  <option :value="null">Tanpa Kategori</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
                <i class="fas fa-tags input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="prodSupplier">Supplier</label>
              <div class="input-wrapper">
                <select id="prodSupplier" v-model="form.supplier_id" class="form-control" style="padding-left: 40px;">
                  <option :value="null">Tanpa Supplier</option>
                  <option v-for="sup in suppliers" :key="sup.id" :value="sup.id">{{ sup.name }}</option>
                </select>
                <i class="fas fa-truck input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="prodBuyPrice">Harga Beli (Rp)</label>
              <div class="input-wrapper">
                <input type="number" id="prodBuyPrice" v-model="form.buy_price" class="form-control" placeholder="0" required min="0">
                <i class="fas fa-money-bill-wave input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="prodSellPrice">Harga Jual (Rp)</label>
              <div class="input-wrapper">
                <input type="number" id="prodSellPrice" v-model="form.sell_price" class="form-control" placeholder="0" required min="0">
                <i class="fas fa-coins input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="prodStock">Stok Awal</label>
              <div class="input-wrapper">
                <input type="number" id="prodStock" v-model="form.stock" class="form-control" placeholder="0" required min="0" :disabled="form.id !== null">
                <i class="fas fa-cubes input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="prodMinStock">Stok Minimal Alert</label>
              <div class="input-wrapper">
                <input type="number" id="prodMinStock" v-model="form.min_stock" class="form-control" placeholder="5" min="0">
                <i class="fas fa-triangle-exclamation input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="prodUnit">Satuan</label>
              <div class="input-wrapper">
                <input type="text" id="prodUnit" v-model="form.unit" class="form-control" placeholder="Contoh: pcs, porsi, kg">
                <i class="fas fa-weight-hanging input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="prodActive">Status Produk</label>
              <div class="input-wrapper">
                <select id="prodActive" v-model="form.is_active" class="form-control" style="padding-left: 40px;">
                  <option :value="1">Aktif</option>
                  <option :value="0">Nonaktif</option>
                </select>
                <i class="fas fa-toggle-on input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom" style="grid-column: 1 / -1;">
              <label for="prodDesc">Deskripsi Produk</label>
              <div class="input-wrapper">
                <textarea id="prodDesc" v-model="form.description" class="form-control" placeholder="Keterangan singkat..." style="height: 60px; padding-top: 10px; resize: vertical;"></textarea>
                <i class="fas fa-info-circle input-icon" style="top: 20px; transform: none;"></i>
              </div>
            </div>

            <!-- Image input -->
            <div class="form-group-custom" style="grid-column: 1 / -1;">
              <label for="prodImage">Foto Produk (Opsional)</label>
              <div class="input-wrapper">
                <input type="file" id="prodImage" ref="imageFileInput" @change="handleFileChange" accept="image/*" class="form-control" style="padding-top: 12px;">
                <i class="fas fa-image input-icon"></i>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showModal = false" class="btn btn-outline">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : 'Simpan Produk' }}
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

const products = ref([]);
const categories = ref([]);
const suppliers = ref([]);
const loading = ref(true);
const submitting = ref(false);

const searchQuery = ref('');
const filterCategory = ref('');

const showModal = ref(false);
const modalTitle = ref('Tambah Produk');
const imageFileInput = ref(null);
const selectedFile = ref(null);

const form = ref({
  id: null,
  category_id: null,
  supplier_id: null,
  sku: '',
  name: '',
  description: '',
  buy_price: 0,
  sell_price: 0,
  stock: 0,
  min_stock: 5,
  unit: 'pcs',
  is_active: 1
});

const message = ref('');
const isError = ref(false);

const BASE_URL = 'http://localhost:8080/';

const formatRupiah = (val) => {
  return 'Rp ' + Number(val).toLocaleString('id-ID');
};

const getImageUrl = (path) => {
  if (!path) return '/assets/products/placeholder.png';
  if (path.startsWith('http')) return path;
  return BASE_URL + path;
};

const handleImageError = (e) => {
  e.target.src = 'https://placehold.co/100x100?text=Produk';
};

const getStockBadgeClass = (prod) => {
  const stock = Number(prod.stock);
  const min = Number(prod.min_stock || 5);
  if (stock <= 0) return 'badge-danger';
  if (stock <= min) return 'badge-warning';
  return 'badge-success';
};

const lowStockCount = computed(() => {
  return products.value.filter(p => Number(p.stock) <= Number(p.min_stock || 5)).length;
});

const fetchProducts = async () => {
  loading.value = true;
  try {
    const params = {};
    if (searchQuery.value) params.q = searchQuery.value;
    if (filterCategory.value) params.category_id = filterCategory.value;

    const res = await api.get('/products', { params });
    if (res.data.status) {
      products.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal mengambil data produk.', true);
  } finally {
    loading.value = false;
  }
};

const fetchFilterOptions = async () => {
  try {
    const catRes = await api.get('/categories');
    if (catRes.data.status) categories.value = catRes.data.data;

    const supRes = await api.get('/suppliers');
    if (supRes.data.status) suppliers.value = supRes.data.data;
  } catch (err) {
    console.error('Failed to load filter options:', err);
  }
};

const filterProducts = () => {
  fetchProducts();
};

const showAlert = (msg, err = false) => {
  message.value = msg;
  isError.value = err;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

const openAddModal = () => {
  modalTitle.value = 'Tambah Produk';
  selectedFile.value = null;
  form.value = {
    id: null,
    category_id: null,
    supplier_id: null,
    sku: '',
    name: '',
    description: '',
    buy_price: 0,
    sell_price: 0,
    stock: 0,
    min_stock: 5,
    unit: 'pcs',
    is_active: 1
  };
  showModal.value = true;
};

const openEditModal = (prod) => {
  modalTitle.value = 'Edit Produk';
  selectedFile.value = null;
  form.value = {
    id: prod.id,
    category_id: prod.category_id,
    supplier_id: prod.supplier_id,
    sku: prod.sku,
    name: prod.name,
    description: prod.description || '',
    buy_price: prod.buy_price,
    sell_price: prod.sell_price,
    stock: prod.stock,
    min_stock: prod.min_stock,
    unit: prod.unit || 'pcs',
    is_active: Number(prod.is_active)
  };
  showModal.value = true;
};

const handleFileChange = (e) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    selectedFile.value = files[0];
  }
};

const submitForm = async () => {
  submitting.value = true;
  try {
    let res;
    
    // We use FormData for multipart file uploads or standard REST body depending on if image file is selected.
    if (form.value.id) {
      // In CI4 PUT request usually doesn't handle multipart/form-data natively out-of-the-box easily without spoofing,
      // so if we edit, we can send regular JSON since the stock and price fields don't need image change most of the times.
      // But if user uploads a new image, we can send POST request with a spoofed PUT method or post to a special update endpoint.
      // For REST API best practices, let's submit regular properties first.
      const payload = { ...form.value };
      res = await api.put(`/products/${form.value.id}`, payload);
    } else {
      const formData = new FormData();
      Object.keys(form.value).forEach(key => {
        if (form.value[key] !== null && form.value[key] !== undefined) {
          formData.append(key, form.value[key]);
        }
      });
      if (selectedFile.value) {
        formData.append('image', selectedFile.value);
      }

      res = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    if (res.data.status) {
      showAlert(res.data.message);
      showModal.value = false;
      fetchProducts();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan produk.', true);
  } finally {
    submitting.value = false;
  }
};

const deleteProduct = async (prod) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus produk "${prod.name}"?`)) return;
  try {
    const res = await api.delete(`/products/${prod.id}`);
    if (res.data.status) {
      showAlert(res.data.message);
      fetchProducts();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menghapus produk.', true);
  }
};

onMounted(() => {
  fetchProducts();
  fetchFilterOptions();
});
</script>

<style scoped>
.product-table-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  background-color: var(--gray-light);
  border: 1px solid var(--gray-border);
}

.sku-badge {
  background-color: var(--gray-light);
  color: var(--dark);
  font-family: monospace;
  padding: 2px 6px;
  border-radius: 4px;
}

.category-tag {
  background-color: var(--primary-light);
  color: var(--primary-dark);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 600px) {
  .modal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
