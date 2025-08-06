import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import { FONT_STYLES, FONTS, FONT_WEIGHTS, FONT_SIZES } from '../utils/fonts';

const NotificationItem = ({ notification, onPress, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const result = await notificationService.deleteNotification(notification._id);
            setIsDeleting(false);
            if (result.success) {
              onDelete(notification._id);
            } else {
              Alert.alert('Hata', result.error || 'Bildirim silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now - notificationDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes}d`;
    if (diffInHours < 24) return `${diffInHours}s`;
    if (diffInDays < 7) return `${diffInDays}g`;
    return notificationDate.toLocaleDateString('tr-TR');
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification
      ]}
      onPress={() => onPress(notification)}
      disabled={isDeleting}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={notificationService.getNotificationIcon(notification)}
            size={24}
            color={notificationService.getNotificationColor(notification)}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.notificationText}>
            {notificationService.getNotificationMessage(notification)}
          </Text>
          <Text style={styles.timeText}>{getTimeAgo(notification.createdAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Ionicons name="close" size={20} color="#9ca3af" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      const result = await notificationService.getNotifications(page, 20);
      
      if (result.success) {
        if (isRefresh || page === 1) {
          setNotifications(result.data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(result.data.notifications || [])]);
        }
        
        setHasMore((result.data.notifications || []).length === 20);
      } else {
        Alert.alert('Hata', result.error || 'Bildirimler yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      Alert.alert('Hata', 'Bildirimler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadNotifications(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      loadNotifications();
    }
  };

  const handleNotificationPress = async (notification) => {
    // Bildirimi okundu olarak işaretle
    if (!notification.isRead) {
      const result = await notificationService.markAsRead(notification._id);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      }
    }

    // Bildirim türüne göre yönlendirme
    switch (notification.type) {
      case 'comment':
      case 'like':
        // Post detayına git
        if (notification.postId) {
          navigation.navigate('PostDetail', { postId: notification.postId });
        }
        break;
      case 'follow':
        // Kullanıcı profilini aç
        if (notification.senderId) {
          navigation.navigate('UserProfile', { userId: notification.senderId });
        }
        break;
      case 'hap_bilgi_approved':
      case 'hap_bilgi_rejected':
        // Hap bilgi sayfasına git
        navigation.navigate('HapBilgi');
        break;
      default:
        // Varsayılan olarak ana sayfaya git
        navigation.navigate('Home');
    }
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
  };

  const handleMarkAllAsRead = async () => {
    const result = await notificationService.markAllAsRead();
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      Alert.alert('Başarılı', 'Tüm bildirimler okundu olarak işaretlendi');
    } else {
      Alert.alert('Hata', result.error || 'Bildirimler işaretlenirken bir hata oluştu');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyStateTitle}>Henüz bildiriminiz yok</Text>
      <Text style={styles.emptyStateText}>
        Yeni aktiviteler olduğunda burada görünecek
      </Text>
    </View>
  );

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bildirimler</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllText}>Tümünü Okundu İşaretle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
            onDelete={handleDeleteNotification}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...FONT_STYLES.semiBold,
    fontSize: FONT_SIZES.lg,
    color: '#111827',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    ...FONT_STYLES.medium,
    fontSize: FONT_SIZES.sm,
    color: '#8b5cf6',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    ...FONT_STYLES.medium,
    fontSize: FONT_SIZES.base,
    color: '#111827',
    marginBottom: 4,
  },
  timeText: {
    ...FONT_STYLES.regular,
    fontSize: FONT_SIZES.sm,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    ...FONT_STYLES.semiBold,
    fontSize: FONT_SIZES.lg,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...FONT_STYLES.regular,
    fontSize: FONT_SIZES.base,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...FONT_STYLES.medium,
    fontSize: FONT_SIZES.base,
    color: '#6b7280',
    marginTop: 16,
  },
}); 