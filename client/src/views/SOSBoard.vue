<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const requests = ref([])
const loading = ref(true)
const searchQuery = ref('')
const showModal = ref(false)
const form = ref({ title: '', description: '' })
const submitting = ref(false)

const updating = ref(false)
const showResolveModal = ref(false)
const resolveForm = ref({ id: null, helper_username: '', help_score_given: 5 })

const isAuthenticated = !!localStorage.getItem('token')
const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

const fetchRequests = async () => {
  try {
    const params = {}
    if (searchQuery.value) params.search = searchQuery.value
    const res = await api.get('/community/sos', { params })
    requests.value = res.data
  } catch (error) {
    console.error('Error fetching SOS requests:', error)
  } finally {
    loading.value = false
  }
}

const submitRequest = async () => {
  if (!isAuthenticated) return alert('Please login to post a request')
  
  submitting.value = true
  try {
    await api.post('/community/sos', form.value)
    showModal.value = false
    form.value = { title: '', description: '' }
    fetchRequests()
  } catch (error) {
    alert('Failed to post request')
  } finally {
    submitting.value = false
  }
}

const openResolveModal = (req) => {
  resolveForm.value = { id: req.id, helper_username: '', help_score_given: 5 }
  showResolveModal.value = true
}

const submitResolve = async () => {
  updating.value = true
  try {
    await api.put(`/community/sos/${resolveForm.value.id}`, {
      status: 'resolved',
      helper_username: resolveForm.value.helper_username,
      help_score_given: resolveForm.value.help_score_given
    })
    showResolveModal.value = false
    fetchRequests()
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to resolve request')
  } finally {
    updating.value = false
  }
}

const withdrawRequest = async (id) => {
  if (!confirm('確定要撤回此求救貼文嗎？')) return
  try {
    await api.put(`/community/sos/${id}`, { status: 'withdrawn' })
    fetchRequests()
  } catch (error) {
    alert('Failed to withdraw request')
  }
}

onMounted(() => {
  fetchRequests()
})
</script>

<template>
  <div class="sos-container">
    <div class="header-section" style="flex-direction: column; align-items: stretch;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <h1 style="color: var(--danger-color);">🚨 SOS 求救看板</h1>
          <p style="color: var(--text-secondary);">有緊急需求嗎？發布求救貼文，讓社群為您伸出援手！</p>
        </div>
        <button v-if="isAuthenticated" class="btn btn-primary" @click="showModal = true">
          發布求救
        </button>
        <router-link v-else to="/login" class="btn btn-outline">登入後發布</router-link>
      </div>
      <div class="search-bar" style="display: flex; gap: 0.5rem; max-width: 600px;">
        <input 
          v-model="searchQuery" 
          type="text" 
          class="input-control" 
          style="flex: 1;" 
          placeholder="搜尋求救貼文 (標題或內容)..." 
          @keyup.enter="fetchRequests" 
        />
        <button class="btn btn-outline" @click="fetchRequests">搜尋</button>
      </div>
    </div>

    <!-- Post Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content card">
        <h2 style="margin-bottom: 1rem;">發布 SOS 求救</h2>
        <form @submit.prevent="submitRequest">
          <div class="input-group">
            <label>標題</label>
            <input v-model="form.title" type="text" class="input-control" placeholder="例如：急需明天的實驗衣" required />
          </div>
          <div class="input-group">
            <label>詳細說明</label>
            <textarea v-model="form.description" class="input-control" rows="4" placeholder="請在此補充更多詳細資訊..." required></textarea>
          </div>
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
            <button type="button" class="btn btn-outline" @click="showModal = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">送出</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Resolve Modal -->
    <div v-if="showResolveModal" class="modal-overlay">
      <div class="modal-content card">
        <h2 style="margin-bottom: 1rem;">求救已解決！</h2>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">太棒了！有人幫助了您嗎？您可以選擇贈予對方人情積分以表達感謝。</p>
        <form @submit.prevent="submitResolve">
          <div class="input-group">
            <label>幫助者的使用者名稱 (選填)</label>
            <input v-model="resolveForm.helper_username" type="text" class="input-control" placeholder="例如：john_doe" />
          </div>
          <div class="input-group" v-if="resolveForm.helper_username">
            <label>給予人情積分 (0 - 5)</label>
            <input v-model.number="resolveForm.help_score_given" type="number" min="0" max="5" class="input-control" />
          </div>
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
            <button type="button" class="btn btn-outline" @click="showResolveModal = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="updating">確認解決</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>載入求救貼文中...</p>
    </div>

    <div v-else-if="requests.length === 0" class="empty-state card">
      <p>目前沒有任何 SOS 求救貼文。</p>
    </div>

    <div v-else class="requests-grid">
      <div v-for="req in requests" :key="req.id" class="card request-card" :class="{ resolved: req.status === 'resolved' }">
        <div class="card-header">
          <span class="status-badge" :class="req.status">{{ req.status === 'open' ? '求救中' : '已解決' }}</span>
          <span class="date">{{ new Date(req.created_at).toLocaleDateString() }}</span>
        </div>
        <h3 class="title">{{ req.title }}</h3>
        <p class="desc">{{ req.description }}</p>
        <div class="card-footer">
          <span class="requester">@{{ req.requester_name }}</span>
          <div style="display: flex; gap: 0.5rem;" v-if="req.status === 'open'">
            <router-link v-if="req.user_id !== currentUser.id" :to="`/chat/${req.user_id}`" class="btn btn-sm btn-outline">
              聯絡 / 幫助他
            </router-link>
            <template v-else>
              <button class="btn btn-sm btn-primary" @click="openResolveModal(req)">解決</button>
              <button class="btn btn-sm btn-outline" style="color: var(--danger-color); border-color: var(--danger-color);" @click="withdrawRequest(req.id)">撤回</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.request-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.request-card.resolved {
  opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-weight: bold;
}
.status-badge.open { background-color: #fee2e2; color: #ef4444; }
.status-badge.resolved { background-color: #d1fae5; color: #10b981; }

.date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.title {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.desc {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.requester {
  font-weight: 600;
  color: var(--primary-color);
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
  max-width: 500px;
  padding: 2rem;
}
</style>
