<template>
  <div class="app-layout-wrapper" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'active': isMobileSidebarActive }">
      <div class="sidebar-brand">
        <div class="brand-logo-wrapper">
          <div class="brand-logo-box">K</div>
          <div class="brand-text">
            <span class="brand-name">Kelola<span class="brand-sub">UMKM</span></span>
          </div>
        </div>
        <button 
          type="button" 
          @click="toggleSidebarCollapse" 
          class="collapse-toggle-btn" 
          :title="isSidebarCollapsed ? 'Lebarkan Menu' : 'Kecilkan Menu'"
        >
          <i :class="['fas', isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left']"></i>
        </button>
      </div>

      <div class="sidebar-menu-label">Menu Utama</div>
      <nav class="sidebar-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.name" 
          :to="{ name: item.name }" 
          class="nav-item"
          active-class="active"
        >
          <div class="nav-item-content">
            <i :class="['fas', item.icon, 'nav-icon']"></i>
            <span>{{ item.label }}</span>
          </div>
          <i class="fas fa-chevron-right arrow-icon" style="font-size: 0.7rem; opacity: 0.5;"></i>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-details">
            <span class="user-name">{{ authStore.userName }}</span>
            <span class="user-role">{{ roleLabel }}</span>
          </div>
        </div>
        <a @click.prevent="handleLogout" href="#" class="logout-btn" title="Keluar">
          <i class="fas fa-right-from-bracket"></i>
        </a>
      </div>
    </aside>
    <div class="sidebar-overlay" :class="{ 'active': isMobileSidebarActive }" @click="isMobileSidebarActive = false"></div>

    <!-- Main Wrapper -->
    <div class="main-wrapper">
      <!-- Topbar -->
      <header class="topbar">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button class="hamburger" @click="isMobileSidebarActive = !isMobileSidebarActive">
            <i class="fas fa-bars"></i>
          </button>
          <div class="topbar-left">
            <h2 class="topbar-greeting">{{ greeting }}, {{ firstName }} 👋</h2>
            <p class="topbar-sub">Kelola dan pantau kinerja UMKM Anda hari ini.</p>
          </div>
        </div>
        
        <div class="topbar-right">
          <div class="topbar-balance-box">
            <span style="font-size: 0.72rem; display: block; font-weight: 500; color: var(--gray-dark); margin-bottom: 2px;">Role Anda</span>
            <span style="text-transform: uppercase; font-size: 0.82rem; font-weight: 800;">{{ authStore.role }}</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isSidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true');
const isMobileSidebarActive = ref(false);

const toggleSidebarCollapse = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  localStorage.setItem('sidebar-collapsed', isSidebarCollapsed.value);
};

const userInitial = computed(() => {
  const name = authStore.userName || 'U';
  return name.charAt(0).toUpperCase();
});

const firstName = computed(() => {
  const name = authStore.userName || 'User';
  return name.split(' ')[0];
});

const roleLabel = computed(() => {
  const labels = {
    owner: 'Owner',
    admin_gudang: 'Admin Gudang',
    kasir: 'Kasir'
  };
  return labels[authStore.role] || authStore.role;
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 19) return 'Selamat Sore';
  return 'Selamat Malam';
});

// Define menu items based on roles
const navItems = computed(() => {
  const role = authStore.role;
  const menu = {
    owner: [
      { name: 'Dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
      { name: 'Pos', label: 'Kasir (POS)', icon: 'fa-cash-register' },
      { name: 'PosHistory', label: 'Riwayat Transaksi', icon: 'fa-history' },
      { name: 'Products', label: 'Produk', icon: 'fa-boxes-stacked' },
      { name: 'Categories', label: 'Kategori', icon: 'fa-tags' },
      { name: 'Suppliers', label: 'Supplier', icon: 'fa-truck' },
      { name: 'PurchaseOrders', label: 'Purchase Order (PO)', icon: 'fa-file-invoice' },
      { name: 'StockOpname', label: 'Stock Opname', icon: 'fa-clipboard-check' },
      { name: 'Expenses', label: 'Pemasukan & Pengeluaran', icon: 'fa-wallet' },
      { name: 'ProfitLoss', label: 'Laba / Rugi', icon: 'fa-chart-line' },
      { name: 'Receivables', label: 'Hutang Piutang', icon: 'fa-handshake' },
      { name: 'Employees', label: 'Manajemen Karyawan', icon: 'fa-users' },
      { name: 'ActivityLogs', label: 'Log Aktivitas', icon: 'fa-scroll' }
    ],
    admin_gudang: [
      { name: 'Products', label: 'Produk', icon: 'fa-boxes-stacked' },
      { name: 'Categories', label: 'Kategori', icon: 'fa-tags' },
      { name: 'Suppliers', label: 'Supplier', icon: 'fa-truck' },
      { name: 'PurchaseOrders', label: 'Purchase Order (PO)', icon: 'fa-file-invoice' },
      { name: 'StockOpname', label: 'Stock Opname', icon: 'fa-clipboard-check' }
    ],
    kasir: [
      { name: 'Pos', label: 'Kasir (POS)', icon: 'fa-cash-register' },
      { name: 'PosHistory', label: 'Riwayat Transaksi', icon: 'fa-history' }
    ]
  };
  return menu[role] || [];
});

const handleLogout = () => {
  authStore.logout();
  router.push({ name: 'Login' });
};
</script>

<style>
/* Adjust app-layout-wrapper to match the PHP layout styling rules */
.app-layout-wrapper {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: 100vh;
  width: 100vw;
  transition: var(--transition);
}

.app-layout-wrapper.sidebar-collapsed {
  grid-template-columns: var(--sidebar-collapsed-width) 1fr;
}

@media (max-width: 1024px) {
  .app-layout-wrapper {
    grid-template-columns: 1fr !important;
  }
}
</style>
