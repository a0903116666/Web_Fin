<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../api'
import ProductCard from '../components/ProductCard.vue'

const products = ref([])
const tags = ref([])
const searchQuery = ref('')
const selectedTag = ref('')
const selectedType = ref('')
const userTagSearch = ref('')
const loading = ref(true)

const fetchProducts = async () => {
  try {
    loading.value = true
    const params = {}
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedTag.value) params.tag = selectedTag.value
    if (selectedType.value) params.type = selectedType.value
    if (userTagSearch.value) params.user_tag = userTagSearch.value
    
    const res = await api.get('/products', { params })
    products.value = res.data
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    loading.value = false
  }
}

const fetchTags = async () => {
  try {
    const res = await api.get('/products/tags')
    tags.value = res.data
  } catch (error) {
    console.error('Error fetching tags:', error)
  }
}

const selectTag = (tag) => {
  if (selectedTag.value === tag) {
    selectedTag.value = '' // deselect
  } else {
    selectedTag.value = tag
  }
  fetchProducts()
}

const setTypeFilter = (type) => {
  selectedType.value = type
  fetchProducts()
}

const submitSearch = () => {
  fetchProducts()
}

onMounted(() => {
  fetchTags()
  fetchProducts()
})
</script>

<template>
  <div class="home-container">
    <div class="hero-section text-center">
      <h1 class="hero-title">尋找你在校園所需的一切</h1>
      <p class="hero-subtitle">租借設備、購買二手教科書，並加入我們充滿活力的社群。</p>
      
      <div class="search-bar">
        <input 
          type="text" 
          class="input-control search-input" 
          placeholder="搜尋商品名稱..." 
          v-model="searchQuery"
          @keyup.enter="submitSearch"
        />
        <input 
          type="text" 
          class="input-control search-input" 
          placeholder="賣家標籤 (如：資訊系)" 
          v-model="userTagSearch"
          @keyup.enter="submitSearch"
          style="max-width: 200px;"
        />
        <button class="btn btn-primary" @click="submitSearch">搜尋</button>
      </div>
    </div>

    <div class="filter-section">
      <div class="type-filters">
        <button class="btn btn-sm" :class="selectedType === '' ? 'btn-primary' : 'btn-outline'" @click="setTypeFilter('')">全部</button>
        <button class="btn btn-sm" :class="selectedType === 'rent' ? 'btn-primary' : 'btn-outline'" @click="setTypeFilter('rent')">租借</button>
        <button class="btn btn-sm" :class="selectedType === 'sell' ? 'btn-primary' : 'btn-outline'" @click="setTypeFilter('sell')">購買</button>
      </div>
      <div class="tag-filters">
        <span class="filter-label">熱門標籤:</span>
        <button 
          v-for="tag in tags" 
          :key="tag.id"
          class="tag-btn"
          :class="{ active: selectedTag === tag.name }"
          @click="selectTag(tag.name)"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>載入商品中...</p>
    </div>

    <div v-else-if="products.length === 0" class="empty-state">
      <p>找不到符合條件的商品。</p>
    </div>

    <div v-else class="product-grid">
      <ProductCard 
        v-for="product in products" 
        :key="product.id" 
        :product="product" 
      />
    </div>
  </div>
</template>

<style scoped>
.hero-section {
  text-align: center;
  padding: 4rem 1rem;
  background: linear-gradient(135deg, #e0e7ff 0%, #fbcfe8 100%);
  border-radius: var(--radius);
  margin-bottom: 2rem;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.hero-section h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.hero-section p {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.search-bar {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  border: none;
  box-shadow: var(--shadow);
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.type-filters {
  display: flex;
  gap: 0.5rem;
}

.tag-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: 0.5rem;
}

.tag-btn {
  background-color: white;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
}

.tag-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tag-btn.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 0;
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
