<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const activeTab = ref('users')
const users = ref([])
const products = ref([])
const sos = ref([])
const loading = ref(true)

const fetchAdminData = async () => {
  loading.value = true
  try {
    const [uRes, pRes, sRes] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/products'),
      api.get('/admin/sos')
    ])
    users.value = uRes.data
    products.value = pRes.data
    sos.value = sRes.data
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 401) {
      alert('無管理員權限')
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}

const deleteUser = async (id) => {
  if (!confirm('確定要刪除此帳號嗎？相關紀錄也會被刪除，且無法復原。')) return
  try {
    await api.delete(`/admin/users/${id}`)
    alert('帳號已刪除')
    fetchAdminData()
  } catch (error) {
    alert(error.response?.data?.message || '刪除失敗')
  }
}

const toggleBlockUser = async (id, isBlocked) => {
  const action = isBlocked ? '解除封鎖' : '封鎖';
  if (!confirm(`確定要${action}此帳號嗎？`)) return;
  try {
    const res = await api.post(`/admin/users/${id}/block`);
    alert(res.data.message);
    fetchAdminData();
  } catch (error) {
    alert(error.response?.data?.message || `${action}失敗`);
  }
}

const deleteProduct = async (id) => {
  if (!confirm('確定要強制下架並刪除此商品嗎？')) return
  try {
    await api.delete(`/admin/products/${id}`)
    alert('商品已刪除')
    fetchAdminData()
  } catch (error) {
    alert('刪除商品失敗')
  }
}

const deleteSOS = async (id) => {
  if (!confirm('確定要強制刪除此求救貼文嗎？')) return
  try {
    await api.delete(`/admin/sos/${id}`)
    alert('貼文已刪除')
    fetchAdminData()
  } catch (error) {
    alert('刪除貼文失敗')
  }
}

onMounted(() => {
  fetchAdminData()
})
</script>

<template>
  <div class="admin-container">
    <div class="header-section text-center mb-4">
      <h1 style="color: var(--danger-color); margin-bottom: 1rem;">⚙️ 系統管理員後台</h1>
      <p style="color: var(--text-secondary);">全站資料控管中心（請謹慎操作刪除功能）</p>
    </div>

    <div class="tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">使用者管理</button>
      <button class="tab-btn" :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'">商品管理</button>
      <button class="tab-btn" :class="{ active: activeTab === 'sos' }" @click="activeTab = 'sos'">SOS 看板管理</button>
    </div>

    <div v-if="loading" class="text-center" style="padding: 2rem;">
      <div class="spinner"></div>
      <p>載入資料中...</p>
    </div>

    <div v-else class="tab-content">
      <!-- Users Tab -->
      <div v-if="activeTab === 'users'">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>帳號名稱</th>
                <th>信箱</th>
                <th>身分</th>
                <th>狀態</th>
                <th>人情積分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>@{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td><span class="badge" :class="user.role === 'admin' ? 'admin-badge' : ''">{{ user.role }}</span></td>
                <td>
                  <span v-if="user.is_blocked" style="color: var(--danger-color); font-weight: bold;">已封鎖</span>
                  <span v-else style="color: var(--success-color);">正常</span>
                </td>
                <td>{{ user.help_score }}</td>
                <td>
                  <button v-if="user.role !== 'admin'" class="btn btn-sm btn-outline" :class="user.is_blocked ? 'success' : 'danger'" @click="toggleBlockUser(user.id, user.is_blocked)" style="margin-right: 0.5rem;">
                    {{ user.is_blocked ? '解除封鎖' : '封鎖' }}
                  </button>
                  <button v-if="user.role !== 'admin'" class="btn btn-sm btn-outline danger" @click="deleteUser(user.id)">刪除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Products Tab -->
      <div v-if="activeTab === 'products'">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>賣家</th>
                <th>標題</th>
                <th>類型</th>
                <th>價格</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td>{{ product.id }}</td>
                <td>@{{ product.seller_name }}</td>
                <td>{{ product.title }}</td>
                <td>{{ product.type === 'rent' ? '租借' : '販售' }}</td>
                <td>${{ product.price }}</td>
                <td>{{ product.status }}</td>
                <td>
                  <button class="btn btn-sm btn-outline danger" @click="deleteProduct(product.id)">刪除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SOS Tab -->
      <div v-if="activeTab === 'sos'">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>發布者</th>
                <th>標題</th>
                <th>狀態</th>
                <th>時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in sos" :key="req.id">
                <td>{{ req.id }}</td>
                <td>@{{ req.username }}</td>
                <td>{{ req.title }}</td>
                <td>{{ req.status === 'open' ? '招募中' : '已解決' }}</td>
                <td>{{ new Date(req.created_at).toLocaleString() }}</td>
                <td>
                  <button class="btn btn-sm btn-outline danger" @click="deleteSOS(req.id)">刪除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-4 { margin-bottom: 2rem; }
.text-center { text-align: center; }

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
  color: var(--danger-color);
  border-bottom-color: var(--danger-color);
}

.table-responsive {
  overflow-x: auto;
  background-color: var(--surface-color);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th, .admin-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.admin-table th {
  background-color: #f8fafc;
  font-weight: 600;
  color: var(--text-secondary);
}

.admin-table tr:hover {
  background-color: #f8fafc;
}

.btn-outline.danger {
  color: var(--danger-color);
  border-color: var(--danger-color);
}
.btn-outline.danger:hover {
  background-color: var(--danger-color);
  color: white;
}

.btn-outline.success {
  color: var(--success-color, #10b981);
  border-color: var(--success-color, #10b981);
}
.btn-outline.success:hover {
  background-color: var(--success-color, #10b981);
  color: white;
}

.admin-badge {
  background-color: var(--danger-color);
  color: white;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
