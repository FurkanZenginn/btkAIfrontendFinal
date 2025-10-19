import api, { API_ENDPOINTS } from './api';
import authService from './authService';

class MessagesService {
  // Konuşma listesini getir
  async getConversations(page = 1, limit = 20) {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        `${API_ENDPOINTS.MESSAGES.CONVERSATIONS}?page=${page}&limit=${limit}`,
        token
      );
      return response;
    } catch (error) {
      console.error('Get conversations error:', error);
      return { success: false, error: 'Konuşmalar yüklenirken bir hata oluştu.' };
    }
  }

  // Belirli bir konuşmanın mesajlarını getir
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        `${API_ENDPOINTS.MESSAGES.LIST}?conversation_id=${conversationId}&page=${page}&limit=${limit}`,
        token
      );
      return response;
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, error: 'Mesajlar yüklenirken bir hata oluştu.' };
    }
  }

  // Mesaj gönder
  async sendMessage(conversationId, message, messageType = 'text') {
    try {
      const token = await authService.getToken();
      const response = await api.post(
        API_ENDPOINTS.MESSAGES.SEND,
        {
          conversation_id: conversationId,
          message,
          type: messageType,
        },
        token
      );
      return response;
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: 'Mesaj gönderilirken bir hata oluştu.' };
    }
  }

  // Yeni konuşma başlat
  async startConversation(userId, initialMessage = null) {
    try {
      const token = await authService.getToken();
      const response = await api.post(
        '/messages/conversations',
        {
          user_id: userId,
          initial_message: initialMessage,
        },
        token
      );
      return response;
    } catch (error) {
      console.error('Start conversation error:', error);
      return { success: false, error: 'Konuşma başlatılırken bir hata oluştu.' };
    }
  }

  // Konuşmayı sil
  async deleteConversation(conversationId) {
    try {
      const token = await authService.getToken();
      const response = await api.delete(
        `/messages/conversations/${conversationId}`,
        token
      );
      return response;
    } catch (error) {
      console.error('Delete conversation error:', error);
      return { success: false, error: 'Konuşma silinirken bir hata oluştu.' };
    }
  }

  // Mesajı sil
  async deleteMessage(messageId) {
    try {
      const token = await authService.getToken();
      const response = await api.delete(
        `/messages/${messageId}`,
        token
      );
      return response;
    } catch (error) {
      console.error('Delete message error:', error);
      return { success: false, error: 'Mesaj silinirken bir hata oluştu.' };
    }
  }

  // Mesajı düzenle
  async editMessage(messageId, newMessage) {
    try {
      const token = await authService.getToken();
      const response = await api.put(
        `/messages/${messageId}`,
        { message: newMessage },
        token
      );
      return response;
    } catch (error) {
      console.error('Edit message error:', error);
      return { success: false, error: 'Mesaj düzenlenirken bir hata oluştu.' };
    }
  }

  // Mesajı okundu olarak işaretle
  async markAsRead(messageId) {
    try {
      const token = await authService.getToken();
      const response = await api.post(
        `/messages/${messageId}/read`,
        {},
        token
      );
      return response;
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: 'Mesaj okundu olarak işaretlenirken bir hata oluştu.' };
    }
  }

  // Konuşmayı okundu olarak işaretle
  async markConversationAsRead(conversationId) {
    try {
      const token = await authService.getToken();
      const response = await api.post(
        `/messages/conversations/${conversationId}/read`,
        {},
        token
      );
      return response;
    } catch (error) {
      console.error('Mark conversation as read error:', error);
      return { success: false, error: 'Konuşma okundu olarak işaretlenirken bir hata oluştu.' };
    }
  }

  // Medya mesajı gönder (resim, video, ses)
  async sendMediaMessage(conversationId, mediaFile, messageType = 'image') {
    try {
      const token = await authService.getToken();
      
      // FormData oluştur
      const formData = new FormData();
      formData.append('conversation_id', conversationId);
      formData.append('type', messageType);
      // ✅ BACKEND KONFIGÜRASYONUNA GÖRE: Sadece 'media' alanı kullan
      formData.append('media', {
        uri: mediaFile.uri,
        type: mediaFile.type,
        name: mediaFile.name,
      });

      // Custom headers for multipart/form-data
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      const response = await api.post(
        API_ENDPOINTS.MESSAGES.SEND,
        formData,
        token,
        headers
      );
      
      return response;
    } catch (error) {
      console.error('Send media message error:', error);
      return { success: false, error: 'Medya mesajı gönderilirken bir hata oluştu.' };
    }
  }

  // Kullanıcı arama (mesajlaşma için)
  async searchUsers(query, page = 1, limit = 20) {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        `/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
        token
      );
      return response;
    } catch (error) {
      console.error('Search users error:', error);
      return { success: false, error: 'Kullanıcı arama yapılırken bir hata oluştu.' };
    }
  }

  // Okunmamış mesaj sayısını getir
  async getUnreadCount() {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        '/messages/unread-count',
        token
      );
      return response;
    } catch (error) {
      console.error('Get unread count error:', error);
      return { success: false, error: 'Okunmamış mesaj sayısı alınırken bir hata oluştu.' };
    }
  }

  // Konuşma ayarlarını güncelle
  async updateConversationSettings(conversationId, settings) {
    try {
      const token = await authService.getToken();
      const response = await api.put(
        `/messages/conversations/${conversationId}/settings`,
        settings,
        token
      );
      return response;
    } catch (error) {
      console.error('Update conversation settings error:', error);
      return { success: false, error: 'Konuşma ayarları güncellenirken bir hata oluştu.' };
    }
  }
}

export default new MessagesService(); 