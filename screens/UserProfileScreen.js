import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import postsService from '../services/postsService';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_STYLES } from '../utils';

const { width } = Dimensions.get('window');
const photoSize = (width - 30) / 3;

const StatItem = ({ number, label, icon }) => (
  <View style={styles.statItem}>
    <View style={styles.statIconContainer}>
      <Ionicons name={icon} size={20} color={COLORS.primary[500]} />
    </View>
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function UserProfileScreen({ route, navigation }) {
  const { userId, username } = route.params;
  const { user: currentUser, updateFollowingList } = useAuth();
  
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading user profile for userId:', userId);
      
      // Kullanıcı profilini ve postlarını paralel olarak yükle
      const [profileResult, postsResult] = await Promise.all([
        userService.getUserProfile(userId),
        postsService.getUserPosts(userId),
      ]);

      console.log('📥 Profile result:', profileResult);
      console.log('📥 Posts result:', postsResult);

      if (profileResult.success && profileResult.data) {
        const profile = profileResult.data;
        console.log('📊 Profile data:', profile);
        console.log('📊 Is following from backend:', profile.isFollowing);
        console.log('📊 User name from backend:', profile.name);
        console.log('📊 User username from backend:', profile.username);
        console.log('📊 User avatar from backend:', profile.avatar);
        console.log('📊 User avatar URL:', profile.avatarURL);
        console.log('📊 User profile picture:', profile.profilePicture);
        console.log('📊 Full profile object:', JSON.stringify(profile, null, 2));
        
        setUserProfile(profile);
        
        // Backend'den gelen isFollowing değerini doğrudan kullan
        const followingStatus = profile.isFollowing === true || profile.isFollowing === false 
          ? profile.isFollowing 
          : false;
        
        console.log('✅ Following status set to:', followingStatus);
        
        setIsFollowing(followingStatus);
        
        // Backend'den gelen followersCount ve followingCount'u doğrudan kullan
        const followersCount = profile.followersCount || 0;
        const followingCount = profile.followingCount || 0;
        
        setFollowersCount(followersCount);
        setFollowingCount(followingCount);
        
        console.log('📊 Follow stats:', {
          followers: followersCount,
          following: followingCount,
          isFollowing: followingStatus
        });
      }

      if (postsResult.success && postsResult.data) {
        setUserPosts(postsResult.data);
      }
    } catch (error) {
      console.error('❌ User profile loading error:', error);
      Alert.alert('Hata', 'Profil bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      console.log('🔗 Follow/Unfollow action for user:', userId);
      console.log('🔗 Current following status:', isFollowing);
      
      const result = await userService.followUser(userId);
      
      if (result.success) {
        // Backend'den gelen isFollowing değerini kullan
        const newFollowingStatus = result.isFollowing;
        console.log('✅ Backend returned following status:', newFollowingStatus);
        
        setIsFollowing(newFollowingStatus);
        
        // Takipçi sayısını güncelle
        if (newFollowingStatus) {
          setFollowersCount(prev => prev + 1);
        } else {
          setFollowersCount(prev => Math.max(0, prev - 1));
        }
        
        // Kullanıcının following listesini güncelle
        updateFollowingList(userId, newFollowingStatus);
        
        console.log('✅ Follow status updated to:', newFollowingStatus);
        console.log('✅ New followers count:', newFollowingStatus ? followersCount + 1 : Math.max(0, followersCount - 1));
        
        // Alert'i kaldır, sadece UI'da göster
        console.log('✅ Action completed successfully');
      } else {
        console.error('❌ Follow action failed:', result.error);
        Alert.alert('Hata', result.error || 'İşlem sırasında bir hata oluştu.');
      }
    } catch (error) {
      console.error('❌ Follow action error:', error);
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handlePostPress = (post) => {
    console.log('📱 Post pressed:', post.id);
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const getInitials = (name) => {
    if (!name) return 'K';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kullanıcı</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kullanıcı</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={COLORS.text.tertiary} />
          <Text style={styles.errorTitle}>Kullanıcı Bulunamadı</Text>
          <Text style={styles.errorText}>Bu kullanıcı mevcut değil veya silinmiş olabilir.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userProfile.name || userProfile.username || username || 'Kullanıcı'}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text.primary} />
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
              // Backend'den gelen avatar URL'sini kullan
              const avatarUrl = userProfile.avatar;
              
              console.log('🎨 Rendering avatar with:', {
                avatar: userProfile.avatar,
                finalAvatarUrl: avatarUrl,
                hasAvatar: !!avatarUrl,
                userProfileKeys: Object.keys(userProfile)
              });
              
              return avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.profilePicture}
                  onError={(error) => {
                    console.log('❌ Avatar image load error:', error);
                    console.log('❌ Avatar URL:', avatarUrl);
                  }}
                  onLoad={() => {
                    console.log('✅ Avatar loaded successfully:', avatarUrl);
                  }}
                />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <Text style={styles.profilePictureInitials}>
                    {getInitials(userProfile.name || userProfile.username || 'Kullanıcı')}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* User Info */}
          <Text style={styles.displayName}>
            {userProfile.name || userProfile.username || username || 'Kullanıcı'}
          </Text>
          <Text style={styles.username}>
            @{userProfile.username || userProfile.name?.toLowerCase().replace(/\s+/g, '') || username || 'kullanici'}
          </Text>
          
          {/* Bio */}
          <Text style={styles.bio}>
            {userProfile.bio || 'Henüz bio eklenmemiş'}
          </Text>
          
          {/* Level and XP */}
          <View style={styles.levelContainer}>
            <View style={styles.levelHeader}>
              <View style={styles.levelInfo}>
                <Ionicons name="trophy" size={20} color={COLORS.warning[500]} />
                <Text style={styles.levelText}>
                  Seviye {userProfile.level || 1} • XP
                </Text>
              </View>
            </View>
            <View style={styles.xpBar}>
              <View 
                style={[
                  styles.xpProgress, 
                  { width: `${Math.min((userProfile.xp || 0) % 100, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.xpText}>
              {(userProfile.xp || 0) % 100}/100 XP
            </Text>
            <Text style={styles.xpText}>
              Sonraki seviyeye {Math.max(100 - ((userProfile.xp || 0) % 100), 0)} XP kaldı
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <StatItem number={userPosts.length} label="Gönderi" icon="document-text" />
            <StatItem number={userProfile.commentsCount || 0} label="Yorum" icon="chatbubble" />
            <StatItem number={userProfile.aiInteractions || 0} label="AI" icon="sparkles" />
          </View>

          {/* Follow Stats */}
          <View style={styles.followStatsContainer}>
            <TouchableOpacity 
              style={styles.followStatItem}
              onPress={() => {
                console.log('👥 Followers button pressed for user:', userId);
                Alert.alert('Takipçiler', `${userProfile.name} kullanıcısının ${followersCount} takipçisi var`);
              }}
            >
              <View style={styles.followStatIconContainer}>
                <Ionicons name="people" size={20} color={COLORS.text.secondary} />
              </View>
              <Text style={styles.followStatNumber}>{formatNumber(followersCount)}</Text>
              <Text style={styles.followStatLabel}>Takipçi</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.followStatItem}
              onPress={() => {
                console.log('👥 Following button pressed for user:', userId);
                Alert.alert('Takip Ettikleri', `${userProfile.name} kullanıcısı ${followingCount} kişiyi takip ediyor`);
              }}
            >
              <View style={styles.followStatIconContainer}>
                <Ionicons name="person-add" size={20} color={COLORS.text.secondary} />
              </View>
              <Text style={styles.followStatNumber}>{formatNumber(followingCount)}</Text>
              <Text style={styles.followStatLabel}>Takip Ettikleri</Text>
            </TouchableOpacity>
          </View>

          {/* Follow/Edit Profile Button */}
          {currentUser?._id !== userId ? (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={handleFollow}
            >
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? 'Takibi Bırak' : 'Takip Et'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editProfileButtonText}>Profili Düzenle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Gönderiler</Text>
          
          {userPosts.length > 0 ? (
            <View style={styles.postsGrid}>
              {userPosts.map((post, index) => (
                <TouchableOpacity
                  key={post._id || index}
                  style={styles.postItem}
                  onPress={() => handlePostPress(post)}
                >
                  {post.imageURL ? (
                    <Image source={{ uri: post.imageURL }} style={styles.postImage} />
                  ) : (
                    <View style={styles.postPlaceholder}>
                      <Ionicons name="document-text-outline" size={24} color={COLORS.text.tertiary} />
                    </View>
                  )}

                  {/* Post overlay bilgileri */}
                  <View style={styles.postOverlay}>
                    <View style={styles.postStats}>
                      <Ionicons name="heart" size={16} color="#fff" />
                      <Text style={styles.postStatText}>{post.likesCount || 0}</Text>
                      <Ionicons name="chatbubble" size={16} color="#fff" />
                      <Text style={styles.postStatText}>{post.commentsCount || 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPosts}>
              <Ionicons name="images-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyPostsTitle}>Henüz Gönderi Yok</Text>
              <Text style={styles.emptyPostsText}>Bu kullanıcı henüz gönderi paylaşmamış.</Text>
            </View>
          )}
                 </View>
       </ScrollView>
     </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONT_STYLES.h3,
    color: '#1f2937',
  },
  moreButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    ...FONT_STYLES.h3,
    color: '#1f2937',
    marginTop: 16,
  },
  errorText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 4,
    borderColor: '#8b5cf6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  profilePicturePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  displayName: {
    ...FONT_STYLES.h2,
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  username: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  bio: {
    ...FONT_STYLES.body,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
  },
  xpBar: {
    width: 200,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  xpText: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    ...FONT_STYLES.h3,
    color: '#1f2937',
    fontWeight: '600',
  },
  statLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  followStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  followStatItem: {
    alignItems: 'center',
  },
  followStatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  followStatNumber: {
    ...FONT_STYLES.h3,
    color: '#1f2937',
    fontWeight: '600',
  },
  followStatLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
  },
  followButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 200,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  followingButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  followButtonText: {
    ...FONT_STYLES.button,
    color: '#fff',
  },
  followingButtonText: {
    color: '#1f2937',
  },
  editProfileButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 200,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  editProfileButtonText: {
    ...FONT_STYLES.button,
    color: '#1f2937',
  },
  postsSection: {
    padding: 20,
  },
  sectionTitle: {
    ...FONT_STYLES.h4,
    color: '#1f2937',
    marginBottom: 16,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  postItem: {
    width: photoSize,
    height: photoSize,
    position: 'relative',
    marginBottom: 2,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  postPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postStatText: {
    ...FONT_STYLES.caption,
    color: '#fff',
    fontWeight: '600',
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPostsTitle: {
    ...FONT_STYLES.h4,
    color: '#1f2937',
    marginTop: 16,
  },
  emptyPostsText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
}); 