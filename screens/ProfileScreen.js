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

const StatItem = ({ number, label, icon }) => (
  <View style={styles.statItem}>
    <View style={styles.statIconContainer}>
      <Ionicons name={icon} size={20} color="#8b5cf6" />
    </View>
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
  const { user, logout, loadFollowingList } = useAuth();
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
  const [xpInfoModalVisible, setXpInfoModalVisible] = useState(false);
  const [xpWaysModalVisible, setXpWaysModalVisible] = useState(false);
  const [levelRewardsModalVisible, setLevelRewardsModalVisible] = useState(false);
  
  const handleLogout = () => {
    console.log('🔐 Logout button pressed');
    logout();
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading profile data...');
      
      // Tüm profil bilgileri tek seferde getir (gamification dahil)
      const profileResult = await userService.getProfile();
      console.log('📊 Profile data result:', profileResult);
      
      if (profileResult.success && profileResult.data) {
        // Veri formatını kontrol et
        let userData, statsData;
        
        if (profileResult.data.data) {
          // Çift sarmalanmış veri
          const { user, stats, recentActivity } = profileResult.data.data;
          userData = user;
          statsData = stats;
        } else if (profileResult.data.user) {
          // Tek sarmalanmış veri
          userData = profileResult.data.user;
          statsData = profileResult.data.stats;
        } else {
          // Direkt veri
          userData = profileResult.data;
          statsData = profileResult.data.stats;
        }
        
        console.log('📊 Extracted user data:', userData);
        console.log('📊 User avatar from backend:', userData?.avatar);
        
        // Profil bilgileri
        setProfileData(userData);
        
        // İstatistikler
        setUserStats(statsData || {});
        
        // Seviye ve XP bilgileri - NaN kontrolü ekle
        const userXP = parseInt(userData.xp) || 0;
        const userLevelNum = parseInt(userData.level) || 1;
        
        setUserLevel({
          level: userLevelNum,
          xp: userXP,
          xpToNext: userData.xpToNext || (100 - (userXP % 100))
        });
        
        // Rozetler
        setUserBadges(userData.badges || []);
        
        // Takip istatistikleri - Backend'den gelen stats verilerini kullan
        const followersCount = statsData?.followersCount || userData.followersCount || 0;
        const followingCount = statsData?.followingCount || userData.followingCount || 0;
        
        setFollowStats({
          followers: followersCount,
          following: followingCount,
          isFollowing: false // Kendi profilinde her zaman false
        });
        
        console.log('📊 Follow stats updated from backend stats:', {
          followers: followersCount,
          following: followingCount,
          userFollowingList: userData.following
        });
      } else {
        console.error('❌ Profile result not successful:', profileResult);
        // Hata durumunda mevcut user verilerini kullan
        if (user) {
          setProfileData(user);
          setFollowStats({
            followers: user.followersCount || 0,
            following: user.followingCount || 0,
            isFollowing: false
          });
        }
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
      console.log('✅ Profile data loading completed, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 ProfileScreen useEffect triggered');
    console.log('🔄 Current user data:', { name: user?.name, avatar: user?.avatar });
    
    if (user?._id) {
      loadProfileData();
      loadUserPosts();
      
      // Following listesini backend'den yükle
      loadFollowingList();
    }
  }, [user?._id]); // Sadece user ID değiştiğinde yeniden yükle

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
    if (!deleteLoading) {
      setDeleteModalVisible(false);
      setPostToDelete(null);
      setDeleteLoading(false);
    }
  };

  // XP Info Functions
  const showXPInfo = () => {
    setXpInfoModalVisible(true);
  };

  const showXPWays = () => {
    setXpWaysModalVisible(true);
  };

  const showLevelRewards = () => {
    setLevelRewardsModalVisible(true);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      setDeleteLoading(true);
      console.log('🗑️ Deleting post:', postToDelete.id);
      console.log('🗑️ Post to delete:', postToDelete);
      
      // Timeout ile API çağrısı
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('İşlem zaman aşımına uğradı')), 10000)
      );
      
      const deletePromise = postsService.deletePost(postToDelete.id);
      const result = await Promise.race([deletePromise, timeoutPromise]);
      
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
      
      let errorMessage = 'Post silinirken bir hata oluştu.';
      if (error.message === 'İşlem zaman aşımına uğradı') {
        errorMessage = 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.';
      }
      
      Alert.alert(
        '❌ Silme Başarısız',
        errorMessage,
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
        <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Profil</Text>
          <Text style={styles.headerSubtitle}>Kişisel bilgileriniz</Text>
        </View>
        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
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
             
             {/* Edit Profile Icon */}
             <TouchableOpacity 
               style={styles.editProfileIcon}
               onPress={() => navigation.navigate('EditProfile')}
             >
               <Ionicons name="camera" size={16} color="#fff" />
             </TouchableOpacity>
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
              <View style={styles.levelHeader}>
                <View style={styles.levelInfo}>
                  <Ionicons name="trophy" size={20} color="#f59e0b" />
                  <Text style={styles.levelText}>
                    Seviye {userLevel.level} • {userLevel.xp} XP
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={() => showXPInfo()}
                >
                  <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              {/* XP Progress Bar */}
              <View style={styles.xpBarContainer}>
                <View style={styles.xpBar}>
                  <View 
                    style={[
                      styles.xpProgress, 
                      { width: `${Math.min((userLevel.xp % 100) || 0, 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.xpProgressText}>
                  {(userLevel.xp % 100) || 0}/100 XP
                </Text>
              </View>
              
              <Text style={styles.xpText}>
                Sonraki seviyeye {Math.max(100 - ((userLevel.xp % 100) || 0), 0)} XP kaldı
              </Text>
              
              {/* XP Actions */}
              <View style={styles.xpActions}>
                <TouchableOpacity 
                  style={styles.xpActionButton}
                  onPress={() => showXPWays()}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#8b5cf6" />
                  <Text style={styles.xpActionText}>XP Kazan</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.xpActionButton}
                  onPress={() => showLevelRewards()}
                >
                  <Ionicons name="gift-outline" size={16} color="#f59e0b" />
                  <Text style={styles.xpActionText}>Ödüller</Text>
                </TouchableOpacity>
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
              <StatItem number={userStats.postsCreated || 0} label="Gönderi" icon="create-outline" />
              <StatItem number={userStats.commentsAdded || 0} label="Yorum" icon="chatbubble-outline" />
              <StatItem number={userStats.aiInteractions || 0} label="AI" icon="sparkles-outline" />
            </View>
          )}

          {/* Follow Stats */}
          <View style={styles.followStatsContainer}>
            <TouchableOpacity 
              style={styles.followStatItem}
              onPress={() => {
                console.log('👥 Followers button pressed');
                Alert.alert('Takipçiler', `${followStats.followers} takipçiniz var`);
              }}
            >
              <View style={styles.followStatContent}>
                <Ionicons name="people-outline" size={16} color="#6b7280" />
                <Text style={styles.followStatNumber}>{followStats.followers}</Text>
                <Text style={styles.followStatLabel}>Takipçi</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.followStatsDivider} />
            <TouchableOpacity 
              style={styles.followStatItem}
              onPress={() => {
                console.log('👥 Following button pressed');
                Alert.alert('Takip Ettikleriniz', `${followStats.following} kişiyi takip ediyorsunuz`);
              }}
            >
              <View style={styles.followStatContent}>
                <Ionicons name="person-add-outline" size={16} color="#6b7280" />
                <Text style={styles.followStatNumber}>{followStats.following}</Text>
                <Text style={styles.followStatLabel}>Takip Ettiklerim</Text>
              </View>
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
            <Ionicons name="settings-outline" size={18} color="#8b5cf6" />
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
            {activeTab === 'posts' && <View style={styles.activeTabIndicator} />}
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
            {activeTab === 'saved' && <View style={styles.activeTabIndicator} />}
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
         onRequestClose={() => !deleteLoading && hideDeleteModal()}
       >
         <TouchableOpacity 
           style={styles.modalOverlay}
           activeOpacity={1}
           onPress={() => !deleteLoading && hideDeleteModal()}
         >
           <TouchableOpacity 
             style={styles.deleteModal}
             activeOpacity={1}
             onPress={() => {}} // Modal içine tıklamayı engelle
           >
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
                 onPress={() => !deleteLoading && hideDeleteModal()}
                 disabled={deleteLoading}
               >
                 <Text style={[styles.cancelButtonText, deleteLoading && styles.disabledText]}>İptal</Text>
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
           </TouchableOpacity>
         </TouchableOpacity>
       </Modal>

       {/* XP Info Modal */}
       <Modal
         visible={xpInfoModalVisible}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setXpInfoModalVisible(false)}
       >
         <TouchableOpacity 
           style={styles.modalOverlay}
           activeOpacity={1}
           onPress={() => setXpInfoModalVisible(false)}
         >
           <TouchableOpacity 
             style={styles.xpInfoModal}
             activeOpacity={1}
             onPress={() => {}}
           >
             <View style={styles.modalHeader}>
               <Ionicons name="trophy" size={32} color="#f59e0b" />
               <Text style={styles.modalTitle}>XP Sistemi</Text>
               <Text style={styles.modalSubtitle}>
                 Deneyim puanları ile seviye atlayın ve ödüller kazanın!
               </Text>
             </View>

             <View style={styles.modalContent}>
               <View style={styles.xpInfoItem}>
                 <Ionicons name="star" size={20} color="#8b5cf6" />
                 <View style={styles.xpInfoText}>
                   <Text style={styles.xpInfoTitle}>Seviye Sistemi</Text>
                   <Text style={styles.xpInfoDescription}>
                     Her 100 XP'de bir seviye atlarsınız. Seviye arttıkça daha fazla özellik açılır.
                   </Text>
                 </View>
               </View>

               <View style={styles.xpInfoItem}>
                 <Ionicons name="trending-up" size={20} color="#22c55e" />
                 <View style={styles.xpInfoText}>
                   <Text style={styles.xpInfoTitle}>XP Kazanma</Text>
                   <Text style={styles.xpInfoDescription}>
                     Post paylaşın, yorum yapın, AI ile etkileşime geçin ve günlük görevleri tamamlayın.
                   </Text>
                 </View>
               </View>

               <View style={styles.xpInfoItem}>
                 <Ionicons name="gift" size={20} color="#f59e0b" />
                 <View style={styles.xpInfoText}>
                   <Text style={styles.xpInfoTitle}>Ödüller</Text>
                   <Text style={styles.xpInfoDescription}>
                     Her seviyede özel rozetler, profil temaları ve premium özellikler kazanın.
                   </Text>
                 </View>
               </View>
             </View>

             <TouchableOpacity 
               style={styles.modalButton}
               onPress={() => setXpInfoModalVisible(false)}
             >
               <Text style={styles.modalButtonText}>Anladım</Text>
             </TouchableOpacity>
           </TouchableOpacity>
         </TouchableOpacity>
       </Modal>

       {/* XP Ways Modal */}
       <Modal
         visible={xpWaysModalVisible}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setXpWaysModalVisible(false)}
       >
         <TouchableOpacity 
           style={styles.modalOverlay}
           activeOpacity={1}
           onPress={() => setXpWaysModalVisible(false)}
         >
           <TouchableOpacity 
             style={styles.xpWaysModal}
             activeOpacity={1}
             onPress={() => {}}
           >
             <View style={styles.modalHeader}>
               <Ionicons name="add-circle" size={32} color="#8b5cf6" />
               <Text style={styles.modalTitle}>XP Kazanma Yolları</Text>
               <Text style={styles.modalSubtitle}>
                 Deneyim puanlarınızı artırmak için yapabilecekleriniz:
               </Text>
             </View>

             <View style={styles.modalContent}>
               {[
                 { icon: 'create', title: 'Post Paylaş', xp: '+10 XP', color: '#22c55e' },
                 { icon: 'chatbubble', title: 'Yorum Yap', xp: '+5 XP', color: '#3b82f6' },
                 { icon: 'heart', title: 'Beğeni Ver', xp: '+2 XP', color: '#ef4444' },
                 { icon: 'sparkles', title: 'AI Kullan', xp: '+15 XP', color: '#8b5cf6' },
                 { icon: 'calendar', title: 'Günlük Giriş', xp: '+5 XP', color: '#f59e0b' },
                 { icon: 'people', title: 'Takip Et', xp: '+3 XP', color: '#06b6d4' },
               ].map((item, index) => (
                 <View key={index} style={styles.xpWayItem}>
                   <View style={[styles.xpWayIcon, { backgroundColor: item.color + '20' }]}>
                     <Ionicons name={item.icon} size={20} color={item.color} />
                   </View>
                   <View style={styles.xpWayText}>
                     <Text style={styles.xpWayTitle}>{item.title}</Text>
                   </View>
                   <Text style={[styles.xpWayXP, { color: item.color }]}>{item.xp}</Text>
                 </View>
               ))}
             </View>

             <TouchableOpacity 
               style={styles.modalButton}
               onPress={() => setXpWaysModalVisible(false)}
             >
               <Text style={styles.modalButtonText}>Tamam</Text>
             </TouchableOpacity>
           </TouchableOpacity>
         </TouchableOpacity>
       </Modal>

       {/* Level Rewards Modal */}
       <Modal
         visible={levelRewardsModalVisible}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setLevelRewardsModalVisible(false)}
       >
         <TouchableOpacity 
           style={styles.modalOverlay}
           activeOpacity={1}
           onPress={() => setLevelRewardsModalVisible(false)}
         >
           <TouchableOpacity 
             style={styles.levelRewardsModal}
             activeOpacity={1}
             onPress={() => {}}
           >
             <View style={styles.modalHeader}>
               <Ionicons name="gift" size={32} color="#f59e0b" />
               <Text style={styles.modalTitle}>Seviye Ödülleri</Text>
               <Text style={styles.modalSubtitle}>
                 Seviye atladıkça kazanacağınız ödüller:
               </Text>
             </View>

             <View style={styles.modalContent}>
               {[
                 { level: 1, reward: 'Başlangıç Rozeti', unlocked: true },
                 { level: 2, reward: 'Profil Teması', unlocked: userLevel?.level >= 2 },
                 { level: 3, reward: 'Özel Emoji Seti', unlocked: userLevel?.level >= 3 },
                 { level: 5, reward: 'Premium Özellikler', unlocked: userLevel?.level >= 5 },
                 { level: 10, reward: 'VIP Rozet', unlocked: userLevel?.level >= 10 },
               ].map((item, index) => (
                 <View key={index} style={styles.rewardItem}>
                   <View style={styles.rewardIcon}>
                     <Ionicons 
                       name={item.unlocked ? "checkmark-circle" : "lock-closed"} 
                       size={24} 
                       color={item.unlocked ? "#22c55e" : "#9ca3af"} 
                     />
                   </View>
                   <View style={styles.rewardText}>
                     <Text style={styles.rewardTitle}>Seviye {item.level}</Text>
                     <Text style={styles.rewardDescription}>{item.reward}</Text>
                   </View>
                   <View style={styles.rewardStatus}>
                     <Text style={[
                       styles.rewardStatusText, 
                       { color: item.unlocked ? "#22c55e" : "#9ca3af" }
                     ]}>
                       {item.unlocked ? "Kazanıldı" : "Kilitli"}
                     </Text>
                   </View>
                 </View>
               ))}
             </View>

             <TouchableOpacity 
               style={styles.modalButton}
               onPress={() => setLevelRewardsModalVisible(false)}
             >
               <Text style={styles.modalButtonText}>Tamam</Text>
             </TouchableOpacity>
           </TouchableOpacity>
         </TouchableOpacity>
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
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 35 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#f3f4f6',
  },
  initialsOverlay: {
    width: 120,
    height: 120,
    backgroundColor: '#8b5cf6',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#f3f4f6',
  },
  editProfileIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
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
    marginBottom: 20,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  infoButton: {
    padding: 4,
  },
  xpBarContainer: {
    width: '100%',
    marginBottom: 8,
  },
  xpBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 6,
  },
  xpProgressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  xpText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  xpActions: {
    flexDirection: 'row',
    gap: 12,
  },
  xpActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  xpActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  editProfileButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editProfileText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
  followStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
  },
  followStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  followStatContent: {
    alignItems: 'center',
    gap: 4,
  },
  followStatsDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f3f4f6',
  },
  followStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  followStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: 8,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 3,
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8b5cf6',
    fontWeight: '600',
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
  disabledText: {
    opacity: 0.6,
  },
  // XP Modal Styles
  xpInfoModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  xpWaysModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  levelRewardsModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  xpInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  xpInfoText: {
    flex: 1,
  },
  xpInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  xpInfoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  xpWayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  xpWayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpWayText: {
    flex: 1,
  },
  xpWayTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  xpWayXP: {
    fontSize: 14,
    fontWeight: '600',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardText: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  rewardDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  rewardStatus: {
    alignItems: 'flex-end',
  },
  rewardStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});