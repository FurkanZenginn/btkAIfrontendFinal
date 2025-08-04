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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import postsService from '../services/postsService';
import { FONT_STYLES, FONTS, FONT_WEIGHTS, FONT_SIZES } from '../utils/fonts';

const { width } = Dimensions.get('window');
const photoSize = (width - 30) / 3; // 3 photos per row with minimal margins

const StatItem = ({ number, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function UserProfileScreen({ route, navigation }) {
  const { userId, username } = route.params;
  const { user: currentUser } = useAuth();
  
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
        
        setUserProfile(profile);
        
        // Backend'den gelen isFollowing değerini doğrudan kullan
        const followingStatus = profile.isFollowing === true || profile.isFollowing === false 
          ? profile.isFollowing 
          : false;
        
        console.log('✅ Following status set to:', followingStatus);
        
        setIsFollowing(followingStatus);
        
        setFollowersCount(profile.followersCount || 0);
        setFollowingCount(profile.followingCount || 0);
        
        console.log('📊 Follow stats:', {
          followers: profile.followersCount,
          following: profile.followingCount,
          isFollowing: followingStatus
        });
      }

      if (postsResult.success && postsResult.data) {
        setUserPosts(postsResult.data);
      }

    } catch (error) {
      console.error('❌ Kullanıcı profili yüklenirken hata:', error);
      Alert.alert('Hata', 'Kullanıcı profili yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      console.log('🔗 Follow button pressed for userId:', userId);
      console.log('🔗 Current isFollowing state:', isFollowing);
      
      const result = await userService.followUser(userId);
      console.log('🔗 Follow operation result:', result);
      
      if (result.success) {
        // Backend'den gelen isFollowing durumunu kullan
        const newFollowingState = result.isFollowing;
        setIsFollowing(newFollowingState);
        
        // Takipçi sayısını güncelle
        setFollowersCount(prev => {
          const newCount = newFollowingState ? prev + 1 : prev - 1;
          console.log('📊 Followers count updated:', { prev, newCount, newFollowingState });
          return newCount;
        });
        
        console.log('✅ Follow state updated:', { 
          newFollowingState, 
          newFollowersCount: newFollowingState ? followersCount + 1 : followersCount - 1 
        });
        
        Alert.alert(
          'Başarılı',
          newFollowingState ? 'Kullanıcı takip edildi' : 'Takip bırakıldı'
        );
      } else {
        console.error('❌ Follow operation failed:', result.error);
        Alert.alert('Hata', result.error || 'İşlem başarısız oldu.');
      }
    } catch (error) {
      console.error('❌ Follow operation error:', error);
      Alert.alert('Hata', 'Takip işlemi sırasında bir hata oluştu.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handlePostPress = (post) => {
    navigation.navigate('PostDetail', { postId: post._id });
  };

  const debugFollowStatus = () => {
    console.log('🔍 Debug Follow Status:');
    console.log('  - Current user ID:', currentUser?._id);
    console.log('  - Target user ID:', userId);
    console.log('  - Is own profile:', currentUser?._id === userId);
    console.log('  - Is following state:', isFollowing);
    console.log('  - Followers count:', followersCount);
    console.log('  - Following count:', followingCount);
    console.log('  - User profile data:', userProfile);
  };

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // Debug için takip durumunu logla
  useEffect(() => {
    if (userProfile) {
      debugFollowStatus();
    }
  }, [userProfile, isFollowing]);

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color="#9ca3af" />
          <Text style={styles.errorTitle}>Kullanıcı Bulunamadı</Text>
          <Text style={styles.errorText}>Bu kullanıcı mevcut değil veya silinmiş olabilir.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userProfile.name || 'Kullanıcı'}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1f2937" />
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
            {userProfile.avatar ? (
              <Image
                source={{ uri: userProfile.avatar }}
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.initialsOverlay}>
                <Text style={styles.initials}>
                  {getInitials(userProfile.name || 'Kullanıcı')}
                </Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <Text style={styles.displayName}>
            {userProfile.name || 'Kullanıcı'}
          </Text>
          <Text style={styles.username}>
            {userProfile.email || 'user@example.com'}
          </Text>
          
          {/* Bio */}
          <Text style={styles.bio}>
            {userProfile.bio || 'Henüz bio eklenmemiş'}
          </Text>
          
          {/* Level and XP */}
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>
              Seviye {userProfile.level || 1} • {userProfile.xp || 0} XP
            </Text>
            <View style={styles.xpBar}>
              <View 
                style={[
                  styles.xpProgress, 
                  { width: `${(userProfile.xp || 0) % 100}%` }
                ]} 
              />
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <StatItem number={userPosts.length} label="Gönderi" />
            <StatItem number={userProfile.commentsCount || 0} label="Yorum" />
            <StatItem number={userProfile.aiInteractions || 0} label="AI" />
          </View>

          {/* Follow Stats */}
          <View style={styles.followStatsContainer}>
            <TouchableOpacity 
              style={styles.followStatItem}
              onPress={() => {
                console.log('👥 Followers button pressed for user:', userId);
                // TODO: Bu kullanıcının takipçileri sayfasına git
                Alert.alert('Takipçiler', `${userProfile.name} kullanıcısının ${followersCount} takipçisi var`);
              }}
            >
              <Text style={styles.followStatNumber}>{formatNumber(followersCount)}</Text>
              <Text style={styles.followStatLabel}>Takipçi</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.followStatItem}
              onPress={() => {
                console.log('👥 Following button pressed for user:', userId);
                // TODO: Bu kullanıcının takip ettikleri sayfasına git
                Alert.alert('Takip Ettikleri', `${userProfile.name} kullanıcısı ${followingCount} kişiyi takip ediyor`);
              }}
            >
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
                      <Ionicons name="document-text-outline" size={24} color="#9ca3af" />
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
              <Ionicons name="images-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyPostsTitle}>Henüz Gönderi Yok</Text>
              <Text style={styles.emptyPostsText}>Bu kullanıcı henüz gönderi paylaşmamış.</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  initialsOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    ...FONT_STYLES.h1,
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
  levelText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    marginBottom: 8,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 200,
  },
  followingButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
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