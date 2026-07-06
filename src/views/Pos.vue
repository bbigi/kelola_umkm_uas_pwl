<template>
  <div class="pos-wrapper-container">
    <!-- Modal Buka Shift (Harus dibuka jika belum ada shift aktif) -->
    <div v-if="!activeShift" class="modal-overlay active" style="z-index: 1000;">
      <div class="modal-card" style="max-width: 450px;">
        <div class="modal-header">
          <h3><i class="fas fa-cash-register text-primary"></i> Mulai Shift Kasir</h3>
        </div>
        <form @submit.prevent="handleOpenShift">
          <div class="modal-body">
            <p style="margin-bottom: 15px; color: var(--gray-dark);">
              Masukkan jumlah modal awal yang ada di laci kasir (uang kas awal) untuk memulai transaksi hari ini.
            </p>
            <div class="form-group-custom">
              <label for="opening_cash">Modal Awal (Cash)</label>
              <div class="input-wrapper">
                <input 
                  type="number" 
                  id="opening_cash" 
                  v-model="openingCash" 
                  class="form-control" 
                  placeholder="Contoh: 100000" 
                  min="0" 
                  required
                >
                <i class="fas fa-wallet input-icon"></i>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <router-link :to="{ name: 'Dashboard' }" class="btn btn-outline">Kembali ke Dashboard</router-link>
            <button type="submit" class="btn btn-primary" :disabled="submittingShift">
              {{ submittingShift ? 'Membuka...' : 'Buka Kasir' }} <i class="fas fa-play"></i>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Active POS Workspace -->
    <div v-else class="pos-container">
      <!-- Panel Kiri: Katalog Produk -->
      <div class="pos-products-panel">
        <div class="pos-search-bar" style="display: flex; gap: 10px; margin-bottom: 15px;">
          <div style="flex: 1;" class="input-wrapper">
            <input 
              type="text" 
              v-model="searchQuery" 
              @input="fetchProducts" 
              class="form-control" 
              placeholder="Cari nama produk atau SKU..."
            >
            <i class="fas fa-search input-icon"></i>
          </div>
        </div>
        
        <div class="pos-categories" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 15px;">
          <button 
            @click="selectCategory('')" 
            :class="['cat-btn', selectedCategory === '' ? 'active' : '']"
          >
            Semua Kategori
          </button>
          <button 
            v-for="cat in categories" 
            :key="cat.id" 
            @click="selectCategory(cat.id)" 
            :class="['cat-btn', selectedCategory === cat.id ? 'active' : '']"
          >
            {{ cat.name }}
          </button>
        </div>

        <div v-if="loadingProducts" class="text-center" style="padding: 50px;">
          <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
        </div>

        <div v-else class="pos-products-grid">
          <div 
            v-for="prod in products" 
            :key="prod.id" 
            class="pos-product-card"
            @click="addToCart(prod)"
            :class="{ 'out-of-stock': prod.stock <= 0 }"
          >
            <div class="pos-product-img-wrapper">
              <img :src="getImageUrl(prod.image)" alt="Product" @error="handleImageError">
              <span class="pos-product-stock" :class="{ 'warning': prod.stock <= prod.min_stock }">
                Stok: {{ prod.stock }}
              </span>
            </div>
            <div class="pos-product-info">
              <div class="pos-product-sku">{{ prod.sku }}</div>
              <div class="pos-product-name">{{ prod.name }}</div>
              <div class="pos-product-price">{{ formatRupiah(prod.sell_price) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Kanan: Keranjang Belanja -->
      <div class="pos-cart-panel">
        <div class="pos-cart-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="font-weight: 700; margin: 0;"><i class="fas fa-shopping-basket text-primary"></i> Keranjang</h3>
          <div style="display: inline-flex; gap: 8px;">
            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" @click="clearCart">
              <i class="fas fa-trash"></i> Reset
            </button>
            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" @click="openCloseShiftModal">
              <i class="fas fa-stop"></i> Tutup Kasir
            </button>
          </div>
        </div>

        <!-- Cart items list -->
        <div class="pos-cart-items" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
          <div v-if="cart.length === 0" class="text-muted text-center" style="margin-top: 50px;">
            <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
            <p>Keranjang kosong. Pilih produk di sebelah kiri.</p>
          </div>
          <div v-else v-for="item in cart" :key="item.id" class="pos-cart-item" style="display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid var(--gray-border);">
            <div style="flex: 1;">
              <div style="font-weight: 700; font-size: 0.9rem;">{{ item.name }}</div>
              <div style="font-size: 0.78rem; color: var(--gray-dark);">{{ formatRupiah(item.sell_price) }}</div>
            </div>
            
            <!-- Quantity controls -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <button @click="updateQty(item, -1)" class="btn btn-sm btn-outline" style="padding: 2px 6px;">-</button>
              <span style="font-weight: 700; min-width: 20px; text-align: center;">{{ item.qty }}</span>
              <button @click="updateQty(item, 1)" class="btn btn-sm btn-outline" style="padding: 2px 6px;">+</button>
            </div>
            
            <div style="font-weight: 700; width: 90px; text-align: right;">
              {{ formatRupiah(item.sell_price * item.qty) }}
            </div>
          </div>
        </div>

        <!-- Cart total summaries -->
        <div class="pos-cart-summary" style="border-top: 1.5px solid var(--gray-border); padding-top: 15px;">
          <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal</span>
            <span>{{ formatRupiah(subtotal) }}</span>
          </div>
          <div class="summary-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              Diskon (Rp) 
              <input type="number" v-model.number="discount" class="form-control" style="width: 80px; padding: 4px; font-size: 0.8rem; height: 30px;" min="0">
            </span>
            <span>-{{ formatRupiah(discount) }}</span>
          </div>
          <div class="summary-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              Pajak (%) 
              <input type="number" v-model.number="tax" class="form-control" style="width: 60px; padding: 4px; font-size: 0.8rem; height: 30px;" min="0">
            </span>
            <span>{{ formatRupiah(taxAmount) }}</span>
          </div>
          <div class="summary-row total" style="display: flex; justify-content: space-between; margin-top: 12px; margin-bottom: 15px; font-size: 1.25rem; font-weight: 800; border-top: 1px dashed var(--gray-border); padding-top: 10px;">
            <span>Total Belanja</span>
            <span style="color: var(--primary);">{{ formatRupiah(total) }}</span>
          </div>
          
          <button 
            class="btn btn-success" 
            style="width: 100%; padding: 14px; font-size: 1.1rem; border-radius: var(--radius); font-weight: 700;" 
            @click="openCheckoutModal"
            :disabled="cart.length === 0"
          >
            Bayar & Checkout <i class="fas fa-cash-register"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Checkout / Pembayaran -->
    <div v-if="showCheckoutModal" class="modal-overlay active" style="z-index: 1001;">
      <div class="modal-card" style="max-width: 450px;">
        <div class="modal-header">
          <h3>Pembayaran & Checkout</h3>
          <button @click="showCheckoutModal = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="handleCheckout">
          <div class="modal-body">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 0.9rem; color: var(--gray-dark); display: block;">Total yang harus dibayar:</span>
              <strong style="font-size: 1.8rem; color: var(--primary); font-weight: 800;">{{ formatRupiah(total) }}</strong>
            </div>

            <div class="form-group-custom">
              <label for="payment_method">Metode Pembayaran</label>
              <div class="input-wrapper">
                <select id="payment_method" v-model="paymentMethod" class="form-control" style="padding-left: 40px;">
                  <option value="cash">Tunai (Cash)</option>
                  <option value="transfer">Transfer Bank</option>
                  <option value="qris">QRIS / E-Wallet</option>
                </select>
                <i class="fas fa-wallet input-icon"></i>
              </div>
            </div>

            <div class="form-group-custom">
              <label for="paid_cash">Uang Diterima (Rp)</label>
              <div class="input-wrapper">
                <input 
                  type="number" 
                  id="paid_cash" 
                  v-model.number="paidAmount" 
                  class="form-control" 
                  required 
                  min="0"
                >
                <i class="fas fa-money-bill-wave input-icon"></i>
              </div>
            </div>

            <!-- Fast cash buttons -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px;">
              <button 
                type="button" 
                v-for="cash in fastCashValues" 
                :key="cash" 
                @click="paidAmount = cash"
                class="btn btn-sm btn-outline"
                style="flex: 1; min-width: 70px; text-align: center;"
              >
                {{ formatRupiah(cash) }}
              </button>
            </div>

            <div style="border-top: 1px solid var(--gray-border); padding-top: 12px; margin-top: 15px; display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800;">
              <span>Uang Kembali:</span>
              <span :style="{ color: changeAmount >= 0 ? 'var(--primary)' : 'var(--danger)' }">
                {{ formatRupiah(changeAmount) }}
              </span>
            </div>
            
            <div class="form-group-custom" style="margin-top: 15px;">
              <label for="checkoutNote">Catatan Belanja</label>
              <div class="input-wrapper">
                <input type="text" id="checkoutNote" v-model="checkoutNote" class="form-control" placeholder="Opsional...">
                <i class="fas fa-file-invoice input-icon"></i>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" @click="showCheckoutModal = false" class="btn btn-outline">Batal</button>
            <button type="submit" class="btn btn-success" :disabled="submittingCheckout || changeAmount < 0">
              {{ submittingCheckout ? 'Memproses...' : 'Selesaikan Transaksi' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Tutup Shift Kasir -->
    <div v-if="showCloseShiftModal" class="modal-overlay active" style="z-index: 1002;">
      <div class="modal-card" style="max-width: 450px;">
        <div class="modal-header">
          <h3>Tutup Shift Kasir</h3>
          <button @click="showCloseShiftModal = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="handleCloseShift">
          <div class="modal-body">
            <p style="margin-bottom: 15px; color: var(--gray-dark);">
              Masukkan total uang fisik (tunai) yang ada di laci kasir saat ini untuk rekonsiliasi akhir.
            </p>
            <div class="form-group-custom">
              <label for="actual_cash">Uang Fisik Kasir (Cash)</label>
              <div class="input-wrapper">
                <input 
                  type="number" 
                  id="actual_cash" 
                  v-model="actualCash" 
                  class="form-control" 
                  placeholder="0" 
                  min="0" 
                  required
                >
                <i class="fas fa-wallet input-icon"></i>
              </div>
            </div>
            <div class="form-group-custom">
              <label for="closeNote">Catatan Penutupan</label>
              <div class="input-wrapper">
                <input type="text" id="closeNote" v-model="closeNote" class="form-control" placeholder="Catatan shift (opsional)...">
                <i class="fas fa-sticky-note input-icon"></i>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showCloseShiftModal = false" class="btn btn-outline">Batal</button>
            <button type="submit" class="btn btn-danger" :disabled="submittingShift">
              {{ submittingShift ? 'Menutup...' : 'Tutup Shift' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Struk / Receipt -->
    <div v-if="showReceiptModal" class="modal-overlay active" style="z-index: 1010;">
      <div class="modal-card" style="max-width: 400px; background: transparent; box-shadow: none;">
        <div class="modal-header" style="background: white; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg);">
          <h3><i class="fas fa-receipt text-primary"></i> Struk Pembelian</h3>
          <button @click="showReceiptModal = false" class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body" style="background: white; padding: 20px; overflow-y: auto; max-height: 70vh;">
          <div id="print-receipt-area" class="receipt-paper">
            <div class="receipt-header">
              <h2 class="receipt-title">KELOLA UMKM</h2>
              <p class="receipt-subtitle">Point of Sale System</p>
              <p class="receipt-info">Kelola Bisnis UMKM Anda Mudah</p>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-meta">
              <div><strong>Invoice:</strong> {{ receiptData.invoice_no }}</div>
              <div><strong>Tanggal:</strong> {{ formatReceiptDate(receiptData.date) }}</div>
              <div><strong>Kasir:</strong> {{ receiptData.cashier_name }}</div>
              <div><strong>Metode:</strong> {{ receiptData.payment_method.toUpperCase() }}</div>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-items">
              <div v-for="item in receiptData.items" :key="item.product_name" class="receipt-item">
                <div class="item-name">{{ item.product_name }}</div>
                <div class="item-details">
                  <span>{{ item.qty }} x {{ formatRupiah(item.sell_price) }}</span>
                  <span>{{ formatRupiah(item.subtotal) }}</span>
                </div>
              </div>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-summary">
              <div class="summary-line">
                <span>Subtotal</span>
                <span>{{ formatRupiah(receiptData.subtotal) }}</span>
              </div>
              <div class="summary-line" v-if="receiptData.discount > 0">
                <span>Diskon</span>
                <span>-{{ formatRupiah(receiptData.discount) }}</span>
              </div>
              <div class="summary-line" v-if="receiptData.taxAmount > 0">
                <span>Pajak ({{ receiptData.tax }}%)</span>
                <span>{{ formatRupiah(receiptData.taxAmount) }}</span>
              </div>
              <div class="receipt-divider" style="border-style: dotted;"></div>
              <div class="summary-line total-line">
                <span>TOTAL</span>
                <span>{{ formatRupiah(receiptData.total) }}</span>
              </div>
              <div class="summary-line">
                <span>Bayar</span>
                <span>{{ formatRupiah(receiptData.paid) }}</span>
              </div>
              <div class="summary-line">
                <span>Kembalian</span>
                <span>{{ formatRupiah(receiptData.change_amount) }}</span>
              </div>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div v-if="receiptData.note" style="margin-bottom: 10px; font-size: 11px;">
              <strong>Catatan:</strong> {{ receiptData.note }}
            </div>
            
            <div class="receipt-footer">
              <p>Terima Kasih Atas Kunjungan Anda</p>
              <p>Powered by Kelola UMKM</p>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="background: white; border-bottom-left-radius: var(--radius-lg); border-bottom-right-radius: var(--radius-lg);">
          <button @click="printReceipt" class="btn btn-primary" style="flex: 1;">
            <i class="fas fa-print"></i> Cetak Struk
          </button>
          <button @click="showReceiptModal = false" class="btn btn-outline" style="flex: 1;">
            Tutup
          </button>
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

const activeShift = ref(null);
const openingCash = ref(0);
const submittingShift = ref(false);

const products = ref([]);
const categories = ref([]);
const loadingProducts = ref(true);

const searchQuery = ref('');
const selectedCategory = ref('');

// Cart management
const cart = ref([]);
const discount = ref(0);
const tax = ref(0);

// Checkout
const showCheckoutModal = ref(false);
const paymentMethod = ref('cash');
const paidAmount = ref(0);
const checkoutNote = ref('');
const submittingCheckout = ref(false);

// Receipt Modal
const showReceiptModal = ref(false);
const receiptData = ref(null);

const formatReceiptDate = (val) => {
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

const printReceipt = () => {
  window.print();
};

// Close shift
const showCloseShiftModal = ref(false);
const actualCash = ref(0);
const closeNote = ref('');

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

const selectCategory = (id) => {
  selectedCategory.value = id;
  fetchProducts();
};

const checkShiftStatus = async () => {
  try {
    const res = await api.get('/pos/status');
    if (res.data.status && res.data.has_active_shift) {
      activeShift.value = res.data.active_shift;
    } else {
      activeShift.value = null;
    }
  } catch (err) {
    console.error('Failed to load shift status:', err);
  }
};

const handleOpenShift = async () => {
  submittingShift.value = true;
  try {
    const res = await api.post('/pos/shift/open', { opening_cash: openingCash.value });
    if (res.data.status) {
      activeShift.value = { id: res.data.shift_id, opening_cash: openingCash.value };
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal membuka shift kasir.');
  } finally {
    submittingShift.value = false;
  }
};

const fetchProducts = async () => {
  loadingProducts.value = true;
  try {
    const params = { is_active: 1 };
    if (searchQuery.value) params.q = searchQuery.value;
    if (selectedCategory.value) params.category_id = selectedCategory.value;

    const res = await api.get('/products', { params });
    if (res.data.status) {
      products.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch POS products:', err);
  } finally {
    loadingProducts.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await api.get('/categories');
    if (res.data.status) {
      categories.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
};

// Cart Actions
const addToCart = (product) => {
  if (Number(product.stock) <= 0) {
    alert('Stok produk habis!');
    return;
  }

  const existing = cart.value.find(item => item.id === product.id);
  if (existing) {
    if (existing.qty >= Number(product.stock)) {
      alert(`Stok maksimal dicapai (${product.stock} ${product.unit || 'pcs'})`);
      return;
    }
    existing.qty++;
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      sell_price: Number(product.sell_price),
      stock: Number(product.stock),
      qty: 1
    });
  }
};

const updateQty = (item, change) => {
  const newQty = item.qty + change;
  if (newQty <= 0) {
    cart.value = cart.value.filter(i => i.id !== item.id);
  } else if (newQty > item.stock) {
    alert(`Stok maksimal dicapai (${item.stock} pcs)`);
  } else {
    item.qty = newQty;
  }
};

const clearCart = () => {
  cart.value = [];
  discount.value = 0;
  tax.value = 0;
};

// Calculations
const subtotal = computed(() => {
  return cart.value.reduce((acc, item) => acc + (item.sell_price * item.qty), 0);
});

const taxAmount = computed(() => {
  return (subtotal.value * (tax.value || 0)) / 100;
});

const total = computed(() => {
  const res = subtotal.value - (discount.value || 0) + taxAmount.value;
  return res < 0 ? 0 : res;
});

const changeAmount = computed(() => {
  return paidAmount.value - total.value;
});

const fastCashValues = computed(() => {
  const tot = total.value;
  if (tot <= 0) return [];
  
  const values = [];
  const roundedUp = Math.ceil(tot / 1000) * 1000;
  values.push(roundedUp);

  const keyCash = [10000, 20000, 50000, 100000];
  keyCash.forEach(c => {
    if (c > tot && !values.includes(c)) {
      values.push(c);
    }
  });

  return values.sort((a, b) => a - b).slice(0, 4);
});

// Checkout Actions
const openCheckoutModal = () => {
  paidAmount.value = total.value;
  showCheckoutModal.value = true;
};

const handleCheckout = async () => {
  submittingCheckout.value = true;
  try {
    const payload = {
      items: cart.value.map(item => ({
        product_id: item.id,
        qty: item.qty,
        discount: 0
      })),
      discount: discount.value,
      tax: tax.value,
      paid: paidAmount.value,
      payment_method: paymentMethod.value,
      note: checkoutNote.value
    };

    const res = await api.post('/pos/checkout', payload);
    if (res.data.status) {
      // Store checkout receipt data before clearing
      receiptData.value = {
        invoice_no: res.data.data.invoice_no,
        date: new Date(),
        cashier_name: authStore.userName || 'Kasir',
        payment_method: paymentMethod.value,
        items: cart.value.map(item => ({
          product_name: item.name,
          sell_price: item.sell_price,
          qty: item.qty,
          subtotal: item.sell_price * item.qty
        })),
        subtotal: subtotal.value,
        discount: discount.value,
        tax: tax.value,
        taxAmount: taxAmount.value,
        total: total.value,
        paid: paidAmount.value,
        change_amount: res.data.data.change,
        note: checkoutNote.value
      };

      showCheckoutModal.value = false;
      showReceiptModal.value = true;
      clearCart();
      fetchProducts();
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memproses transaksi.');
  } finally {
    submittingCheckout.value = false;
  }
};

// Close Shift Actions
const openCloseShiftModal = () => {
  actualCash.value = 0;
  closeNote.value = '';
  showCloseShiftModal.value = true;
};

const handleCloseShift = async () => {
  submittingShift.value = true;
  try {
    const res = await api.post('/pos/shift/close', {
      actual_cash: actualCash.value,
      note: closeNote.value
    });

    if (res.data.status) {
      alert(`Shift kasir ditutup!\nSelisih Laci: ${formatRupiah(res.data.difference)}`);
      showCloseShiftModal.value = false;
      activeShift.value = null;
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menutup shift kasir.');
  } finally {
    submittingShift.value = false;
  }
};

onMounted(() => {
  checkShiftStatus();
  fetchProducts();
  fetchCategories();
});
</script>

<style scoped>
/* POS Custom styles matching Lessa theme */
.pos-wrapper-container {
  height: calc(100vh - var(--topbar-height) - 40px);
  width: 100%;
}

.pos-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  height: 100%;
}

.pos-products-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.pos-cart-panel {
  background: #ffffff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-border);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.pos-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  overflow-y: auto;
  flex: 1;
  padding-bottom: 20px;
}

.pos-product-card {
  background: #ffffff;
  border-radius: var(--radius);
  border: 1px solid var(--gray-border);
  cursor: pointer;
  overflow: hidden;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}

.pos-product-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
}

.pos-product-card.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
}

.pos-product-img-wrapper {
  position: relative;
  height: 120px;
  width: 100%;
  background-color: var(--gray-light);
}

.pos-product-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pos-product-stock {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: var(--primary);
  color: var(--white);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
}

.pos-product-stock.warning {
  background-color: var(--warning);
}

.pos-product-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.pos-product-sku {
  font-size: 0.72rem;
  font-family: monospace;
  color: var(--gray-dark);
  margin-bottom: 2px;
}

.pos-product-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--dark);
  margin-bottom: 8px;
  line-height: 1.3;
  flex: 1;
}

.pos-product-price {
  font-weight: 800;
  color: var(--primary);
  font-size: 0.95rem;
}

.cat-btn {
  background-color: var(--gray-light);
  color: var(--dark);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 600;
  font-size: 0.82rem;
  transition: var(--transition);
}

.cat-btn.active, .cat-btn:hover {
  background-color: var(--primary);
  color: var(--white);
}

@media (max-width: 1024px) {
  .pos-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 350px;
    height: auto;
  }
  .pos-cart-panel {
    height: 350px;
  }
}
</style>
