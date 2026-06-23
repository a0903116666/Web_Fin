<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const form = ref({
  title: '',
  description: '',
  image_url: '',
  type: 'sell',
  price: 0,
  deposit: 0,
  tags: []
})

const availableTags = ref([])
const selectedTag = ref('')
const submitting = ref(false)

onMounted(async () => {
  try {
    const res = await api.get('/products/tags')
    availableTags.value = res.data
  } catch (error) {
    console.error('Failed to fetch tags', error)
  }
})

const addTag = () => {
  const tag = selectedTag.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  selectedTag.value = ''
}

const removeTag = (index) => {
  form.value.tags.splice(index, 1)
}

const submitForm = async () => {
  submitting.value = true
  try {
    // Basic validation
    if (form.value.price <= 0) {
      alert('Price must be greater than 0')
      submitting.value = false
      return
    }

    if (!form.value.image_url) {
      // Use a default placeholder if none provided
      form.value.image_url = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
    }

    await api.post('/products', form.value)
    alert('Product listed successfully!')
    router.push('/dashboard')
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to list product')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="form-container" style="max-width: 600px;">
    <h2 style="margin-bottom: 1.5rem;">上架新商品</h2>
    <form @submit.prevent="submitForm">
      
      <div class="input-group">
        <label>商品標題</label>
        <input v-model="form.title" type="text" class="input-control" required placeholder="例如：微積分原文書 (第八版)" />
      </div>

      <div class="input-group">
        <label>商品描述</label>
        <textarea v-model="form.description" class="input-control" rows="3" placeholder="請描述物品狀況、新舊程度等..."></textarea>
      </div>

      <div class="input-group">
        <label>圖片網址 (選填)</label>
        <input v-model="form.image_url" type="url" class="input-control" placeholder="https://..." />
        <small style="color: var(--text-secondary); margin-top: 0.25rem;">留空將會使用預設的佔位圖片。</small>
      </div>

      <div class="input-group">
        <label>上架類型</label>
        <select v-model="form.type" class="input-control">
          <option value="sell">販售 (一次性買斷)</option>
          <option value="rent">租借 (按日計費)</option>
        </select>
      </div>

      <div style="display: flex; gap: 1rem;">
        <div class="input-group" style="flex: 1;">
          <label>{{ form.type === 'rent' ? '每日租金 ($)' : '售價 ($)' }}</label>
          <input v-model.number="form.price" type="number" min="1" class="input-control" required />
        </div>
        <div class="input-group" style="flex: 1;" v-if="form.type === 'rent'">
          <label>押金 ($)</label>
          <input v-model.number="form.deposit" type="number" min="0" class="input-control" />
        </div>
      </div>

      <div class="input-group">
        <label>標籤 (例如：科系名稱、課程名稱)</label>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input 
            v-model="selectedTag" 
            type="text" 
            class="input-control" 
            style="flex: 1;"
            placeholder="輸入標籤後按下新增" 
            @keypress.enter.prevent="addTag"
            list="tag-options"
          />
          <datalist id="tag-options">
            <option v-for="t in availableTags" :key="t.id" :value="t.name"></option>
          </datalist>
          <button type="button" class="btn btn-outline" @click="addTag">新增</button>
        </div>
        <div class="tags-preview" v-if="form.tags.length > 0">
          <span v-for="(tag, index) in form.tags" :key="index" class="tag">
            {{ tag }}
            <button type="button" class="remove-tag" @click="removeTag(index)">&times;</button>
          </span>
        </div>
      </div>

      <div style="margin-top: 2rem; display: flex; gap: 1rem;">
        <router-link to="/dashboard" class="btn btn-outline" style="flex: 1; text-align: center;">取消</router-link>
        <button type="submit" class="btn btn-primary" :disabled="submitting" style="flex: 1;">
          {{ submitting ? '處理中...' : '確認上架' }}
        </button>
      </div>

    </form>
  </div>
</template>

<style scoped>
.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f1f5f9;
  border-radius: var(--radius);
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.remove-tag {
  background: none;
  border: none;
  color: inherit;
  font-size: 1rem;
  cursor: pointer;
  line-height: 1;
}

.remove-tag:hover {
  color: var(--danger-color);
}
</style>
