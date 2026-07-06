<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-clock-rotate-left"></i></div>
        <h1 class="page-title-text">Riwayat Transaksi POS</h1>
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
      <p style="margin-top: 10px; color: var(--gray-dark);">Memuat riwayat transaksi...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="card">
      <div class="card-header" style="justify-content: space-between; align-items: center; display: flex;">
        <h2 class="card-title">Daftar Transaksi Kasir</h2>
        <div class="search-wrapper" style="width: 250px; margin-bottom: 0;">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Cari nomor invoice..." 
            class="form-control" 
            style="padding-left: 36px; height: 38px;"
          >
          <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--gray-dark); font-size: 0.85rem;"></i>
        </div>
      </div>
      <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Tanggal</th>
                <th>Kasir</th>
                <th>Metode Bayar</th>
                <th>Total</th>
                <th>Status</th>
                <th style="width: 180px; text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredTransactions.length === 0">
                <td colspan="7" class="text-center" style="padding: 30px; color: var(--gray-dark);">
                  Tidak ada riwayat transaksi yang cocok.
                </td>
              </tr>
              <tr v-else v-for="t in filteredTransactions" :key="t.id">
                <td><strong>{{ t.invoice_no }}</strong></td>
                <td>{{ formatDateTime(t.created_at) }}</td>
                <td>{{ t.cashier_name || 'Kasir' }}</td>
                <td>
                  <span class="badge badge-info" style="text-transform: uppercase;">{{ t.payment_method }}</span>
                </td>
                <td style="font-weight: 700;">{{ formatRupiah(t.total) }}</td>
                <td>
                  <span :class="['badge', t.status === 'completed' ? 'badge-success' : 'badge-danger']">
                    {{ t.status === 'completed' ? 'Selesai' : 'Dibatalkan' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 8px; justify-content: flex-end; width: 100%;">
                    <button @click="viewDetail(t.id)" class="btn btn-sm btn-outline">
                      <i class="fas fa-eye" style="margin-right: 4px;"></i> Detail
                    </button>
                    <button @click="viewReceipt(t.id)" class="btn btn-sm btn-outline" style="border-color: var(--secondary); color: var(--secondary);" title="Struk Pembelian">
                      <i class="fas fa-receipt" style="margin-right: 4px;"></i> Struk
                    </button>
                    <button 
                      v-if="t.status === 'completed' && (authStore.isOwner || authStore.isKasir)" 
                      @click="cancelTransaction(t)" 
                      class="btn btn-sm btn-outline" 
                      style="border-color: var(--danger); color: var(--danger);"
                      title="Batalkan Transaksi"
                    >
                      <i class="fas fa-times"></i> Batal
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Detail Transaction Modal -->
    <div v-if="showDetailModal" class="modal-overlay">
      <div class="modal-card" style="max-width: 650px;">
        <div class="modal-header">
          <h3>Detail Transaksi: {{ detailData.transaction?.invoice_no }}</h3>
          <button @click="showDetailModal = false" class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body" v-if="detailData.transaction">
          <!-- Info Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 0.9rem;">
            <div>
              <p style="color: var(--gray-dark); margin-bottom: 4px;">Tanggal Transaksi</p>
              <p style="font-weight: 700;">{{ formatDateTime(detailData.transaction.created_at) }}</p>
            </div>
            <div>
              <p style="color: var(--gray-dark); margin-bottom: 4px;">Petugas Kasir</p>
              <p style="font-weight: 700;">{{ detailData.transaction.cashier_name || 'Kasir' }}</p>
            </div>
            <div>
              <p style="color: var(--gray-dark); margin-bottom: 4px;">Metode Pembayaran</p>
              <p><span class="badge badge-info" style="text-transform: uppercase;">{{ detailData.transaction.payment_method }}</span></p>
            </div>
            <div>
              <p style="color: var(--gray-dark); margin-bottom: 4px;">Status Transaksi</p>
              <p>
                <span :class="['badge', detailData.transaction.status === 'completed' ? 'badge-success' : 'badge-danger']">
                  {{ detailData.transaction.status === 'completed' ? 'Selesai' : 'Dibatalkan' }}
                </span>
              </p>
            </div>
            <div v-if="detailData.transaction.note" style="grid-column: span 2;">
              <p style="color: var(--gray-dark); margin-bottom: 4px;">Catatan</p>
              <p style="font-style: italic; background: var(--gray-light); padding: 8px 12px; border-radius: var(--radius-sm);">
                "{{ detailData.transaction.note }}"
              </p>
            </div>
          </div>

          <!-- Items Table -->
          <h4 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; font-weight: 700;">Daftar Item Belanja</h4>
          <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
            <table class="table" style="font-size: 0.85rem;">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th style="text-align: right;">Harga</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in detailData.items" :key="item.id">
                  <td>
                    <strong>{{ item.product_name }}</strong><br>
                    <span style="font-size: 0.75rem; color: var(--gray-dark);">SKU: {{ item.product_sku }}</span>
                  </td>
                  <td style="text-align: right;">{{ formatRupiah(item.sell_price) }}</td>
                  <td style="text-align: center;">{{ item.qty }}</td>
                  <td style="text-align: right; font-weight: 700;">{{ formatRupiah(item.subtotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Financial Breakdown -->
          <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 8px; font-size: 0.95rem; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <div style="display: flex; justify-content: space-between; width: 250px;">
              <span style="color: var(--gray-dark);">Subtotal:</span>
              <strong style="text-align: right;">{{ formatRupiah(detailData.transaction.subtotal) }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; width: 250px;" v-if="detailData.transaction.discount > 0">
              <span style="color: var(--gray-dark);">Diskon:</span>
              <strong style="text-align: right; color: var(--danger);">-{{ formatRupiah(detailData.transaction.discount) }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; width: 250px;" v-if="detailData.transaction.tax > 0">
              <span style="color: var(--gray-dark);">Pajak:</span>
              <strong style="text-align: right;">{{ formatRupiah(detailData.transaction.tax) }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; width: 250px; font-size: 1.1rem; border-top: 2px dashed #e2e8f0; padding-top: 8px; margin-top: 4px;">
              <span>Total Akhir:</span>
              <strong style="text-align: right; color: var(--primary);">{{ formatRupiah(detailData.transaction.total) }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; width: 250px; font-size: 0.85rem; color: var(--gray-dark);">
              <span>Jumlah Bayar:</span>
              <span style="text-align: right;">{{ formatRupiah(detailData.transaction.paid) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; width: 250px; font-size: 0.85rem; color: var(--gray-dark);">
              <span>Kembalian:</span>
              <span style="text-align: right;">{{ formatRupiah(detailData.transaction.change_amount) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="viewReceipt(detailData.transaction.id)" class="btn btn-secondary">
            <i class="fas fa-receipt"></i> Lihat Struk
          </button>
          <button @click="showDetailModal = false" class="btn btn-primary">Tutup</button>
        </div>
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
                <span>Pajak</span>
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
const transactions = ref([]);
const loading = ref(true);
const searchQuery = ref('');

const message = ref('');
const isError = ref(false);

const showDetailModal = ref(false);
const detailData = ref({ transaction: null, items: [] });

// Receipt Modal
const showReceiptModal = ref(false);
const receiptData = ref(null);

const viewReceipt = async (id) => {
  try {
    const res = await api.get(`/pos/transactions/${id}`);
    if (res.data.status) {
      const trans = res.data.data.transaction;
      const items = res.data.data.items;
      
      const matchingTrans = transactions.value.find(t => t.id === id);
      const cashierName = matchingTrans ? matchingTrans.cashier_name : 'Kasir';
      
      receiptData.value = {
        invoice_no: trans.invoice_no,
        date: new Date(trans.created_at),
        cashier_name: cashierName,
        payment_method: trans.payment_method,
        items: items.map(item => ({
          product_name: item.product_name,
          sell_price: Number(item.sell_price),
          qty: item.qty,
          subtotal: Number(item.subtotal)
        })),
        subtotal: Number(trans.subtotal),
        discount: Number(trans.discount),
        tax: Number(trans.tax),
        taxAmount: Number(trans.tax),
        total: Number(trans.total),
        paid: Number(trans.paid),
        change_amount: Number(trans.change_amount),
        note: trans.note
      };
      
      showDetailModal.value = false;
      showReceiptModal.value = true;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal memuat struk transaksi.', true);
  }
};

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

const fetchTransactions = async () => {
  loading.value = true;
  try {
    const res = await api.get('/pos/transactions');
    if (res.data.status) {
      transactions.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal memuat riwayat transaksi.', true);
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

const filteredTransactions = computed(() => {
  if (!searchQuery.value) return transactions.value;
  return transactions.value.filter(t => 
    t.invoice_no.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const viewDetail = async (id) => {
  try {
    const res = await api.get(`/pos/transactions/${id}`);
    if (res.data.status) {
      detailData.value = {
        transaction: {
          ...res.data.data.transaction,
          // Extract cashier name if join logic was included or default
          cashier_name: transactions.value.find(t => t.id === id)?.cashier_name || 'Kasir'
        },
        items: res.data.data.items
      };
      showDetailModal.value = true;
    }
  } catch (err) {
    console.error(err);
    showAlert('Gagal memuat detail transaksi.', true);
  }
};

const cancelTransaction = async (t) => {
  if (!confirm(`Apakah Anda yakin ingin membatalkan/refund transaksi ${t.invoice_no}?\nTindakan ini akan mengembalikan stok produk.`)) return;
  try {
    const res = await api.post(`/pos/transactions/cancel/${t.id}`);
    if (res.data.status) {
      showAlert(res.data.message);
      fetchTransactions();
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal membatalkan transaksi.', true);
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
  fetchTransactions();
});
</script>

<style scoped>
.search-wrapper {
  position: relative;
}
</style>
