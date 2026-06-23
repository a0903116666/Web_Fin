<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const cart = ref([])
const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
const getCartKey = () => currentUser ? `cart_${currentUser.id}` : 'cart_guest'

const loadCart = () => {
  const cartKey = getCartKey()
  cart.value = JSON.parse(localStorage.getItem(cartKey) || '[]')
}

onMounted(() => {
  loadCart()
  // also listen if it changes from other tabs or auth state
  window.addEventListener('auth-changed', () => {
    // update currentUser when auth changes
    const newCurrentUser = JSON.parse(localStorage.getItem('user') || 'null')
    if (newCurrentUser?.id !== currentUser?.id) {
       // A bit hacky but it reloads the page to refresh the view correctly
       window.location.reload()
    }
  })
})

const removeFromCart = (index) => {
  cart.value.splice(index, 1)
  const cartKey = getCartKey()
  localStorage.setItem(cartKey, JSON.stringify(cart.value))
  window.dispatchEvent(new Event('cart-changed'))
}

const totalAmount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price, 0)
})

const totalDeposit = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.type === 'rent' ? item.deposit : 0), 0)
})

const proceedToCheckout = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    // Save intended destination if needed, or just redirect to login
    router.push('/login')
  } else {
    router.push('/checkout')
  }
}
</script>

<template>
  <div class="cart-container">
    <h1 style="margin-bottom: 2rem;">我的購物車</h1>
    
    <div v-if="cart.length === 0" class="empty-state card" style="padding: 3rem; text-align: center;">
      <p>您的購物車目前是空的。</p>
      <router-link to="/" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">繼續探索</router-link>
    </div>

    <div v-else class="cart-content">
      <div class="cart-items">
        <div v-for="(item, index) in cart" :key="index" class="cart-item card">
          <img :src="item.image_url" :alt="item.title" class="item-img" />
          <div class="item-details">
            <div class="item-header">
              <h3>{{ item.title }}</h3>
              <span class="type-badge" :class="item.type">{{ item.type === 'rent' ? '租借' : '購買' }}</span>
            </div>
            <p class="seller">@{{ item.seller_name }}</p>
            <div class="item-price">
              <span class="price">${{ item.price }}</span>
              <span v-if="item.type === 'rent'" class="deposit"> + ${{ item.deposit }} 押金</span>
            </div>
          </div>
          <button @click="removeFromCart(index)" class="btn btn-outline remove-btn">移除</button>
        </div>
      </div>

      <div class="cart-summary card">
        <h3>訂單摘要</h3>
        <div class="summary-row">
          <span>小計 ({{ cart.length }} 件商品)</span>
          <span>${{ totalAmount }}</span>
        </div>
        <div class="summary-row" v-if="totalDeposit > 0">
          <span>押金總額</span>
          <span>${{ totalDeposit }}</span>
        </div>
        <div class="summary-row total">
          <span>總計</span>
          <span>${{ totalAmount + totalDeposit }}</span>
        </div>
        <button class="btn btn-primary checkout-btn" @click="proceedToCheckout">
          前往結帳
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: start;
}

@media (min-width: 992px) {
  .cart-content {
    grid-template-columns: 2fr 1fr;
  }
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: flex;
  padding: 1rem;
  gap: 1.5rem;
  align-items: center;
}

.item-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--radius);
}

.item-details {
  flex: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.type-badge {
  font-size: 0.7rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-weight: bold;
  color: white;
}
.type-badge.rent { background-color: var(--secondary-color); }
.type-badge.sell { background-color: var(--primary-color); }

.seller {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.item-price {
  font-weight: 600;
}
.price { color: var(--primary-color); }
.deposit { color: var(--text-secondary); font-size: 0.875rem; }

.remove-btn {
  color: var(--danger-color);
  border-color: #fca5a5;
}
.remove-btn:hover {
  background-color: #fef2f2;
}

.cart-summary {
  padding: 1.5rem;
  position: sticky;
  top: 100px;
}

.cart-summary h3 {
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.summary-row.total {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.checkout-btn {
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem;
  font-size: 1.125rem;
  justify-content: center;
}
</style>
