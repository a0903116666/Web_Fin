<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const token = ref(localStorage.getItem('token'))
const cartCount = ref(0)
const currentUser = ref(JSON.parse(localStorage.getItem('user') || 'null'))

const isAuthenticated = computed(() => !!token.value)

const getCartKey = () => {
  return currentUser.value ? `cart_${currentUser.value.id}` : 'cart_guest'
}

const updateCartCount = () => {
  const cartKey = getCartKey()
  const cart = JSON.parse(localStorage.getItem(cartKey) || '[]')
  cartCount.value = cart.length
}

onMounted(() => {
  updateCartCount()
  window.addEventListener('auth-changed', () => {
    token.value = localStorage.getItem('token')
    currentUser.value = JSON.parse(localStorage.getItem('user') || 'null')
    updateCartCount()
  })
  window.addEventListener('cart-changed', updateCartCount)
})

const logout = () => {
  // Clear user's cart on logout
  localStorage.removeItem(getCartKey())
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  token.value = null
  currentUser.value = null
  window.dispatchEvent(new Event('auth-changed'))
  router.push('/login')
}
</script>

<template>
  <div class="app-wrapper">
    <nav class="navbar">
      <div class="container navbar-content">
        <div class="logo">
          <router-link to="/">📦 CampusShare 校園資源共享</router-link>
        </div>
        <div class="nav-links-center">
          <router-link to="/">探索商品</router-link>
          <router-link to="/departments">各系專區</router-link>
          <router-link to="/sos">SOS 求救牆</router-link>
          <router-link to="/leaderboard">排行榜</router-link>
          <router-link v-if="isAuthenticated" to="/chat">我的訊息</router-link>
          <router-link to="/cart" class="cart-link">
            購物車 <span class="badge" v-if="cartCount > 0">{{ cartCount }}</span>
          </router-link>
          <template v-if="isAuthenticated">
            <router-link v-if="currentUser?.role === 'admin'" to="/admin" style="color: var(--danger-color); font-weight: bold;">管理員後台</router-link>
            <router-link to="/dashboard">個人儀表板</router-link>
            <router-link to="/profile">個人檔案</router-link>
          </template>
        </div>
        <div class="nav-auth">
          <template v-if="isAuthenticated">
            <button @click="logout" class="btn btn-outline btn-sm">登出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-primary btn-sm">登入 / 註冊</router-link>
          </template>
        </div>
      </div>
    </nav>
    <main class="main-content container">
      <router-view />
    </main>
    <footer class="footer">
      <div class="container">
        <p>&copy; 2026 CampusShare 物品租借與二手書販售平台. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  flex: 1;
}

.logo a {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-color);
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.nav-links-center {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-weight: 500;
  justify-content: center;
}

.nav-links-center a:not(.btn) {
  color: var(--text-secondary);
}

.nav-links-center a:not(.btn):hover, .nav-links-center a:not(.btn).router-link-active {
  color: var(--primary-color);
}

.nav-auth {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.cart-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
}

.main-content {
  flex: 1;
  padding-top: 2rem;
  padding-bottom: 4rem;
}

.footer {
  background-color: white;
  border-top: 1px solid var(--border-color);
  padding: 2rem 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>
