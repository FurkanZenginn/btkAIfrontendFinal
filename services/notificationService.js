import api from './api';
import authService from './authService';

class NotificationService {
  // Bildirimleri getir
  async getNotifications(page = 1, limit = 20) {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        `/notifications?page=${page}&limit=${limit}`,
        token
      );
      return response;
    } catch (error) {
      console.error('Get notifications error:', error);
      return { success: false, error: 'Bildirimler alınırken bir hata oluştu.' };
    }
  }

  // Okunmamış bildirim sayısını getir
  async getUnreadCount() {
    try {
      const token = await authService.getToken();
      const response = await api.get('/notifications/unread-count', token);
      return response;
    } catch (error) {
      console.error('Get unread count error:', error);
      return { success: false, count: 0 };
    }
  }

  // Bildirimi okundu olarak işaretle
  async markAsRead(notificationId) {
    try {
      const token = await authService.getToken();
      const response = await api.put(
        `/notifications/${notificationId}/read`,
        {},
        token
      );
      return response;
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: 'Bildirim işaretlenirken bir hata oluştu.' };
    }
  }

  // Tüm bildirimleri okundu olarak işaretle
  async markAllAsRead() {
    try {
      const token = await authService.getToken();
      const response = await api.put('/notifications/mark-all-read', {}, token);
      return response;
    } catch (error) {
      console.error('Mark all as read error:', error);
      return { success: false, error: 'Bildirimler işaretlenirken bir hata oluştu.' };
    }
  }

  // Bildirimi sil
  async deleteNotification(notificationId) {
    try {
      const token = await authService.getToken();
      const response = await api.delete(`/notifications/${notificationId}`, token);
      return response;
    } catch (error) {
      console.error('Delete notification error:', error);
      return { success: false, error: 'Bildirim silinirken bir hata oluştu.' };
    }
  }

  // Bildirim türüne göre mesaj oluştur
  getNotificationMessage(notification) {
    switch (notification.type) {
      case 'comment':
        return `${notification.senderName} postunuza yorum yaptı`;
      case 'like':
        return `${notification.senderName} postunuzu beğendi`;
      case 'follow':
        return `${notification.senderName} sizi takip etmeye başladı`;
      case 'hap_bilgi_approved':
        return `Hap bilginiz onaylandı! +${notification.points || 10} puan kazandınız`;
      case 'hap_bilgi_rejected':
        return `Hap bilginiz reddedildi`;
      case 'level_up':
        return `Tebrikler! Seviye ${notification.level} oldunuz`;
      case 'badge_earned':
        return `Yeni rozet kazandınız: ${notification.badgeName}`;
      default:
        return notification.message || 'Yeni bir bildiriminiz var';
    }
  }

  // Bildirim türüne göre ikon getir
  getNotificationIcon(notification) {
    switch (notification.type) {
      case 'comment':
        return 'chatbubble-outline';
      case 'like':
        return 'heart-outline';
      case 'follow':
        return 'person-add-outline';
      case 'hap_bilgi_approved':
        return 'checkmark-circle-outline';
      case 'hap_bilgi_rejected':
        return 'close-circle-outline';
      case 'level_up':
        return 'trending-up-outline';
      case 'badge_earned':
        return 'ribbon-outline';
      default:
        return 'notifications-outline';
    }
  }

  // Bildirim türüne göre renk getir
  getNotificationColor(notification) {
    switch (notification.type) {
      case 'comment':
        return '#3b82f6'; // Blue
      case 'like':
        return '#ef4444'; // Red
      case 'follow':
        return '#10b981'; // Green
      case 'hap_bilgi_approved':
        return '#059669'; // Emerald
      case 'hap_bilgi_rejected':
        return '#dc2626'; // Red
      case 'level_up':
        return '#f59e0b'; // Amber
      case 'badge_earned':
        return '#8b5cf6'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  }
}

export default new NotificationService(); 