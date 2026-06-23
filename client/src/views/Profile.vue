<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const user = ref({
  username: '',
  email: '',
  contact_info: '',
  help_score: 0,
  tags: []
})

const form = ref({
  email: '',
  password: '',
  newPassword: '',
  contact_info: '',
  tags: []
})

const newTag = ref('')

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  newTag.value = ''
}

const removeTag = (index) => {
  form.value.tags.splice(index, 1)
}

const loading = ref(true)
const updating = ref(false)
const msg = ref('')
const msgType = ref('')

onMounted(async () => {
  try {
    const res = await api.get('/users/profile')
    user.value = res.data.user
    form.value.email = user.value.email
    form.value.contact_info = user.value.contact_info || ''
    form.value.tags = [...(user.value.tags || [])]
  } catch (error) {
    console.error('Failed to load profile', error)
  } finally {
    loading.value = false
  }
})

const updateProfile = async () => {
  updating.value = true
  msg.value = ''
  try {
    const payload = { email: form.value.email, tags: form.value.tags, contact_info: form.value.contact_info }
    if (form.value.password && form.value.newPassword) {
      payload.currentPassword = form.value.password
      payload.newPassword = form.value.newPassword
    } else if (form.value.password || form.value.newPassword) {
      msg.value = 'Please provide both current and new password to change it.'
      msgType.value = 'error'
      updating.value = false
      return
    }

    const res = await api.put('/users/profile', payload)
    msg.value = 'Profile updated successfully!'
    msgType.value = 'success'
    
    // Clear password fields
    form.value.password = ''
    form.value.newPassword = ''
    
    // Update local storage user
    const lsUser = JSON.parse(localStorage.getItem('user') || '{}')
    lsUser.email = form.value.email
    localStorage.setItem('user', JSON.stringify(lsUser))
  } catch (error) {
    msg.value = error.response?.data?.message || 'Failed to update profile'
    msgType.value = 'error'
  } finally {
    updating.value = false
  }
}
</script>

<template>
  <div class="form-container" style="max-width: 500px;">
    <h2 style="margin-bottom: 1.5rem;">編輯個人檔案</h2>
    
    <div v-if="loading" style="text-align: center; padding: 2rem;">
      載入中...
    </div>
    <form v-else @submit.prevent="updateProfile">
      <div class="info-card mb-4">
        <p><strong>使用者名稱:</strong> @{{ user.username }} <span class="text-muted">(不可修改)</span></p>
        <p><strong>人情積分:</strong> <span style="color: #d97706;">🤝 {{ user.help_score }}</span></p>
      </div>

      <div class="input-group">
        <label>電子郵件</label>
        <input v-model="form.email" type="email" class="input-control" required />
      </div>

      <div class="input-group">
        <label>外部聯絡資訊</label>
        <input v-model="form.contact_info" type="text" class="input-control" placeholder="例如：Line ID, IG 帳號 (供買家或幫助者聯絡用)" />
      </div>

      <hr class="mb-4 mt-4" style="border: 0; border-top: 1px solid var(--border-color);" />
      <h3 class="mb-3" style="font-size: 1rem;">個人身分 / 系級標籤</h3>
      <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem;">加入您的系級或其他身分標籤（例如：資訊系、大二），讓別人更容易找到您的商品！</p>
      
      <div class="input-group" style="flex-direction: row; align-items: center; gap: 0.5rem;">
        <input v-model="newTag" type="text" class="input-control" style="flex: 1;" placeholder="輸入標籤後點擊新增" @keypress.enter.prevent="addTag" />
        <button type="button" class="btn btn-outline" @click="addTag">新增</button>
      </div>
      
      <div class="tags-container mb-4 mt-2">
        <span v-for="(tag, index) in form.tags" :key="index" class="tag" style="display: inline-flex; align-items: center; gap: 0.25rem; margin-right: 0.5rem; margin-bottom: 0.5rem;">
          {{ tag }}
          <button type="button" class="remove-tag" @click="removeTag(index)">&times;</button>
        </span>
      </div>

      <hr class="mb-4 mt-4" style="border: 0; border-top: 1px solid var(--border-color);" />
      <h3 class="mb-3" style="font-size: 1rem;">變更密碼 (選填)</h3>

      <div class="input-group">
        <label>目前密碼</label>
        <input v-model="form.password" type="password" class="input-control" placeholder="若不修改請留空" />
      </div>

      <div class="input-group">
        <label>新密碼</label>
        <input v-model="form.newPassword" type="password" class="input-control" placeholder="若不修改請留空" />
      </div>

      <div v-if="msg" class="alert mb-3" :class="msgType">
        {{ msg }}
      </div>

      <button type="submit" class="btn btn-primary" :disabled="updating" style="width: 100%;">
        {{ updating ? '儲存中...' : '儲存變更' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.info-card {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}
.info-card p {
  margin-bottom: 0.5rem;
}
.info-card p:last-child {
  margin-bottom: 0;
}
.text-muted {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-left: 0.5rem;
}
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mt-4 { margin-top: 1.5rem; }

.alert {
  padding: 0.75rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
}
.alert.error {
  background-color: #fee2e2;
  color: #ef4444;
}
.alert.success {
  background-color: #d1fae5;
  color: #10b981;
}

.remove-tag {
  background: none;
  border: none;
  color: var(--primary-color);
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0 0.25rem;
}
.remove-tag:hover {
  color: var(--danger-color);
}
</style>
