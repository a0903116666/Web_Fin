import { createRouter, createWebHistory } from 'vue-router';

// Lazy loaded views
const Home = () => import('../views/Home.vue');
const Login = () => import('../views/Login.vue');
const ProductDetail = () => import('../views/ProductDetail.vue');
const Cart = () => import('../views/Cart.vue');
const Checkout = () => import('../views/Checkout.vue');
const Dashboard = () => import('../views/Dashboard.vue');
const SOSBoard = () => import('../views/SOSBoard.vue');
const Chatroom = () => import('../views/Chatroom.vue');
const AddProduct = () => import('../views/AddProduct.vue');
const Profile = () => import('../views/Profile.vue');
const Departments = () => import('../views/Departments.vue');
const Leaderboard = () => import('../views/Leaderboard.vue');
const Admin = () => import('../views/Admin.vue');

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/product/:id', name: 'ProductDetail', component: ProductDetail, props: true },
  { path: '/cart', name: 'Cart', component: Cart },
  { path: '/checkout', name: 'Checkout', component: Checkout, meta: { requiresAuth: true } },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/add-product', name: 'AddProduct', component: AddProduct, meta: { requiresAuth: true } },
  { path: '/chat/:userId?', name: 'Chatroom', component: Chatroom, meta: { requiresAuth: true } },
  { path: '/sos', name: 'SOSBoard', component: SOSBoard },
  { path: '/departments', name: 'Departments', component: Departments },
  { path: '/leaderboard', name: 'Leaderboard', component: Leaderboard },
  { path: '/admin', name: 'Admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresAdmin && user.role !== 'admin') {
    next('/');
  } else {
    next();
  }
});

export default router;
