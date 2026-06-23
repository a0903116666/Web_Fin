<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()
const product = ref(null)
const loading = ref(true)
const addingToCart = ref(false)
const wishlisted = ref(false)

const isAuthenticated = !!localStorage.getItem('token')

const fetchProduct = async () => {
  try {
    const res = await api.get(`/products/${route.params.id}`)
    product.value = res.data
    // Check if in wishlist? (Would need a separate API call or it comes in dashboard, let's keep simple)
    if (isAuthenticated) {
      checkWishlistStatus();
    }
  } catch (error) {
    console.error('Error fetching product:', error)
  } finally {
    loading.value = false
  }
}

const checkWishlistStatus = async () => {
  try {
    const res = await api.get(`/community/wishlist/check/${route.params.id}`)
    wishlisted.value = res.data.wishlisted
  } catch (error) {
    console.error('Error checking wishlist:', error)
  }
}

const toggleWishlist = async () => {
  if (!isAuthenticated) {
    router.push('/login')
    return
  }
  try {
    const res = await api.post('/community/wishlist', { product_id: product.value.id })
    wishlisted.value = res.data.added
  } catch (error) {
    console.error('Wishlist error', error)
  }
}

const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
const getCartKey = () => currentUser ? `cart_${currentUser.id}` : 'cart_guest'

const addToCart = () => {
  addingToCart.value = true
  setTimeout(() => {
    const cartKey = getCartKey()
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]')
    // Avoid duplicates
    if (!cart.find(item => item.id === product.value.id)) {
      cart.push(product.value)
      localStorage.setItem(cartKey, JSON.stringify(cart))
      window.dispatchEvent(new Event('cart-changed'))
    }
    addingToCart.value = false
  }, 300) // fake delay for animation
}

onMounted(() => {
  fetchProduct()
})
</script>

<template>
  <div v-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>載入商品詳情中...</p>
  </div>
  <div v-else-if="!product" class="empty-state">
    <h2>找不到商品</h2>
    <router-link to="/" class="btn btn-primary">回到探索頁面</router-link>
  </div>
  <div v-else class="product-detail-container">
    <div class="image-section">
      <img :src="product.image_url" :alt="product.title" />
      <span class="type-badge" :class="product.type">
        {{ product.type === 'rent' ? '租借' : '販售' }}
      </span>
      <button class="wishlist-btn" @click="toggleWishlist" :class="{ active: wishlisted }">
        {{ wishlisted ? '❤️' : '🤍' }}
      </button>
    </div>
    
    <div class="info-section">
      <div class="tags mb-1">
        <span v-for="tag in product.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <h1 class="title">{{ product.title }}</h1>
      
      <div class="price-container mb-2">
        <span class="price">${{ product.price }}</span>
        <span v-if="product.type === 'rent'" class="deposit">
          + ${{ product.deposit }} 押金
        </span>
      </div>

      <div class="seller-info card mb-2" style="padding: 1rem; box-shadow: none; border: 1px solid var(--border-color)">
        <div style="font-weight: 600; margin-bottom: 0.25rem;">賣家</div>
        <div>@{{ product.seller_name }} <span style="margin-left: 1rem; color: #d97706;">🤝 {{ product.help_score }} 人情積分</span></div>
        <div v-if="product.contact_info" style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
          <span style="font-weight: 600;">聯絡方式：</span> {{ product.contact_info }}
        </div>
      </div>

      <div class="description mb-2">
        <h3>商品說明</h3>
        <p>{{ product.description || '無提供說明。' }}</p>
      </div>

      <div class="actions" style="display: flex; gap: 1rem;">
        <button 
          v-if="!currentUser || currentUser.id !== product.seller_id"
          class="btn btn-outline btn-lg" 
          @click="router.push(`/chat/${product.seller_id}`)"
          style="flex: 1; justify-content: center;"
        >
          聯絡賣家
        </button>
        <button 
          v-if="!currentUser || currentUser.id !== product.seller_id"
          class="btn btn-primary btn-lg" 
          @click="addToCart" 
          :disabled="addingToCart || product.status !== 'available'"
          style="flex: 1; justify-content: center;"
        >
          {{ product.status !== 'available' ? '無法選購' : (addingToCart ? '加入中...' : '加入購物車') }}
        </button>
        <div v-if="currentUser && currentUser.id === product.seller_id" style="flex: 1; text-align: center; color: var(--text-secondary); padding: 1rem; border: 1px dashed var(--border-color); border-radius: var(--radius);">
          這是您自己的商品
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-detail-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  background-color: var(--surface-color);
  padding: 2rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

@media (min-width: 768px) {
  .product-detail-container {
    grid-template-columns: 1fr 1fr;
  }
}

.image-section {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  background-color: #f1f5f9;
}

.image-section img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.type-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
.type-badge.rent { background-color: var(--secondary-color); }
.type-badge.sell { background-color: var(--primary-color); }

.wishlist-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.wishlist-btn:hover {
  transform: scale(1.1);
}

.info-section {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
}

.price {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary-color);
}

.deposit {
  font-size: 1.125rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.description p {
  white-space: pre-line;
  color: var(--text-secondary);
}

.mb-1 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 2rem; }

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 0;
}
.spinner {
  border: 4px solid rgba(0,0,0,0.1);
  width: 40px; height: 40px;
  border-radius: 50%;
  border-left-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
