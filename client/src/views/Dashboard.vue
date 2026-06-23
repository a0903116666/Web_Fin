<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const activeTab = ref('orders') // orders, products, wishlist
const dashboardData = ref({ myOrders: [], myProducts: [], myWishlist: [] })
const loading = ref(true)

const fetchDashboard = async () => {
  try {
    const res = await api.get('/users/dashboard')
    dashboardData.value = res.data
  } catch (error) {
    console.error('Error fetching dashboard:', error)
  } finally {
    loading.value = false
  }
}

// Help Score Modal logic
const showReturnModal = ref(false)
const returnOrder = ref(null)
const returnScore = ref(5)

const openReturnModal = (order_id, product_id) => {
  returnOrder.value = { order_id, product_id }
  returnScore.value = 5
  showReturnModal.value = true
}

const confirmReturn = async () => {
  try {
    await api.post('/community/return', {
      order_id: returnOrder.value.order_id,
      product_id: returnOrder.value.product_id,
      help_score_given: returnScore.value
    })
    alert('Item returned successfully!')
    showReturnModal.value = false
    fetchDashboard() // refresh
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to return item')
  }
}

const deleteProduct = async (id) => {
  if (!confirm('確定要刪除這個商品嗎？此動作無法復原。')) return
  try {
    const res = await api.delete(`/products/${id}`)
    alert(res.data.message || '商品已成功刪除')
    fetchDashboard() // refresh
  } catch (error) {
    alert(error.response?.data?.message || '刪除商品失敗')
  }
}

const processOrder = async (orderId) => {
  try {
    await api.post(`/orders/${orderId}/process`)
    alert('已將訂單標記為已出貨！')
    fetchDashboard() // refresh
  } catch (error) {
    alert(error.response?.data?.message || '更新訂單狀態失敗')
  }
}

const completeOrder = async (orderId) => {
  try {
    await api.post(`/orders/${orderId}/complete`)
    alert('已確認收貨！')
    fetchDashboard() // refresh
  } catch (error) {
    alert(error.response?.data?.message || '更新訂單狀態失敗')
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<template>
  <div class="dashboard-container">
    <h1 style="margin-bottom: 2rem;">我的儀表板</h1>
    
    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'orders' }"
        @click="activeTab = 'orders'"
      >買家訂單</button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'products' }"
        @click="activeTab = 'products'"
      >我的商品 (賣家)</button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'wishlist' }"
        @click="activeTab = 'wishlist'"
      >我的收藏</button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>載入儀表板中...</p>
    </div>

    <div v-else class="tab-content">
      <!-- Orders Tab -->
      <div v-if="activeTab === 'orders'">
        <div v-if="dashboardData.myOrders.length === 0" class="empty-state card">
          <p>您尚未建立任何訂單。</p>
        </div>
        <div v-else class="grid">
          <div v-for="order in dashboardData.myOrders" :key="order.id" class="card list-item">
            <div style="display: flex; gap: 1rem;">
              <img :src="order.image_url" class="item-img" />
              <div>
                <h3 style="margin-bottom: 0.25rem;">{{ order.title }}</h3>
                <span class="type-badge" :class="order.type">{{ order.type === 'rent' ? '租借' : '購買' }}</span>
                <p style="margin-top: 0.5rem;">訂單狀態: <strong>{{ order.status === 'completed' ? '已完成' : order.status === 'shipped' ? '已出貨' : order.status === 'returned' ? '已歸還' : order.status === 'cancelled' ? '交易失敗' : '處理中' }}</strong></p>
                <div v-if="order.status === 'shipped'" style="margin-top: 1rem;">
                  <button class="btn btn-primary btn-sm" @click="completeOrder(order.id)">
                    確認已收貨
                  </button>
                </div>
                <div v-if="order.type === 'rent' && order.status === 'completed'" style="margin-top: 1rem;">
                  <button class="btn btn-outline btn-sm" @click="openReturnModal(order.id, order.product_id)">
                    歸還物品並評價賣家
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Tab -->
      <div v-if="activeTab === 'products'">
        <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
          <router-link to="/add-product" class="btn btn-primary">上架新商品</router-link>
        </div>
        <div v-if="dashboardData.myProducts.length === 0" class="empty-state card">
          <p>您尚未上架任何商品。</p>
        </div>
        <div v-else class="grid">
          <div v-for="product in dashboardData.myProducts" :key="product.id" class="card list-item">
            <div style="display: flex; gap: 1rem; align-items: flex-start; justify-content: space-between; width: 100%;">
              <div style="display: flex; gap: 1rem; flex: 1;">
                <img :src="product.image_url" class="item-img" />
                <div style="flex: 1;">
                  <h3 style="margin-bottom: 0.25rem;">{{ product.title }}</h3>
                  <p>狀態: <strong :class="'status-' + product.status">{{ product.status === 'available' ? '上架中' : product.status === 'rented' ? '已租出' : '已售出' }}</strong></p>
                  <p>類型: {{ product.type === 'rent' ? '租借' : '販售' }} | 價格: ${{ product.price }}</p>

                  <div v-if="product.order_id" style="margin-top: 1rem; padding: 1rem; background-color: var(--bg-color); border-radius: var(--radius);">
                    <h4 style="margin-bottom: 0.5rem;">買家與訂單資訊</h4>
                    <p><strong>買家帳號:</strong> @{{ product.buyer_username }}</p>
                    <p><strong>收件人:</strong> {{ product.recipient_name }} ({{ product.recipient_phone }})</p>
                    <p><strong>交貨方式:</strong> {{ product.delivery_method === 'campus_meetup' ? '校園面交' : '便利商店店到店' }}</p>
                    <p><strong>交貨地點:</strong> {{ product.recipient_address }}</p>
                    
                    <div style="margin-top: 1rem;">
                      <button v-if="product.order_status === 'pending'" class="btn btn-primary btn-sm" @click="processOrder(product.order_id)">標記為已處理 (已出貨)</button>
                      <span v-else-if="product.order_status === 'shipped'" style="color: var(--secondary-color); font-weight: bold;">已出貨，等待買家收貨</span>
                      <span v-else-if="product.order_status === 'completed'" style="color: var(--success-color); font-weight: bold;">買家已收貨</span>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                v-if="product.status === 'available' || product.order_status === 'pending'"
                class="btn btn-outline btn-sm" 
                style="color: var(--danger-color); border-color: var(--danger-color);" 
                @click="deleteProduct(product.id)"
              >
                刪除商品
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Wishlist Tab -->
      <div v-if="activeTab === 'wishlist'">
        <div v-if="dashboardData.myWishlist.length === 0" class="empty-state card">
          <p>您的收藏清單是空的。</p>
        </div>
        <div v-else class="grid">
          <div v-for="product in dashboardData.myWishlist" :key="product.id" class="card list-item">
            <div style="display: flex; gap: 1rem; align-items: center;">
              <img :src="product.image_url" class="item-img" />
              <div>
                <h3 style="margin-bottom: 0.25rem;">{{ product.title }}</h3>
                <router-link :to="`/product/${product.id}`" class="btn btn-primary btn-sm">檢視商品</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Return Modal -->
    <div v-if="showReturnModal" class="modal-overlay">
      <div class="modal-content card">
        <h2 style="margin-bottom: 1rem;">歸還物品</h2>
        <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
          感謝您歸還租借的物品！請問您願意給予這位賣家多少人情積分？
        </p>
        <div class="input-group">
          <label>人情積分 (0 - 5)</label>
          <input type="number" v-model.number="returnScore" min="0" max="5" class="input-control" />
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
          <button class="btn btn-outline" @click="showReturnModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmReturn">確認歸還</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: var(--transition);
}

.tab-btn:hover {
  color: var(--primary-color);
}

.tab-btn.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-item {
  padding: 1.5rem;
}

.item-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--radius);
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

.status-available { color: var(--success-color); }
.status-rented { color: var(--secondary-color); }
.status-sold { color: var(--primary-color); }

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}
</style>
