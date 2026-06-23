<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()
const tags = ref(['資訊系', '電機系', '企管系', '設計系', '大一', '大二', '大三', '大四'])
const selectedTag = ref(route.query.tag || '')
const customTag = ref('')
const products = ref([])
const loading = ref(false)

if (selectedTag.value && !tags.value.includes(selectedTag.value)) {
  customTag.value = selectedTag.value
}

const searchCustomTag = () => {
  const tag = customTag.value.trim()
  if (tag) {
    selectTag(tag)
  }
}

const fetchProducts = async () => {
  if (!selectedTag.value) {
    products.value = []
    return
  }
  loading.value = true
  try {
    const res = await api.get(`/products?user_tag=${encodeURIComponent(selectedTag.value)}`)
    products.value = res.data
  } catch (error) {
    console.error('Failed to fetch department products', error)
  } finally {
    loading.value = false
  }
}

const selectTag = (tag) => {
  selectedTag.value = tag
  if (tag && !tags.value.includes(tag)) {
    customTag.value = tag
  } else {
    customTag.value = ''
  }
  router.push({ query: { tag } })
  fetchProducts()
}

onMounted(() => {
  if (selectedTag.value) {
    fetchProducts()
  }
})

watch(() => route.query.tag, (newTag) => {
  selectedTag.value = newTag || ''
  if (newTag && !tags.value.includes(newTag)) {
    customTag.value = newTag
  } else {
    customTag.value = ''
  }
  fetchProducts()
})
</script>

<template>
  <div class="departments-container">
    <div class="header-section text-center mb-4">
      <h1 style="color: var(--primary-color); margin-bottom: 1rem;">🏫 各系/各年級專區</h1>
      <p style="color: var(--text-secondary);">點擊下方標籤，尋找來自該系所或年級同學上架的專屬商品與教科書！</p>
    </div>

    <div class="tags-filter mb-4" style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; align-items: center;">
      <button 
        v-for="tag in tags" 
        :key="tag" 
        class="btn btn-sm"
        :class="selectedTag === tag ? 'btn-primary' : 'btn-outline'"
        @click="selectTag(tag)"
      >
        {{ tag }}
      </button>

      <div style="display: flex; gap: 0.5rem; margin-left: 0.5rem;">
        <input 
          v-model="customTag"
          type="text" 
          class="input-control" 
          placeholder="自訂系級標籤..." 
          style="width: 150px; padding: 0.35rem 0.75rem; font-size: 0.875rem;"
          @keyup.enter="searchCustomTag"
        />
        <button class="btn btn-sm btn-primary" @click="searchCustomTag">搜尋</button>
      </div>
    </div>

    <div v-if="loading" class="text-center" style="padding: 2rem;">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>
    
    <div v-else-if="!selectedTag" class="text-center card empty-state">
      <p>請先選擇上方的系所或年級標籤來查看商品。</p>
    </div>

    <div v-else-if="products.length === 0" class="text-center card empty-state">
      <p>目前沒有來自「{{ selectedTag }}」同學所上架的商品。</p>
    </div>

    <div v-else class="product-grid">
      <router-link v-for="product in products" :key="product.id" :to="`/product/${product.id}`" class="card product-card">
        <img :src="product.image_url" :alt="product.title" class="product-image" />
        <div class="product-content">
          <div class="product-header">
            <span class="badge">{{ product.type === 'rent' ? '租借' : '購買' }}</span>
            <span class="price">${{ product.price }}{{ product.type === 'rent' ? '/天' : '' }}</span>
          </div>
          <h3 class="product-title">{{ product.title }}</h3>
          <p class="product-desc">{{ product.description }}</p>
          <div class="product-footer">
            <span class="seller">@{{ product.seller_name }} ({{ selectedTag }})</span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.mb-4 { margin-bottom: 2rem; }
.text-center { text-align: center; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.product-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid var(--border-color);
}

.product-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.price {
  font-weight: 800;
  color: var(--primary-color);
  font-size: 1.25rem;
}

.product-title {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.product-desc {
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 1rem;
  flex: 1;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.seller {
  color: var(--text-secondary);
  font-weight: 500;
}
.empty-state {
  padding: 3rem 1rem;
  color: var(--text-secondary);
}
</style>
