<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title-icon"><i class="fas fa-scroll"></i></div>
        <h1 class="page-title-text">Log Aktivitas (Audit Trail)</h1>
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="message" class="alert alert-error">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ message }}</span>
      <button class="alert-close" @click="message = ''"><i class="fas fa-times"></i></button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center" style="padding: 60px;">
      <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
      <p style="margin-top: 10px; color: var(--gray-dark);">Memuat log aktivitas...</p>
    </div>

    <!-- Log Table Card -->
    <div v-else class="card">
      <div class="card-header" style="justify-content: space-between; align-items: center; display: flex;">
        <h2 class="card-title">Riwayat Tindakan Karyawan & Sistem</h2>
        <div class="search-wrapper" style="width: 250px; margin-bottom: 0;">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Cari deskripsi / aksi..." 
            class="form-control" 
            style="padding-left: 36px; height: 38px;"
          >
          <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--gray-dark); font-size: 0.85rem;"></i>
        </div>
      </div>
      <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
          <table class="table" style="font-size: 0.88rem;">
            <thead>
              <tr>
                <th style="width: 160px;">Waktu</th>
                <th>Pengguna</th>
                <th>Role</th>
                <th>Aksi</th>
                <th>Modul</th>
                <th>Deskripsi</th>
                <th style="width: 130px;">IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredLogs.length === 0">
                <td colspan="7" class="text-center" style="padding: 30px; color: var(--gray-dark);">
                  Tidak ada log aktivitas terdaftar.
                </td>
              </tr>
              <tr v-else v-for="log in filteredLogs" :key="log.id">
                <td>{{ formatDateTime(log.created_at) }}</td>
                <td style="font-weight: 700;">{{ log.user_name || 'System / Guest' }}</td>
                <td>
                  <span v-if="log.role === 'owner'" class="badge badge-success" style="font-size: 0.72rem;">Owner</span>
                  <span v-else-if="log.role === 'admin_gudang'" class="badge badge-info" style="font-size: 0.72rem;">Gudang</span>
                  <span v-else-if="log.role === 'kasir'" class="badge badge-warning" style="font-size: 0.72rem;">Kasir</span>
                  <span v-else class="badge badge-secondary" style="font-size: 0.72rem;">-</span>
                </td>
                <td><code style="background-color: var(--gray-light); padding: 2px 6px; border-radius: var(--radius-sm); font-family: monospace; font-size: 0.78rem;">{{ log.action }}</code></td>
                <td><span style="text-transform: capitalize; font-weight: 500;">{{ log.module }}</span></td>
                <td>{{ log.description || '-' }}</td>
                <td style="font-size: 0.78rem; font-family: monospace; color: var(--gray-dark);">{{ log.ip_address }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../utils/api';

const logs = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const message = ref('');

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await api.get('/employees/activity-logs');
    if (res.data.status) {
      logs.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
    message.value = 'Gagal memuat log aktivitas.';
  } finally {
    loading.value = false;
  }
};

const filteredLogs = computed(() => {
  if (!searchQuery.value) return logs.value;
  const q = searchQuery.value.toLowerCase();
  return logs.value.filter(log => 
    (log.description && log.description.toLowerCase().includes(q)) ||
    (log.action && log.action.toLowerCase().includes(q)) ||
    (log.user_name && log.user_name.toLowerCase().includes(q)) ||
    (log.module && log.module.toLowerCase().includes(q))
  );
});

const formatDateTime = (val) => {
  if (!val) return '-';
  const date = new Date(val);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ' ' + date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.search-wrapper {
  position: relative;
}
</style>
