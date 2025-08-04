import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSavedPosts } from '../contexts/SavedPostsContext';
import userService from '../services/userService';
import followService from '../services/followService';
import postsService from '../services/postsService';

const { width } = Dimensions.get('window');
const photoSize = (width - 30) / 3; // 3 photos per row with minimal margins

const StatItem = ({ number, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const BadgeItem = ({ badge }) => (
  <View style={styles.badgeItem}>
    <Text style={styles.badgeIcon}>{badge.icon}</Text>
    <Text style={styles.badgeName}>{badge.name}</Text>
    <Text style={styles.badgeDescription}>{badge.description}</Text>
  </View>
);

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { savedPosts, unsavePost, triggerPostDeleted } = useSavedPosts();
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'saved', 'badges'
  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userLevel, setUserLevel] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followStats, setFollowStats] = useState({
    followers: 0,
    following: 0,
    isFollowing: false
  });
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const handleLogout = () => {
    console.log('🔐 Logout button pressed');
    logout();
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Tüm profil bilgileri tek seferde getir (gamification dahil)
      const profileResult = await userService.getProfile();
      console.log('📊 Profile data result:', profileResult);
      
      if (profileResult.success) {
        // Veri çift sarmalanmış, data.data şeklinde geliyor
        const { user, stats, recentActivity } = profileResult.data.data;
        
        console.log('📊 Extracted user data:', user);
        console.log('📊 User avatar from backend:', user?.avatar);
        
        // Profil bilgileri
        setProfileData(user);
        
        // İstatistikler
        setUserStats(stats);
        
        // Seviye ve XP bilgileri
        setUserLevel({
          level: user.level,
          xp: user.xp,
          xpToNext: user.xpToNext
        });
        
        // Rozetler
        setUserBadges(user.badges || []);
        
        // Takip istatistikleri - Backend'den gelen verilerle güncelle
        setFollowStats({
          followers: user.followersCount || 0,
          following: user.followingCount || 0,
          isFollowing: false // Kendi profilinde her zaman false
        });
        
        console.log('📊 Follow stats updated:', {
          followers: user.followersCount,
          following: user.followingCount
        });
      }
    } catch (error) {
      console.error('❌ Profil verileri yüklenirken hata:', error);
      // Hata durumunda mevcut user verilerini kullan
      if (user) {
        setProfileData(user);
        setFollowStats({
          followers: user.followersCount || 0,
          following: user.followingCount || 0,
          isFollowing: false
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 ProfileScreen useEffect triggered');
    console.log('🔄 Current user data:', { name: user?.name, avatar: user?.avatar });
    loadProfileData();
    loadUserPosts();
  }, [user?.name, user?.avatar]); // Kullanıcı bilgileri değiştiğinde yeniden yükle

  // Focus listener - sayfa her odaklandığında post'ları yenile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 ProfileScreen focused, refreshing posts...');
      loadUserPosts();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
    loadUserPosts();
  };

  const handlePostPress = (post) => {
    console.log('📱 Post pressed:', post.id);
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const handleBookmarkPress = async (post) => {
    try {
      const result = await unsavePost(post.id);
      if (result.success) {
        Alert.alert('Başarılı', 'Post kaydedilenlerden çıkarıldı.');
        // Sayfayı yenile
        onRefresh();
      }
    } catch (error) {
      console.error('Bookmark hatası:', error);
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    }
  };

  const showDeleteModal = (post) => {
    setPostToDelete(post);
    setDeleteModalVisible(true);
  };

  const hideDeleteModal = () => {
    setDeleteModalVisible(false);
    setPostToDelete(null);
    setDeleteLoading(false);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      setDeleteLoading(true);
      console.log('🗑️ Deleting post:', postToDelete.id);
      console.log('🗑️ Post to delete:', postToDelete);
      
      const result = await postsService.deletePost(postToDelete.id);
      console.log('🗑️ Delete result:', result);
      
      if (result.success) {
        console.log('🗑️ Delete successful, updating UI...');
        
        // Sadece backend başarılı olursa postu kaldır
        setUserPosts(prevPosts => {
          const newPosts = prevPosts.filter(p => p.id !== postToDelete.id);
          console.log('🗑️ Previous posts count:', prevPosts.length);
          console.log('🗑️ New posts count:', newPosts.length);
          return newPosts;
        });
        
        // Modal'ı kapat
        hideDeleteModal();
        
        // Başarı mesajı
        Alert.alert(
          '✅ Başarılı',
          'Post başarıyla silindi!',
          [{ text: 'Tamam', style: 'default' }]
        );
        
        // Global post deleted event'ini tetikle (HomeScreen'i güncelle)
        console.log('🗑️ Triggering global post deleted event...');
        triggerPostDeleted(postToDelete.id);
        
      } else {
        console.error('🗑️ Delete failed:', result.error);
        hideDeleteModal();
        Alert.alert(
          '❌ Silme Başarısız',
          result.error || 'Post silinirken bir hata oluştu. Backend\'de post bulunamadı veya silme yetkiniz yok.',
          [{ text: 'Tamam', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('🗑️ Delete post error:', error);
      hideDeleteModal();
      Alert.alert(
        '❌ Bağlantı Hatası',
        'Post silinirken bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin.',
        [{ text: 'Tamam', style: 'default' }]
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      setLoadingPosts(true);
      console.log('📱 Loading user posts...');
      console.log('📱 Current user ID:', user?._id);
      
      // Geçici çözüm: Tüm post'ları getir ve kullanıcının post'larını filtrele
      const result = await postsService.getPosts();
      
      if (result.success && result.data) {
        console.log('📱 All posts loaded:', result.data);
        
        // Çift data wrapper kontrolü
        const allPosts = result.data?.data?.posts || result.data?.posts || result.data || [];
        console.log('📱 All posts array:', allPosts);
        console.log('📱 All posts length:', allPosts.length);
        
        if (Array.isArray(allPosts)) {
           // Kullanıcının kendi post'larını filtrele
           const userPosts = allPosts.filter(post => {
             const postUserId = post.userId?._id || post.userId;
             const currentUserId = user?._id;
             console.log('📱 Post details:', {
               postId: post._id,
               postUserId: postUserId,
               currentUserId: currentUserId,
               postUserName: post.userId?.name,
               currentUserName: user?.name,
               match: postUserId === currentUserId
             });
             return postUserId === currentUserId;
           });
          
          console.log('📱 Filtered user posts:', userPosts.length);
          
                     const transformedPosts = userPosts.map(post => ({
             id: post._id || post.id,
             postImage: post.imageURL || post.postImage,
             caption: post.caption || '',
             likes: post.likes?.length?.toString() || '0',
             comments: post.commentCount?.toString() || '0',
             isFromAI: post.isFromAI || false,
             // Profil sayfasında kendi post'larımız olduğu için güncel kullanıcı bilgilerini kullan
             username: user?.name || 'Sen',
             userImage: user?.avatar || null, // Fake avatar'ı kaldır
           }));
          
          console.log('📱 Transformed posts:', transformedPosts.length);
          setUserPosts(transformedPosts);
        } else {
          console.log('📱 Posts is not an array:', allPosts);
          setUserPosts([]);
        }
      } else {
        console.log('📱 No posts found');
        setUserPosts([]);
      }
    } catch (error) {
      console.error('📱 Load user posts error:', error);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Kullanıcı adının baş harflerini al
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long' 
    }) + "'den beri";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
             {(() => {
               const avatarUri = profileData?.avatar || user?.avatar;
               console.log('🖼️ Profile picture rendering:', {
                 profileDataAvatar: profileData?.avatar,
                 userAvatar: user?.avatar,
                 finalAvatarUri: avatarUri
               });
               
               return avatarUri ? (
            <Image
                   source={{ uri: avatarUri }}
              style={styles.profilePicture}
            />
               ) : (
            <View style={styles.initialsOverlay}>
                   <Text style={styles.initials}>
                     {getInitials(profileData?.name || user?.name)}
                   </Text>
            </View>
               );
             })()}
          </View>

          {/* User Info */}
          <Text style={styles.displayName}>
            {profileData?.name || user?.name || 'Kullanıcı'}
          </Text>
          <Text style={styles.username}>
            {profileData?.email || user?.email}
          </Text>
          
          {/* Level and XP */}
          {userLevel && (
            <View style={styles.levelContainer}>
              <Text style={styles.levelText}>
                Seviye {userLevel.level} • {userLevel.xp} XP
              </Text>
              <View style={styles.xpBar}>
                <View 
                  style={[
                    styles.xpProgress, 
                    { width: `${(userLevel.xp % 100) || 0}%` }
                  ]} 
                />
              </View>
            </View>
          )}
          
          {/* Join Date */}
          <View style={styles.userDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
              <Text style={styles.detailText}>
                {formatDate(profileData?.createdAt)}
              </Text>
            </View>
          </View>

          {/* Stats */}
          {userStats && (
          <View style={styles.statsContainer}>
              <StatItem number={userStats.postsCreated || 0} label="Gönderi" />
              <StatItem number={userStats.commentsAdded || 0} label="Yorum" />
              <StatItem number={userStats.aiInteractions || 0} label="AI" />
            </View>
          )}

          {/* Follow Stats */}
          <View style={styles.followStatsContainer}>
            <TouchableOpacity 
              style={styles.followStatItem}
              onPress={() => {
                console.log('👥 Followers button pressed');
                // TODO: Takipçiler sayfasına git
                Alert.alert('Takipçiler', `${followStats.followers} takipçiniz var`);
              }}
            >
              <Text style={styles.followStatNumber}>{followStats.followers}</Text>
              <Text style={styles.followStatLabel}>Takipçi</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.followStatItem}
              onPress={() => {
                console.log('👥 Following button pressed');
                // TODO: Takip edilenler sayfasına git
                Alert.alert('Takip Ettikleriniz', `${followStats.following} kişiyi takip ediyorsunuz`);
              }}
            >
              <Text style={styles.followStatNumber}>{followStats.following}</Text>
              <Text style={styles.followStatLabel}>Takip Ettiklerim</Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => {
              console.log('🔧 Profili Düzenle butonuna tıklandı');
              try {
                navigation.navigate('EditProfile');
                console.log('✅ Navigation başarılı');
              } catch (error) {
                console.error('❌ Navigation hatası:', error);
              }
            }}
          >
            <Text style={styles.editProfileText}>Profili Düzenle</Text>
          </TouchableOpacity>

          {/* Follow Button (for other users) */}
          {/* TODO: Başka kullanıcı profili görüntülenirken takip butonu göster */}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons 
              name="grid-outline" 
              size={20} 
              color={activeTab === 'posts' ? "#8b5cf6" : "#9ca3af"} 
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Gönderiler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons 
              name="bookmark-outline" 
              size={20} 
              color={activeTab === 'saved' ? "#8b5cf6" : "#9ca3af"} 
            />
            <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
              Kaydedilenler ({savedPosts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'badges' && styles.activeTab]}
            onPress={() => setActiveTab('badges')}
          >
            <Ionicons 
              name="trophy-outline" 
              size={20} 
              color={activeTab === 'badges' ? "#8b5cf6" : "#9ca3af"} 
            />
            <Text style={[styles.tabText, activeTab === 'badges' && styles.activeTabText]}>
              Rozetler ({userBadges.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'posts' && (
        <View style={styles.photoGrid}>
            {loadingPosts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingText}>Postlar yükleniyor...</Text>
              </View>
            ) : userPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="grid-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>Henüz post yok</Text>
                <Text style={styles.emptyStateText}>
                  İlk postunu oluşturmak için AI Chat'e git!
                </Text>
              </View>
            ) : (
              userPosts.map((post) => (
                <TouchableOpacity 
                  key={post.id} 
                  style={styles.photoContainer}
                  onPress={() => handlePostPress(post)}
                >
                  <Image source={{ uri: post.postImage }} style={styles.photo} />
                  
                                     {/* Silme Butonu */}
                   <TouchableOpacity 
                     style={styles.deletePostButton}
                     onPress={() => showDeleteModal(post)}
                   >
                     <Ionicons name="trash-outline" size={16} color="#fff" />
                   </TouchableOpacity>
                  
                  {/* AI Badge */}
                  {post.isFromAI && (
                    <View style={styles.aiBadgeOverlay}>
                      <Ionicons name="sparkles" size={10} color="#fff" />
                    </View>
                  )}
                  
                  {/* Post Stats Overlay */}
                  <View style={styles.postStatsOverlay}>
                    <View style={styles.postStat}>
                      <Ionicons name="heart" size={10} color="#fff" />
                      <Text style={styles.postStatText}>{post.likes}</Text>
                    </View>
                    <View style={styles.postStat}>
                      <Ionicons name="chatbubble" size={10} color="#fff" />
                      <Text style={styles.postStatText}>{post.comments}</Text>
                    </View>
                  </View>
              </TouchableOpacity>
            ))
            )}
          </View>
        )}

        {activeTab === 'saved' && (
          <View style={styles.photoGrid}>
            {savedPosts.length > 0 ? (
              savedPosts.map((post, index) => (
                <TouchableOpacity 
                  key={post.id} 
                  style={styles.photoContainer}
                  onPress={() => handlePostPress(post)}
                >
                  <Image source={{ uri: post.postImage }} style={styles.photo} />
                  {/* AI Badge */}
                  {post.isFromAI && (
                    <View style={styles.aiBadgeOverlay}>
                      <Ionicons name="sparkles" size={10} color="#fff" />
                    </View>
                  )}
                                     {/* Saved Post Overlay */}
                   <TouchableOpacity 
                     style={styles.savedPostOverlay}
                     onPress={() => handleBookmarkPress(post)}
                   >
                     <Ionicons name="bookmark" size={16} color="#000" />
                   </TouchableOpacity>
                  {/* Post Stats Overlay */}
                  <View style={styles.postStatsOverlay}>
                    <View style={styles.postStat}>
                      <Ionicons name="heart" size={10} color="#fff" />
                      <Text style={styles.postStatText}>{post.likes || '0'}</Text>
                    </View>
                    <View style={styles.postStat}>
                      <Ionicons name="chatbubble" size={10} color="#fff" />
                      <Text style={styles.postStatText}>{post.comments || '0'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bookmark-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>Henüz kaydedilen post yok</Text>
                <Text style={styles.emptyStateText}>
                  Beğendiğin post'ları kaydetmek için bookmark butonuna tıkla
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'badges' && (
          <View style={styles.badgesContainer}>
            {userBadges.length > 0 ? (
              userBadges.map((badge, index) => (
                <BadgeItem key={index} badge={badge} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>Henüz rozet yok</Text>
                <Text style={styles.emptyStateText}>
                  Aktif ol ve rozetler kazan!
                </Text>
              </View>
          )}
        </View>
                 )}
      </ScrollView>

       {/* Modern Silme Modal */}
       <Modal
         visible={deleteModalVisible}
         transparent={true}
         animationType="fade"
         onRequestClose={hideDeleteModal}
       >
         <View style={styles.modalOverlay}>
           <View style={styles.deleteModal}>
             {/* Modal Header */}
             <View style={styles.modalHeader}>
               <View style={styles.modalIconContainer}>
                 <Ionicons name="warning" size={32} color="#ef4444" />
               </View>
               <Text style={styles.modalTitle}>Postu Sil</Text>
               <Text style={styles.modalSubtitle}>
                 Bu postu kalıcı olarak silmek istediğinizden emin misiniz?
               </Text>
             </View>

             {/* Modal Content */}
             <View style={styles.modalContent}>
               <Text style={styles.modalWarning}>
                 ⚠️ Bu işlem geri alınamaz ve post tüm platformdan kaldırılacaktır.
               </Text>
             </View>

             {/* Modal Actions */}
             <View style={styles.modalActions}>
               <TouchableOpacity 
                 style={[styles.modalButton, styles.cancelButton]}
                 onPress={hideDeleteModal}
                 disabled={deleteLoading}
               >
                 <Text style={styles.cancelButtonText}>İptal</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                 style={[styles.modalButton, styles.deleteButton, deleteLoading && styles.disabledButton]}
                 onPress={handleDeletePost}
                 disabled={deleteLoading}
               >
                 {deleteLoading ? (
                   <ActivityIndicator size="small" color="#fff" />
                 ) : (
                   <>
                     <Ionicons name="trash" size={16} color="#fff" />
                     <Text style={styles.deleteButtonText}>Sil</Text>
                   </>
                 )}
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 35 : 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  initialsOverlay: {
    width: 100,
    height: 100,
    backgroundColor: '#8b5cf6',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 15,
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  xpBar: {
    width: 200,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  editProfileButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 20,
  },
  followStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  followStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  followStatLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#8b5cf6',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 3,
  },
  photoContainer: {
    width: photoSize,
    height: photoSize,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  savedPostOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgesContainer: {
    padding: 20,
  },
  badgeItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  aiBadgeOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderRadius: 8,
    padding: 3,
  },
  postStatsOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    gap: 4,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  postStatText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
     deletePostButton: {
     position: 'absolute',
     top: 6,
     right: 6,
     backgroundColor: 'rgba(239, 68, 68, 0.9)',
     borderRadius: 12,
     padding: 6,
     zIndex: 10,
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 2,
     },
     shadowOpacity: 0.25,
     shadowRadius: 3.84,
     elevation: 5,
   },
   
   // Modal Styles
   modalOverlay: {
     flex: 1,
     backgroundColor: 'rgba(0, 0, 0, 0.5)',
     justifyContent: 'center',
     alignItems: 'center',
   },
   deleteModal: {
     backgroundColor: '#fff',
     borderRadius: 20,
     padding: 24,
     margin: 20,
     width: '85%',
     maxWidth: 400,
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 10,
     },
     shadowOpacity: 0.25,
     shadowRadius: 20,
     elevation: 10,
   },
   modalHeader: {
     alignItems: 'center',
     marginBottom: 20,
   },
   modalIconContainer: {
     width: 60,
     height: 60,
     borderRadius: 30,
     backgroundColor: 'rgba(239, 68, 68, 0.1)',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 16,
   },
   modalTitle: {
     fontSize: 24,
     fontWeight: 'bold',
     color: '#000',
     marginBottom: 8,
   },
   modalSubtitle: {
     fontSize: 16,
     color: '#6b7280',
     textAlign: 'center',
     lineHeight: 22,
   },
   modalContent: {
     marginBottom: 24,
   },
   modalWarning: {
     fontSize: 14,
     color: '#ef4444',
     textAlign: 'center',
     lineHeight: 20,
     backgroundColor: 'rgba(239, 68, 68, 0.1)',
     padding: 12,
     borderRadius: 8,
   },
   modalActions: {
     flexDirection: 'row',
     gap: 12,
   },
   modalButton: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 14,
     paddingHorizontal: 20,
     borderRadius: 12,
     gap: 8,
   },
   cancelButton: {
     backgroundColor: '#f3f4f6',
     borderWidth: 1,
     borderColor: '#e5e7eb',
   },
   cancelButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#6b7280',
   },
   deleteButton: {
     backgroundColor: '#ef4444',
   },
   deleteButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#fff',
   },
   disabledButton: {
     opacity: 0.6,
  },
});