<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()

const contacts = ref([])
const activeContact = ref(null)
const messages = ref([])
const newMessage = ref('')
const pollingInterval = ref(null)

const fetchContacts = async () => {
  try {
    const res = await api.get('/chat/contacts')
    contacts.value = res.data
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
  }
}

const fetchMessages = async (userId) => {
  if (!userId) return
  try {
    const res = await api.get(`/chat/${userId}`)
    messages.value = res.data
    scrollToBottom()
  } catch (error) {
    console.error('Failed to fetch messages:', error)
  }
}

const selectContact = (contact) => {
  router.push(`/chat/${contact.id}`)
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !activeContact.value) return
  try {
    await api.post('/chat', {
      receiver_id: activeContact.value.id,
      content: newMessage.value
    })
    newMessage.value = ''
    fetchMessages(activeContact.value.id)
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    const container = document.querySelector('.chat-history')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, 100)
}

const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

watch(() => route.params.userId, async (newUserId) => {
  if (newUserId) {
    // Determine active contact
    let contact = contacts.value.find(c => c.id == newUserId)
    if (!contact) {
      // If contact not in list (e.g. first time messaging), we might need to fetch their info
      // For simplicity, we just add a placeholder. A real app would fetch user details.
      contact = { id: newUserId, username: `User #${newUserId}` }
      contacts.value.push(contact)
    }
    activeContact.value = contact
    fetchMessages(newUserId)
  } else {
    activeContact.value = null
    messages.value = []
  }
}, { immediate: true })

onMounted(async () => {
  await fetchContacts()
  if (route.params.userId) {
    let contact = contacts.value.find(c => c.id == route.params.userId)
    if (!contact) {
      contact = { id: route.params.userId, username: `User #${route.params.userId}` }
      contacts.value.push(contact)
    }
    activeContact.value = contact
    fetchMessages(route.params.userId)
  }
  
  // Polling every 3 seconds
  pollingInterval.value = setInterval(() => {
    if (activeContact.value) {
      fetchMessages(activeContact.value.id)
    }
    fetchContacts()
  }, 3000)
})

onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
})
</script>

<template>
  <div class="chat-container card">
    <!-- Sidebar -->
    <div class="sidebar">
      <h2 class="sidebar-title">我的訊息</h2>
      <div v-if="contacts.length === 0" class="no-contacts">
        目前沒有對話紀錄。
      </div>
      <div class="contacts-list" v-else>
        <div 
          v-for="contact in contacts" 
          :key="contact.id" 
          class="contact-item"
          :class="{ active: activeContact && activeContact.id == contact.id }"
          @click="selectContact(contact)"
        >
          <div class="contact-avatar">
            {{ contact.username.charAt(0).toUpperCase() }}
          </div>
          <div class="contact-info">
            <div class="contact-name">@{{ contact.username }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="chat-main">
      <div v-if="!activeContact" class="no-chat-selected">
        <h3>請選擇左側聯絡人開始對話</h3>
      </div>
      <template v-else>
        <div class="chat-header">
          <h3>與 @{{ activeContact.username }} 的對話</h3>
        </div>
        
        <div class="chat-history">
          <div v-if="messages.length === 0" style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">
            向 @{{ activeContact.username }} 打個招呼吧！
          </div>
          <div 
            v-for="msg in messages" 
            :key="msg.id" 
            class="message-bubble-wrapper"
            :class="{ 'mine': msg.sender_id == currentUser.id }"
          >
            <div class="message-bubble">
              {{ msg.content }}
            </div>
          </div>
        </div>

        <form class="chat-input-area" @submit.prevent="sendMessage">
          <input 
            type="text" 
            v-model="newMessage" 
            placeholder="輸入訊息..." 
            class="input-control"
            style="flex: 1; border-radius: 9999px;"
          />
          <button type="submit" class="btn btn-primary" style="border-radius: 9999px; padding: 0.75rem 1.5rem;">
            傳送
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 150px);
  max-height: 800px;
  overflow: hidden;
  margin-top: 1rem;
}

.sidebar {
  width: 300px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
}

@media (max-width: 768px) {
  .sidebar { width: 100px; }
  .contact-info { display: none; }
  .sidebar-title { font-size: 1rem; text-align: center; }
}

.sidebar-title {
  padding: 1.5rem;
  font-size: 1.25rem;
  font-weight: bold;
  border-bottom: 1px solid var(--border-color);
}

.no-contacts {
  padding: 1.5rem;
  color: var(--text-secondary);
  text-align: center;
  font-size: 0.875rem;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  gap: 1rem;
  cursor: pointer;
  transition: var(--transition);
  border-bottom: 1px solid var(--border-color);
}

.contact-item:hover {
  background-color: #f1f5f9;
}

.contact-item.active {
  background-color: #e0e7ff;
  border-left: 4px solid var(--primary-color);
}

.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.contact-name {
  font-weight: 600;
  color: var(--text-primary);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.chat-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: white;
}

.chat-history {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #f8fafc;
}

.message-bubble-wrapper {
  display: flex;
  width: 100%;
}

.message-bubble-wrapper.mine {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background-color: white;
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.message-bubble-wrapper.mine .message-bubble {
  background-color: var(--primary-color);
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.message-bubble-wrapper:not(.mine) .message-bubble {
  border-bottom-left-radius: 0.25rem;
}

.chat-input-area {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 1rem;
  background-color: white;
}
</style>
