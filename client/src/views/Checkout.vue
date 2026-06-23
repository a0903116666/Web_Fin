<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const cart = ref([])
const form = ref({
  recipient_name: '',
  recipient_phone: '',
  recipient_address: '',
  delivery_method: 'campus_meetup'
})
const errorMsg = ref('')
const processing = ref(false)

const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
const getCartKey = () => currentUser ? `cart_${currentUser.id}` : 'cart_guest'

onMounted(() => {
  const cartKey = getCartKey()
  cart.value = JSON.parse(localStorage.getItem(cartKey) || '[]')
  if (cart.value.length === 0) {
    router.push('/cart')
  }
})

const totalAmount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price, 0)
})

const totalDeposit = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.type === 'rent' ? item.deposit : 0), 0)
})

const submitOrder = async () => {
  processing.value = true
  errorMsg.value = ''
  try {
    const items = cart.value.map(item => ({ product_id: item.id }))
    const payload = {
      items,
      ...form.value
    }
    
    await api.post('/orders', payload)
    
    // Clear cart on success
    const cartKey = getCartKey()
    localStorage.removeItem(cartKey)
    window.dispatchEvent(new Event('cart-changed'))
    
    alert('Order placed successfully!')
    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to place order'
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="checkout-container">
    <h1 style="margin-bottom: 2rem;">結帳</h1>
    
    <div class="checkout-grid">
      <div class="checkout-form card">
        <h2 style="margin-bottom: 1.5rem;">收件資訊</h2>
        <form @submit.prevent="submitOrder">
          <div class="input-group">
            <label>取貨方式</label>
            <select v-model="form.delivery_method" class="input-control">
              <option value="campus_meetup">校園面交</option>
              <option value="convenience_store">超商取貨</option>
            </select>
          </div>
          
          <div class="input-group">
            <label>收件人姓名</label>
            <input v-model="form.recipient_name" type="text" class="input-control" required />
          </div>
          
          <div class="input-group">
            <label>聯絡電話</label>
            <input v-model="form.recipient_phone" type="tel" class="input-control" required />
          </div>
          
          <div class="input-group">
            <label>{{ form.delivery_method === 'campus_meetup' ? '面交地點' : '超商門市/地址' }}</label>
            <input v-model="form.recipient_address" type="text" class="input-control" required />
          </div>

          <p v-if="errorMsg" style="color: var(--danger-color); margin-bottom: 1rem;">
            {{ errorMsg }}
          </p>

          <button type="submit" class="btn btn-primary" :disabled="processing" style="width: 100%; margin-top: 1rem;">
            {{ processing ? '處理中...' : '確認結帳' }}
          </button>
        </form>
      </div>

      <div class="checkout-summary card">
        <h3>訂單摘要</h3>
        <div class="summary-items">
          <div v-for="item in cart" :key="item.id" class="summary-item">
            <span>{{ item.title }} ({{ item.type === 'rent' ? '租借' : '購買' }})</span>
            <span>${{ item.price }}</span>
          </div>
        </div>
        <div class="summary-row" style="margin-top: 1rem;">
          <span>小計</span>
          <span>${{ totalAmount }}</span>
        </div>
        <div class="summary-row" v-if="totalDeposit > 0">
          <span>押金總額</span>
          <span>${{ totalDeposit }}</span>
        </div>
        <div class="summary-row total">
          <span>總應付金額</span>
          <span>${{ totalAmount + totalDeposit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: start;
}

@media (min-width: 992px) {
  .checkout-grid {
    grid-template-columns: 2fr 1fr;
  }
}

.checkout-form {
  padding: 2rem;
}

.checkout-summary {
  padding: 1.5rem;
  position: sticky;
  top: 100px;
}

.summary-items {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
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
</style>
