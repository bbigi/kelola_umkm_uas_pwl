import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import Login from '../views/Login.vue';
import MainLayout from '../views/layout/MainLayout.vue';
import Dashboard from '../views/Dashboard.vue';
import Pos from '../views/Pos.vue';
import Products from '../views/Products.vue';
import Categories from '../views/Categories.vue';
import Suppliers from '../views/Suppliers.vue';
import PosHistory from '../views/PosHistory.vue';
import PurchaseOrders from '../views/PurchaseOrders.vue';
import StockOpname from '../views/StockOpname.vue';
import Expenses from '../views/Expenses.vue';
import ProfitLoss from '../views/ProfitLoss.vue';
import Receivables from '../views/Receivables.vue';
import Employees from '../views/Employees.vue';
import ActivityLogs from '../views/ActivityLogs.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'Dashboard' }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { roles: ['owner'] }
      },
      {
        path: 'pos',
        name: 'Pos',
        component: Pos,
        meta: { roles: ['owner', 'kasir'] }
      },
      {
        path: 'pos/history',
        name: 'PosHistory',
        component: PosHistory,
        meta: { roles: ['owner', 'kasir'] }
      },
      {
        path: 'products',
        name: 'Products',
        component: Products,
        meta: { roles: ['owner', 'admin_gudang'] }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: Categories,
        meta: { roles: ['owner', 'admin_gudang'] }
      },
      {
        path: 'suppliers',
        name: 'Suppliers',
        component: Suppliers,
        meta: { roles: ['owner', 'admin_gudang'] }
      },
      {
        path: 'inventory/purchase-orders',
        name: 'PurchaseOrders',
        component: PurchaseOrders,
        meta: { roles: ['owner', 'admin_gudang'] }
      },
      {
        path: 'inventory/stock-opname',
        name: 'StockOpname',
        component: StockOpname,
        meta: { roles: ['owner', 'admin_gudang'] }
      },
      {
        path: 'finance/expenses',
        name: 'Expenses',
        component: Expenses,
        meta: { roles: ['owner'] }
      },
      {
        path: 'finance/profit-loss',
        name: 'ProfitLoss',
        component: ProfitLoss,
        meta: { roles: ['owner'] }
      },
      {
        path: 'finance/receivables',
        name: 'Receivables',
        component: Receivables,
        meta: { roles: ['owner'] }
      },
      {
        path: 'employees',
        name: 'Employees',
        component: Employees,
        meta: { roles: ['owner'] }
      },
      {
        path: 'employees/activity-logs',
        name: 'ActivityLogs',
        component: ActivityLogs,
        meta: { roles: ['owner'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.role;

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // Halaman butuh auth tapi belum login → ke Login
  if (requiresAuth && !isAuthenticated) {
    if (to.name !== 'Login') {
      return next({ name: 'Login' });
    }
    return next();
  }

  // Sudah login tapi akses halaman guest (Login) → redirect ke halaman utama
  if (to.meta.guest && isAuthenticated) {
    const home = getHomeRoute(userRole);
    if (to.name !== home) {
      return next({ name: home });
    }
    return next();
  }

  // Sudah login tapi tidak punya role yang diperlukan untuk halaman ini
  if (isAuthenticated && to.meta.roles && !to.meta.roles.includes(userRole)) {
    const home = getHomeRoute(userRole);
    if (to.name !== home) {
      return next({ name: home });
    }
    return next();
  }

  next();
});

function getHomeRoute(role) {
  if (role === 'kasir') return 'Pos';
  if (role === 'admin_gudang') return 'Products';
  return 'Dashboard'; // owner
}

export default router;
