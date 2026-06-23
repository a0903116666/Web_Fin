<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const isLogin = ref(true)

const form = ref({
  username: '',
  email: '',
  password: ''
})

const errorMsg = ref('')
const loading = ref(false)

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
}

const submitForm = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const url = isLogin.value ? '/users/login' : '/users/register'
    const res = await api.post(url, form.value)
    
    // Store token and user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    
    window.dispatchEvent(new Event('auth-changed'))
    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="form-container">
    <h2 style="text-align: center; margin-bottom: 1.5rem; color: var(--primary-color);">
      {{ isLogin ? '歡迎回來' : '建立帳號' }}
    </h2>
    <form @submit.prevent="submitForm">
      <div class="input-group">
        <label>使用者名稱</label>
        <input v-model="form.username" type="text" class="input-control" required />
      </div>
      <div class="input-group" v-if="!isLogin">
        <label>電子郵件</label>
        <input v-model="form.email" type="email" class="input-control" required />
      </div>
      <div class="input-group">
        <label>密碼</label>
        <input v-model="form.password" type="password" class="input-control" required />
      </div>
      
      <p v-if="errorMsg" style="color: var(--danger-color); font-size: 0.875rem; margin-bottom: 1rem;">
        {{ errorMsg }}
      </p>

      <button type="submit" class="btn btn-primary" :disabled="loading" style="width: 100%; padding: 0.75rem 1rem; color: #ffffff; font-size: 1rem; font-weight: 600;">
        <span v-if="loading">處理中...</span>
        <span v-else-if="isLogin">登入</span>
        <span v-else>註冊</span>
      </button>
    </form>

    <div style="text-align: center; margin-top: 1.5rem; font-size: 0.875rem;">
      <span style="color: var(--text-secondary);">
        {{ isLogin ? "還沒有帳號嗎？" : "已經有帳號了嗎？" }}
      </span>
      <a href="#" @click.prevent="toggleMode" style="margin-left: 0.5rem; font-weight: 500; cursor: pointer; color: var(--primary-color);">
        {{ isLogin ? '立即註冊' : '登入' }}
      </a>
    </div>
  </div>
</template>
