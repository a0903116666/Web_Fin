<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const users = ref([])
const loading = ref(true)
const searchQuery = ref('')
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const isAuthenticated = ref(!!localStorage.getItem('token'))

const fetchLeaderboard = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchQuery.value) params.search = searchQuery.value
    const res = await api.get('/users/leaderboard', { params })
    users.value = res.data
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
  } finally {
    loading.value = false
  }
}

const chatWithUser = (userId) => {
  if (!isAuthenticated.value) {
    alert('請先登入以發送訊息')
    router.push('/login')
    return
  }
  router.push(`/chat/${userId}`)
}

onMounted(() => {
  fetchLeaderboard()
})
</script>

<template>
  <div class="leaderboard-container">
    <div class="header-section text-center mb-4">
      <h1 style="color: var(--primary-color); margin-bottom: 1rem;">🏆 人情積分排行榜</h1>
      <p style="color: var(--text-secondary);">看看誰是社群中最熱心助人的大好人！您也可以在這裡尋找同學並發起對話。</p>
    </div>

    <div class="search-bar" style="display: flex; gap: 0.5rem; max-width: 600px; margin: 0 auto 2rem;">
      <input 
        v-model="searchQuery" 
        type="text" 
        class="input-control" 
        style="flex: 1;" 
        placeholder="搜尋使用者名稱..." 
        @keyup.enter="fetchLeaderboard" 
      />
      <button class="btn btn-primary" @click="fetchLeaderboard">搜尋</button>
    </div>

    <div v-if="loading" class="text-center" style="padding: 2rem;">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>
    
    <div v-else-if="users.length === 0" class="text-center card empty-state">
      <p>找不到符合條件的使用者。</p>
    </div>

    <div v-else class="users-list">
      <div v-for="(user, index) in users" :key="user.id" class="card user-card">
        <div class="user-info">
          <div class="rank-badge" :class="index < 3 ? `rank-${index + 1}` : ''">
            {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}` }}
          </div>
          <div class="user-details">
            <h3 class="username">@{{ user.username }}</h3>
            <div v-if="user.tags && user.tags.length" class="tags">
              <span v-for="tag in user.tags" :key="tag" class="badge tag-badge">{{ tag }}</span>
            </div>
            <div v-if="user.contact_info" class="contact-info" style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
              <span style="font-weight: 600;">聯絡方式：</span> {{ user.contact_info }}
            </div>
          </div>
        </div>
        
        <div class="user-actions">
          <div class="score">
            <span class="score-icon">🤝</span>
            <span class="score-value">{{ user.help_score }}</span>
            <span class="score-label">積分</span>
          </div>
          <button 
            v-if="user.id !== currentUser.id" 
            class="btn btn-sm btn-outline" 
            @click="chatWithUser(user.id)"
          >
            傳送訊息
          </button>
          <span v-else class="text-muted" style="font-size: 0.875rem;">這是您</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-4 { margin-bottom: 2rem; }
.text-center { text-align: center; }

.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.rank-badge {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-secondary);
  width: 3rem;
  text-align: center;
}

.rank-1 { font-size: 2.5rem; }
.rank-2 { font-size: 2rem; }
.rank-3 { font-size: 1.75rem; }

.username {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-badge {
  background-color: #e0e7ff;
  color: var(--primary-color);
  font-weight: normal;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.score {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.score-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #d97706;
}

.score-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.empty-state {
  padding: 3rem 1rem;
  color: var(--text-secondary);
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
