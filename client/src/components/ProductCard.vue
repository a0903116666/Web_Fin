<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const viewDetails = () => {
  router.push(`/product/${props.product.id}`)
}
</script>

<template>
  <div class="card product-card" @click="viewDetails">
    <div class="image-container">
      <img :src="product.image_url" :alt="product.title" loading="lazy" />
      <span class="type-badge" :class="product.type">
        {{ product.type === 'rent' ? '租借' : '販售' }}
      </span>
    </div>
    <div class="card-content">
      <div class="tags">
        <span v-for="tag in product.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <h3 class="title">{{ product.title }}</h3>
      <div class="price-container">
        <span class="price">${{ product.price }}</span>
        <span v-if="product.type === 'rent'" class="deposit">
          + ${{ product.deposit }} 押金/日
        </span>
      </div>
      <div class="seller-info">
        <span class="seller">@{{ product.seller_name }}</span>
        <span class="help-score" title="人情積分">🤝 {{ product.help_score }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.image-container {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 Aspect Ratio */
  background-color: #f1f5f9;
}

.image-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.type-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.type-badge.rent {
  background-color: var(--secondary-color);
}

.type-badge.sell {
  background-color: var(--primary-color);
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.4;
  color: var(--text-primary);
  flex: 1;
}

.price-container {
  margin-bottom: 1rem;
}

.price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
}

.deposit {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.seller-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.help-score {
  color: #d97706; /* Amber 600 */
  font-weight: 600;
}
</style>
