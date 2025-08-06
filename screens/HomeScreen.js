import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSavedPosts } from '../contexts/SavedPostsContext';
import { useAuth } from '../contexts/AuthContext';
import postsService from '../services/postsService';
import commentsService from '../services/commentsService';
import followService from '../services/followService';
import notificationService from '../services/notificationService';
import { aiService } from '../services';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_STYLES, FONTS, FONT_WEIGHTS, FONT_SIZES } from '../utils';


const PostItem = ({ 
  username, 
  userImage, 
  postImage, 
  caption,
  likes, 
  timeAgo, 
  isLiked, 
  isSaved, 
  isFromAI,
  aiPrompt,
  aiResponseType,
  commentCount,
  userId,
  isOwnPost,
  postType,
  tags,
  onLike, 
  onComment, 
  onBookmark,
  onUserPress
}) => (
  <View style={styles.postContainer}>
    {/* Post Header */}
    <View style={styles.postHeader}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => onUserPress && onUserPress(userId, username)}
        disabled={isFromAI}
      >
        {userImage ? (
        <Image source={{ uri: userImage }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarFallback}>
            <Text style={styles.userAvatarFallbackText}>
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </Text>
        </View>
        )}
        <View style={styles.userInfoText}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>
              {isFromAI ? '🤖 AI Soru' : username}
            </Text>
            {postType && (
              <View style={styles.postTypeBadge}>
                <Text style={styles.postTypeText}>
                  {postType === 'soru' ? 'Soru' : postType === 'danışma' ? 'Danışma' : postType}
                </Text>
      </View>
            )}
          </View>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
      </TouchableOpacity>
    </View>

    {/* Post Image */}
    {postImage && (
      <View style={styles.imageContainer}>
    <Image source={{ uri: postImage }} style={styles.postImage} />
        {/* AI Post Badge - Görselin üstünde */}
        {isFromAI && (
          <View style={styles.aiBadgeOverlay}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.aiBadgeTextOverlay}>AI Soru</Text>
          </View>
        )}
      </View>
    )}

    {/* AI Post Badge - Görsel yoksa */}
    {isFromAI && !postImage && (
      <View style={styles.aiBadge}>
        <Ionicons name="sparkles" size={16} color="#8b5cf6" />
        <Text style={styles.aiBadgeText}>AI Soru</Text>
      </View>
    )}

    {/* Post Caption and Tags - Görselin hemen altında */}
    {(caption || (tags && tags.length > 0)) && (
      <View style={[
        styles.captionContainer,
        isFromAI && styles.aiCaptionContainer
      ]}>
        <View style={styles.captionContent}>
          {caption && (
            <Text style={[
              styles.captionText,
              isFromAI && styles.aiCaptionText
            ]}>
              <Text style={styles.usernameInCaption}>{username}</Text>
              {isFromAI ? ': ' : ': '}
              {caption}
            </Text>
          )}
          
          {/* Post Tags */}
          {tags && tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.captionTime}>{timeAgo}</Text>
      </View>
    )}

    {/* Post Actions */}
    <View style={styles.postActions}>
      <View style={styles.leftActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#ef4444" : "#6b7280"} 
          />
          {likes > 0 && (
            <Text style={styles.likeCount}>{likes}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={22} color="#6b7280" />
          {commentCount > 0 && (
            <Text style={styles.commentCount}>{commentCount}</Text>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.bookmarkButton} onPress={onBookmark}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={22} 
          color={isSaved ? "#8b5cf6" : "#6b7280"} 
            />
          </TouchableOpacity>
    </View>


  </View>
);

export default function HomeScreen({ navigation }) {
  const { savePost, unsavePost, isPostSaved, postDeletedEvent } = useSavedPosts();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedType, setFeedType] = useState('all'); // 'all' veya 'following'
  
  // Filtreleme state'leri
  const [postTypeFilter, setPostTypeFilter] = useState('all'); // 'all', 'soru', 'danışma'
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'popular', 'oldest'
  const [showFilters, setShowFilters] = useState(false);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // Yanıtlanan yorum
  
  // Bildirim sistemi
  const [notification, setNotification] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  
  // Yeni gönderiler sistemi
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [lastPostCount, setLastPostCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtreleme ve sıralama fonksiyonu
  const applyFiltersAndSort = (postsToFilter) => {
    let filtered = [...postsToFilter];

    // Feed type filtresi (Tüm Postlar / Takip Ettiklerim)
    if (feedType === 'following') {
      console.log('🔍 Filtering for following posts...');
      console.log('👤 Current user:', user);
      console.log('📝 Total posts before filtering:', filtered.length);
      
      // Kullanıcının takip ettiği kişilerin postlarını filtrele
      filtered = filtered.filter(post => {
        // Kendi post'larım her zaman görünsün
        if (post.isOwnPost) {
          console.log('✅ Own post included:', post.caption?.substring(0, 30));
          return true;
        }
        
        // Kullanıcının takip ettiği kişilerin post'larını kontrol et
        const currentUser = user;
        if (currentUser && currentUser.following && Array.isArray(currentUser.following)) {
          const isFollowing = currentUser.following.includes(post.userId);
          console.log(`👥 Post by ${post.username} (${post.userId}): ${isFollowing ? '✅ Following' : '❌ Not following'}`);
          return isFollowing;
        } else {
          console.log('❌ No following list found for user');
          return false;
        }
      });
      
      console.log('📝 Posts after following filter:', filtered.length);
    }

    // Post türü filtresi
    if (postTypeFilter !== 'all') {
      filtered = filtered.filter(post => post.postType === postTypeFilter);
    }

    // Sıralama
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likes + b.commentCount) - (a.likes + a.commentCount));
        break;
      default:
        break;
    }

    return filtered;
  };

  // Posts değiştiğinde filtreleri uygula
  useEffect(() => {
    setFilteredPosts(applyFiltersAndSort(posts));
  }, [posts, postTypeFilter, sortBy, feedType, user?.following]);

  // Load posts from backend
  useEffect(() => {
    console.log('🏠 HomeScreen mounted - calling loadPosts');
    loadPosts();
    loadUnreadNotificationCount();
    loadUserFollowingList();
    
    // Sistem durumu kontrolü
    const checkSystemStatus = async () => {
      try {
        console.log('🔍 Starting system status check...');
        const status = await aiService.checkSystemStatus();
        console.log('🔍 System Status Check Result:', status);
        
        if (status.success) {
          console.log('✅ System status check successful');
        } else {
          console.log('❌ System status check failed:', status.error);
        }
      } catch (error) {
        console.error('❌ System status check failed:', error);
      }
    };
    
    // 2 saniye sonra sistem durumunu kontrol et
    setTimeout(checkSystemStatus, 2000);
  }, [user?.name, user?.avatar]); // Kullanıcı bilgileri değiştiğinde post'ları yenile

  // Periyodik olarak yeni gönderileri kontrol et (geçici olarak devre dışı)
  // Backend'deki /latest endpoint sorunu çözülene kadar bu özellik devre dışı
  /*
  useEffect(() => {
    const checkNewPosts = async () => {
      if (!isLoading && !isRefreshing) {
        try {
          // En son gördüğümüz post'un ID'sini al
          const lastSeenPostId = posts.length > 0 ? posts[0].id : null;
          
          console.log('🔍 Checking for new posts, lastSeenPostId:', lastSeenPostId);
          
          const result = await postsService.checkNewPosts(lastSeenPostId);
          if (result.success && result.data?.hasNewPosts) {
            console.log('🆕 Yeni gönderiler tespit edildi!');
            setHasNewPosts(true);
          }
        } catch (error) {
          console.log('Yeni gönderiler kontrol edilirken hata:', error);
        }
      }
    };

    const interval = setInterval(checkNewPosts, 30000); // 30 saniye

    return () => clearInterval(interval);
  }, [posts, isLoading, isRefreshing]);
  */

  // Focus listener - sayfa her açıldığında posts'ları yenile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 HomeScreen focused - reloading posts');
      loadPosts();
      loadUnreadNotificationCount();
    });

    return unsubscribe;
  }, [navigation]);

  // Post silme event'ini dinle
  useEffect(() => {
    if (postDeletedEvent > 0) {
      console.log('🔄 Post deleted event detected, reloading posts...');
      loadPosts();
    }
  }, [postDeletedEvent]);

  // WebSocket AI yanıt event'lerini dinle
  useEffect(() => {
    const handleAIResponse = (data) => {
      const { postId, commentId, aiResponse } = data;
      console.log('🤖 AI yanıtı alındı:', { postId, commentId, aiResponse });
      
      // Loading comment'i güncelle
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === `loading_${commentId}` 
            ? {
                ...comment,
                id: `ai_${Date.now()}`,
                text: aiResponse,
                isLoading: false,
              }
            : comment
        )
      );
      
      // Bildirim göster
      showNotification('🤖 AI Yanıtı', 'GeminiHoca yorumunuza yanıt verdi!');
    };

    const handleAILoading = (data) => {
      const { postId, commentId } = data;
      console.log('🤖 AI yanıtı başladı:', { postId, commentId });
      
      // Loading state'i güncelle (zaten var)
    };

    // Event listener'ları ekle
    if (global.eventEmitter) {
      global.eventEmitter.on('aiCommentResponse', handleAIResponse);
      global.eventEmitter.on('aiCommentLoading', handleAILoading);
    }

    // Cleanup
    return () => {
      if (global.eventEmitter) {
        global.eventEmitter.off('aiCommentResponse', handleAIResponse);
        global.eventEmitter.off('aiCommentLoading', handleAILoading);
      }
    };
  }, []);



  const loadPosts = async (isRefresh = false) => {
    try {
      console.log('🚀 loadPosts function called');
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
      setIsLoading(true);
      }
      setError(null);
      
      // Backend'den yükle
      await loadPostsFromBackend(isRefresh);
    } catch (error) {
      console.error('❌ Posts loading error:', error);
      setError('Postlar yüklenirken bir hata oluştu');
      setPosts([]);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Backend'den post yükleme
  const loadPostsFromBackend = async (isRefresh = false) => {
    try {
      console.log('🔄 Backend\'den post\'lar yükleniyor...');
      const result = await postsService.getPosts();
      
      console.log('📡 Backend response:', result);
      console.log('🔍 Response structure check:');
      console.log('  - success:', result.success);
      console.log('  - has data:', !!result.data);
      console.log('  - has posts:', !!result.data?.posts);
      console.log('  - posts type:', typeof result.data?.posts);
      console.log('  - posts length:', result.data?.posts?.length);
      console.log('  - posts array:', Array.isArray(result.data?.posts));
      
      // Çift data wrapper kontrolü
      const postsData = result.data?.data?.posts || result.data?.posts;
      
      if (result.success && postsData && Array.isArray(postsData)) {
        console.log('✅ Posts loaded successfully');
        console.log('📊 Raw data:', postsData);
        
        // Yeni gönderileri kontrol et
        const currentPostCount = postsData.length;
        if (!isRefresh && lastPostCount > 0 && currentPostCount > lastPostCount) {
          console.log('🆕 Yeni gönderiler tespit edildi!');
          setHasNewPosts(true);
        }
        
        // Transform backend data to match our frontend structure
        const transformedPosts = postsData.map(post => {
          console.log('🔍 Processing post:', post._id || post.id);
          console.log('🏷️ Post tags:', post.tags);
          console.log('🏷️ Post topicTags:', post.topicTags);
          console.log('🏷️ Post keywords:', post.keywords);
          console.log('🏷️ Post full structure:', JSON.stringify(post, null, 2));
          
          // Etiket debug bilgisi
          const extractedTags = (post.tags || post.topicTags || post.keywords || [])
            .filter(tag => tag && tag.trim() !== '')
            .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
          
          console.log('🏷️ Extracted tags:', extractedTags);
          console.log('🏷️ Tags length:', extractedTags.length);
          // Kullanıcı ID'sini kontrol et - eğer kendi post'umsa güncel ismi kullan
          const currentUser = user;
          const isOwnPost = currentUser && (post.userId?._id === currentUser._id || post.userId === currentUser._id);
          
          // Kendi post'um ise güncel kullanıcı bilgilerini kullan
          const displayUsername = isOwnPost ? (currentUser.name || 'Sen') : (post.userId?.name || post.name || 'Unknown User');
          const displayUserImage = isOwnPost ? (currentUser.avatar || post.userId?.avatar) : (post.userId?.avatar || post.userImage);
          
          return {
          id: post._id || post.id,
            userId: post.userId?._id || post.userId || null,
            username: displayUsername,
            userImage: displayUserImage,
            postImage: post.imageURL || post.postImage || null,
            caption: post.caption || post.text || '',
          likes: post.likes?.length?.toString() || post.likes || '0',
          timeAgo: post.createdAt ? getTimeAgo(new Date(post.createdAt)) : post.timeAgo || '1h',
          isLiked: post.isLiked || false,
            isFromAI: post.isFromAI || false,
            aiPrompt: post.aiPrompt || null,
            aiResponseType: post.aiResponseType || null,
            commentCount: post.commentCount || 0,
            isOwnPost: isOwnPost, // Kendi post'um mu?
            postType: post.postType || null, // Post türü (soru/danışma)
            tags: (post.tags || post.topicTags || post.keywords || [])
              .filter(tag => tag && tag.trim() !== '')
              .map(tag => tag.startsWith('#') ? tag : `#${tag}`), // Etiketler
          };
        });
        

        
        console.log('🔄 Transformed posts:', transformedPosts);
        setPosts(transformedPosts);
        setLastPostCount(transformedPosts.length);
        
        // Refresh ise yeni gönderiler butonunu gizle
        if (isRefresh) {
          setHasNewPosts(false);
        }
        
        console.log('✅ Posts loaded and cached successfully');
      } else {
        console.log('⚠️ Backend response invalid, no posts available');
        console.log('📊 Response structure:', {
          success: result.success,
          hasData: !!result.data,
          dataType: typeof result.data,
          isArray: Array.isArray(result.data)
        });

        // Backend'den geçerli veri gelmediyse boş array kullan
        setPosts([]);
        setLastPostCount(0);
        
        if (!result.success) {
        console.error('❌ Load posts failed:', result.error);
        setError(result.error || 'Postlar yüklenemedi');
        }
      }
    } catch (error) {
      console.error('💥 Load posts error:', error);
      // Backend hatası durumunda boş array kullan
      setPosts([]);
      setLastPostCount(0);
      setError('Postlar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '1h';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 48) return '1d';
    return `${Math.floor(diffInHours / 24)}d`;
  };

  // Yeni gönderileri yenile
  const handleRefreshPosts = async () => {
    console.log('🔄 Yeni gönderiler yenileniyor...');
    setHasNewPosts(false);
    await loadPosts(true);
  };

  // Okunmamış bildirim sayısını yükle
  const loadUnreadNotificationCount = async () => {
    try {
      const result = await notificationService.getUnreadCount();
      if (result.success) {
        setUnreadNotificationCount(result.count || 0);
      }
    } catch (error) {
      console.error('Load unread notification count error:', error);
    }
  };

  // Kullanıcının following listesini yükle
  const loadUserFollowingList = async () => {
    try {
      console.log('👥 Loading user following list...');
      // Kullanıcının following listesini backend'den çek
      const followingList = await followService.getFollowingList();
      console.log('👥 Following list loaded:', followingList);
      
      // AuthContext'teki user'ı güncelle
      if (user && followingList) {
        // Bu kısmı AuthContext'te yapmak daha iyi olur
        console.log('👥 Updated user following list');
      }
    } catch (error) {
      console.error('❌ Error loading following list:', error);
    }
  };

  // Bildirimler sayfasına git
  const handleNotificationPress = () => {
    navigation.navigate('NotificationsStack');
  };

  // Event Handlers
  const handleLike = async (postId) => {
    try {

      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                likes: post.isLiked 
                  ? String(Math.max(0, parseInt(post.likes.replace(',', '')) - 1))
                  : String(parseInt(post.likes.replace(',', '')) + 1)
              }
            : post
        )
      );



      // Backend call
      const result = await postsService.toggleLike(postId);
      
      if (!result.success) {
        // Revert optimistic update on error
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  isLiked: !post.isLiked,
                  likes: post.isLiked 
                    ? String(parseInt(post.likes.replace(',', '')) + 1)
                    : String(Math.max(0, parseInt(post.likes.replace(',', '')) - 1))
                }
              : post
          )
        );
        console.error('Like error:', result.error);
        
        // Kullanıcıya hata mesajı göster
        Alert.alert(
          'Beğeni Hatası ❌',
          result.error || 'Beğeni işlemi sırasında hata oluştu',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Handle like error:', error);
      
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                likes: post.isLiked 
                  ? String(parseInt(post.likes.replace(',', '')) + 1)
                  : String(Math.max(0, parseInt(post.likes.replace(',', '')) - 1))
              }
            : post
        )
      );
      
      Alert.alert(
        'Bağlantı Hatası',
        'Beğeni işlemi sırasında bağlantı hatası oluştu',
        [{ text: 'Tamam' }]
      );
    }
  };

  const handleComment = async (postId) => {
    setSelectedPostId(postId);
    setCommentModalVisible(true);
    setComments([]);
    setCommentText('');
    setReplyingTo(null);
    
    // Yorumları yükle
    await loadComments(postId);
    
    // Polling başlat (4 saniyede bir yorumları güncelle)
    const commentPolling = setInterval(async () => {
      if (commentModalVisible && selectedPostId === postId) {
        console.log('🔄 Yorumlar güncelleniyor...');
        await loadComments(postId);
      } else {
        clearInterval(commentPolling);
      }
    }, 4000);
    
    // Modal kapandığında polling'i durdur
    const originalOnRequestClose = () => {
      setCommentModalVisible(false);
      clearInterval(commentPolling);
    };
  };

  const loadComments = async (postId) => {
    try {
      setIsLoadingComments(true);
      const result = await commentsService.getComments(postId);
      
      if (result.success) {
        // Backend'in gerçek response formatına göre yorumları dönüştür
        // Backend'den gelen veri yapısını kontrol et
        console.log('💬 Raw result:', result);
        console.log('💬 Result.data:', result.data);
        console.log('💬 Result.data.data:', result.data?.data);
        console.log('💬 Comments array:', result.data?.data?.comments);
        
        const comments = result.data?.data?.comments || result.data?.comments || result.data || [];
        console.log('💬 Final comments array:', comments);
        
        if (!Array.isArray(comments)) {
          console.log('💬 Comments is not an array, setting empty array');
          setComments([]);
          return;
        }
        
        const transformedComments = comments.map(comment => ({
          id: comment._id || comment.id,
          username: comment.userId?.name || comment.user?.name || comment.username || 'Kullanıcı',
          userImage: comment.userId?.avatar || comment.user?.avatar || comment.userImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          text: comment.text || comment.content || '',
          timeAgo: comment.createdAt ? getTimeAgo(new Date(comment.createdAt)) : comment.timeAgo || '1h',
          likes: comment.likes?.length?.toString() || comment.likes || '0',
          isLiked: comment.isLiked || false,
          isOwnComment: comment.userId?._id === user?._id || comment.userId === user?._id,
        }));
        
        setComments(transformedComments);
      } else {
        console.error('Load comments error:', result.error);
        setComments([]);
      }
    } catch (error) {
      console.error('Load comments error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          result: result
        });
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };



  const handleBookmark = async (postId) => {
    try {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

      const isCurrentlySaved = isPostSaved(postId);
    
      if (isCurrentlySaved) {
      const result = await unsavePost(postId);
      if (result.success) {
          console.log('Post kaydedilenlerden çıkarıldı:', postId);
      }
    } else {
        const postData = {
          id: postId,
          postImage: post.postImage,
          caption: post.caption,
          likes: post.likes,
          comments: post.commentCount,
          isFromAI: post.isFromAI,
        };
        const result = await savePost(postData);
      if (result.success) {
          console.log('Post kaydedildi:', postId);
        }
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const result = await commentsService.toggleCommentLike(commentId);
      if (result.success) {
        // Optimistic update - yorumu güncelle
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? { ...comment, isLiked: !comment.isLiked }
              : comment
          )
        );
        console.log(`Yorum ${commentId} beğeni durumu değişti!`);
      } else {
        Alert.alert('Hata', result.error || 'Beğeni işlemi yapılamadı');
      }
    } catch (error) {
      console.error('Comment like error:', error);
      Alert.alert('Hata', 'Beğeni işlemi yapılırken bir hata oluştu');
    }
  };

  const handleReplyToComment = (comment) => {
    // Yanıtlanacak yorumu seç ve input'a @kullanıcıadı ekle
    setReplyingTo(comment);
    setCommentText(`@${comment.username} `);
    // Input'a focus ol
    // TODO: Input'a focus olma işlemi eklenebilir
  };

  const handleDeleteComment = async (commentId) => {
    try {
      Alert.alert(
        'Yorumu Sil',
        'Bu yorumu silmek istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Sil', 
            style: 'destructive',
            onPress: async () => {
              const result = await commentsService.deleteComment(commentId);
              if (result.success) {
                // Yorumu listeden kaldır
                setComments(prevComments => 
                  prevComments.filter(comment => comment.id !== commentId)
                );
                console.log(`Yorum ${commentId} silindi!`);
              } else {
                Alert.alert('Hata', result.error || 'Yorum silinirken bir hata oluştu');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete comment error:', error);
      Alert.alert('Hata', 'Yorum silinirken bir hata oluştu');
    }
  };

  const handleUserPress = (userId, username, isOwnPost) => {
    if (userId) {
      // Eğer kendi postumsa kendi profilime git
      if (isOwnPost || userId === user?._id) {
        console.log('🔧 Kendi postuma tıklandı, kendi profilime gidiyorum');
        navigation.navigate('Profile', { 
          screen: 'ProfileMain'
        });
      } else {
        // Başka kullanıcının postuysa onun profilini göster
        console.log('🔧 Başka kullanıcının postuna tıklandı, onun profilini gösteriyorum');
        console.log('🔧 UserId:', userId, 'Username:', username);
        
        // Kullanıcı profiline Profile stack üzerinden navigate et
        navigation.navigate('Profile', { 
          screen: 'UserProfileScreen',
          params: { 
            userId: userId, 
            username: username 
          }
        });
      }
    }
  };

  // Bildirim gösterme fonksiyonu
  const showNotification = (title, message) => {
    setNotification({ title, message });
    
    // 3 saniye sonra bildirimi kaldır
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };



  // Post silme fonksiyonu
  const handleDeletePost = async (postId) => {
    try {
      Alert.alert(
        'Post Sil',
        'Bu postu silmek istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              const result = await postsService.deletePost(postId);
              if (result.success) {
                // Post'u local state'den kaldır
                setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
                Alert.alert('Başarılı', 'Post başarıyla silindi');
              } else {
                Alert.alert('Hata', result.error || 'Post silinirken bir hata oluştu');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete post error:', error);
      Alert.alert('Hata', 'Post silinirken bir hata oluştu');
    }
  };

  const handleSendComment = async () => {
    if (commentText.trim() && selectedPostId) {
      try {
        // AI etiketleme kontrolü
        const hasAITag = commentText.includes('@GeminiHoca') || commentText.includes('@AI') || commentText.includes('@Hoca');
        
        const result = await commentsService.createComment(selectedPostId, commentText.trim());
        
        if (result.success) {
          // Backend'in gerçek response formatına göre yorum ekle
          const newComment = {
            id: result.data.comment?._id || result.data._id || result.data.id,
            username: result.data.comment?.userId?.name || result.data.user?.name || 'Sen',
            userImage: result.data.comment?.userId?.avatar || result.data.user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            text: result.data.comment?.text || commentText.trim(),
            timeAgo: 'Şimdi',
            isLiked: false,
            likes: 0,
            isOwnComment: true,
            hasAITag: hasAITag, // AI etiketi var mı?
            parentCommentId: replyingTo?.id || null, // Yanıtlanan yorumun ID'si
            replyingTo: replyingTo?.username || null, // Yanıtlanan kullanıcının adı
          };
          
          setComments(prevComments => [newComment, ...prevComments]);
          setCommentText('');
          setReplyingTo(null); // Yanıtlama durumunu sıfırla
          
          // AI etiketleme varsa AI analizi yap
          if (hasAITag) {
            console.log('🤖 AI etiketleme tespit edildi, AI analizi yapılıyor...');
            
            // Loading state'i göster
            const loadingComment = {
              id: `loading_${Date.now()}`,
              username: '🤖 GeminiHoca',
              userImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150',
              text: 'Soru ve yorumunuzu analiz ediyorum...',
              timeAgo: 'Şimdi',
              isLiked: false,
              likes: 0,
              isOwnComment: false,
              isAIResponse: true,
              isLoading: true,
              parentCommentId: newComment.id,
              replyingTo: user?.name || 'Kullanıcı',
            };
            
            setComments(prevComments => [loadingComment, ...prevComments]);
            
            // AI analizi yap
            try {
              // Post içeriğini al (selectedPost'dan)
              const currentPost = posts.find(post => post._id === selectedPostId);
              console.log('🔍 Current post for AI analysis:', currentPost);
              console.log('🔍 Selected Post ID:', selectedPostId);
              console.log('🔍 Available posts:', posts.map(p => ({ id: p._id || p.id, caption: p.caption })));
              
              // Post bulunamadıysa, comments'dan post ID'yi al
              let postContent = 'Soru içeriği bulunamadı';
              let postType = 'soru';
              
              if (currentPost) {
                postContent = currentPost.caption || currentPost.content || 'Soru içeriği bulunamadı';
                postType = currentPost.postType || 'soru';
              } else {
                // Comments'dan post ID'yi kullanarak tekrar dene
                console.log('🔍 Post not found in posts array, trying to get from comments...');
                const commentPostId = comments[0]?.postId;
                if (commentPostId) {
                  // Hem _id hem de id ile dene
                  const fallbackPost = posts.find(post => 
                    post._id === commentPostId || 
                    post.id === commentPostId ||
                    post._id === selectedPostId ||
                    post.id === selectedPostId
                  );
                  if (fallbackPost) {
                    postContent = fallbackPost.caption || fallbackPost.content || 'Soru içeriği bulunamadı';
                    postType = fallbackPost.postType || 'soru';
                    console.log('🔍 Found post via fallback:', fallbackPost);
                  } else {
                    console.log('🔍 No post found with any ID method');
                  }
                }
                
                // Hala bulunamadıysa, tüm posts array'ini kontrol et
                if (postContent === 'Soru içeriği bulunamadı') {
                  console.log('🔍 Trying to find post in all posts array...');
                  for (let post of posts) {
                    if (post._id === selectedPostId || post.id === selectedPostId) {
                      postContent = post.caption || post.content || 'Soru içeriği bulunamadı';
                      postType = post.postType || 'soru';
                      console.log('✅ Found post in loop:', post.caption);
                      break;
                    }
                  }
                }
                
                // Son çare: selectedPostId'yi string olarak kontrol et
                if (postContent === 'Soru içeriği bulunamadı') {
                  console.log('🔍 Last resort: checking selectedPostId as string:', selectedPostId);
                  const stringPost = posts.find(post => 
                    String(post._id) === String(selectedPostId) || 
                    String(post.id) === String(selectedPostId)
                  );
                  if (stringPost) {
                    postContent = stringPost.caption || stringPost.content || 'Soru içeriği bulunamadı';
                    postType = stringPost.postType || 'soru';
                    console.log('✅ Found post via string comparison:', stringPost.caption);
                  }
                }
              }
              
              console.log('📊 AI Analysis - Post Content:', postContent);
              console.log('📊 AI Analysis - Comment:', commentText.trim());
              console.log('📊 AI Analysis - Post Type:', postType);
              
              const aiResult = await aiService.analyzeComment(
                postContent, 
                commentText.trim(), 
                postType
              );
              
              if (aiResult.success && aiResult.data?.response) {
                // AI analiz yanıtını göster
                const aiComment = {
                  id: `ai_${Date.now()}`,
                  username: '🤖 GeminiHoca',
                  userImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150',
                  text: aiResult.data.response,
                  timeAgo: 'Şimdi',
                  isLiked: false,
                  likes: 0,
                  isOwnComment: false,
                  isAIResponse: true,
                  parentCommentId: newComment.id,
                  replyingTo: user?.name || 'Kullanıcı',
                };
                
                // Loading comment'i kaldır, AI yanıtını ekle
                setComments(prevComments => 
                  prevComments
                    .filter(comment => !comment.isLoading)
                    .map(comment => comment)
                );
                setComments(prevComments => [aiComment, ...prevComments]);
                
                console.log('✅ AI analizi tamamlandı ve gösterildi');
                        } else {
            // AI analizi başarısız
            const errorMessage = aiResult.error || 'Analiz yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
            const errorComment = {
              id: `ai_error_${Date.now()}`,
              username: '🤖 GeminiHoca',
              userImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150',
              text: errorMessage,
              timeAgo: 'Şimdi',
              isLiked: false,
              likes: 0,
              isOwnComment: false,
              isAIResponse: true,
              parentCommentId: newComment.id,
              replyingTo: user?.name || 'Kullanıcı',
            };
                
                setComments(prevComments => 
                  prevComments
                    .filter(comment => !comment.isLoading)
                    .map(comment => comment)
                );
                setComments(prevComments => [errorComment, ...prevComments]);
              }
            } catch (error) {
              console.error('❌ AI analizi hatası:', error);
              
              // Hata durumunda loading'i kaldır
              setComments(prevComments => 
                prevComments.filter(comment => !comment.isLoading)
              );
            }
          }
        } else {
          console.error('Send comment error:', result.error);
          // Show error message to user
          Alert.alert(
            'Yorum Hatası ❌',
            result.error || 'Yorum gönderilemedi',
            [{ text: 'Tamam' }]
          );
        }
      } catch (error) {
        console.error('Send comment error:', error);
        Alert.alert(
          'Bağlantı Hatası',
          'Yorum gönderilirken bağlantı hatası oluştu',
          [{ text: 'Tamam' }]
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Bildirim */}
      {notification && (
        <View style={styles.notificationContainer}>
          <View style={styles.notificationContent}>
            <Ionicons name="notifications" size={20} color="#fff" />
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
            <TouchableOpacity onPress={() => setNotification(null)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Ana Sayfa</Text>
          <Text style={styles.headerSubtitle}>Keşfet ve paylaş</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            {unreadNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="camera-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed Türü Seçimi */}
      <View style={styles.feedSelector}>
        <TouchableOpacity 
          style={[styles.feedTab, feedType === 'all' && styles.activeFeedTab]}
          onPress={() => setFeedType('all')}
        >
          <Text style={[styles.feedTabText, feedType === 'all' && styles.activeFeedTabText]}>
            Tüm Postlar
          </Text>
          {feedType === 'all' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.feedTab, feedType === 'following' && styles.activeFeedTab]}
          onPress={() => {
            console.log('🔍 Takip Ettiklerim clicked!');
            console.log('👤 Current user following list:', user?.following);
            console.log('📝 Current posts count:', posts.length);
            
            // Kullanıcıya bilgi ver
            if (!user?.following || user.following.length === 0) {
              Alert.alert(
                'Takip Ettiklerim 📝',
                'Henüz kimseyi takip etmiyorsunuz. Kullanıcıları takip etmeye başladığınızda burada onların paylaşımlarını göreceksiniz.',
                [{ text: 'Tamam' }]
              );
            }
            
            setFeedType('following');
          }}
        >
          <Text style={[styles.feedTabText, feedType === 'following' && styles.activeFeedTabText]}>
            Takip Ettiklerim
          </Text>
          {feedType === 'following' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        
        {/* Filtre Butonu */}
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name={showFilters ? "close" : "filter"} 
            size={20} 
            color={COLORS.primary[500]} 
          />
        </TouchableOpacity>
      </View>

      {/* Filtreleme Paneli */}
      {showFilters && (
        <View style={[styles.filterPanel, styles.filterCard]}>
          {/* Post Türü Filtresi */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Post Türü</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'Tümü', icon: 'grid' },
                { key: 'soru', label: 'Soru', icon: 'help-circle' },
                { key: 'danışma', label: 'Danışma', icon: 'chatbubble' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    postTypeFilter === option.key && styles.filterOptionActive
                  ]}
                  onPress={() => setPostTypeFilter(option.key)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={16} 
                    color={postTypeFilter === option.key ? COLORS.text.inverse : COLORS.text.secondary} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    postTypeFilter === option.key && styles.filterOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sıralama Seçenekleri */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sıralama</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'latest', label: 'En Yeni', icon: 'time' },
                { key: 'popular', label: 'Popüler', icon: 'trending-up' },
                { key: 'oldest', label: 'En Eski', icon: 'time-outline' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    sortBy === option.key && styles.filterOptionActive
                  ]}
                  onPress={() => setSortBy(option.key)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={16} 
                    color={sortBy === option.key ? COLORS.text.inverse : COLORS.text.secondary} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    sortBy === option.key && styles.filterOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtreleri Temizle */}
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setPostTypeFilter('all');
              setSortBy('latest');
            }}
          >
            <Ionicons name="refresh" size={16} color={COLORS.text.secondary} />
            <Text style={styles.clearFiltersText}>Filtreleri Temizle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Yeni Gönderiler Butonu */}
      {hasNewPosts && (
        <View style={styles.newPostsContainer}>
          <TouchableOpacity 
            style={styles.newPostsButton}
            onPress={handleRefreshPosts}
            disabled={isRefreshing}
          >
            <Ionicons 
              name={isRefreshing ? "refresh" : "refresh-outline"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.newPostsButtonText}>
              {isRefreshing ? 'Yenileniyor...' : 'Yeni gönderiler var'}
            </Text>
          </TouchableOpacity>
        </View>
      )}



      {/* Posts Feed */}
      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Postlar yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPosts}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Henüz post yok</Text>
            <Text style={styles.emptySubtext}>İlk post'u sen paylaş veya AI'dan soru sor!</Text>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <PostItem
              key={post.id}
              username={post.username}
              userImage={post.userImage}
              postImage={post.postImage}
              caption={post.caption}
              likes={post.likes}
              timeAgo={post.timeAgo}
              isLiked={post.isLiked}
              isSaved={isPostSaved(post.id)}
              isFromAI={post.isFromAI}
              aiPrompt={post.aiPrompt}
              aiResponseType={post.aiResponseType}
              commentCount={post.commentCount}
              userId={post.userId}
              isOwnPost={post.isOwnPost}
              postType={post.postType}
              tags={post.tags}
              onLike={() => handleLike(post.id)}
              onComment={() => handleComment(post.id)}
              onBookmark={() => handleBookmark(post.id)}
              onUserPress={() => handleUserPress(post.userId, post.username, post.isOwnPost)}
            />
          ))
        )}
      </ScrollView>

      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCommentModalVisible(false)}
      >


        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setCommentModalVisible(false);
              setComments([]);
              setCommentText('');
              setSelectedPostId(null);
              setReplyingTo(null);
            }}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {replyingTo ? `Yanıtla: @${replyingTo.username}` : 'Yorumlar'}
            </Text>
            <TouchableOpacity onPress={handleSendComment}>
              <Text style={[styles.modalSendText, !commentText.trim() && styles.modalSendTextDisabled]}>
                Gönder
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <ScrollView style={styles.commentsList}>
            {isLoadingComments ? (
              <View style={styles.commentsLoadingContainer}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={styles.commentsLoadingText}>Yorumlar yükleniyor...</Text>
              </View>
            ) : comments.length === 0 ? (
              <Text style={styles.noCommentsText}>Henüz yorum yok. İlk yorumu sen yap!</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={[
                  styles.commentItem,
                  comment.parentCommentId && styles.replyCommentItem,
                  comment.isAIResponse && styles.aiResponseCommentItem
                ]}>
                  <Image 
                    source={{ uri: comment.userImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }} 
                    style={[
                      styles.commentUserImage,
                      comment.isAIResponse && styles.aiResponseUserImage
                    ]} 
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={[
                        styles.commentUsername,
                        comment.isAIResponse && styles.aiResponseUsername
                      ]}>
                        {comment.username || 'Kullanıcı'}
                      </Text>
                      <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                    </View>
                    {/* Yanıtlanan kullanıcı etiketi */}
                    {comment.replyingTo && (
                      <Text style={styles.replyToText}>
                        Yanıtla: <Text style={styles.replyToUsername}>@{comment.replyingTo}</Text>
                      </Text>
                    )}
                    <Text style={[
                      styles.commentText,
                      comment.isAIResponse && styles.aiResponseText
                    ]}>
                      {comment.text}
                    </Text>
                    
                    {/* AI Etiketleme Badge'i */}
                    {comment.hasAITag && (
                      <View style={styles.aiTagBadge}>
                        <Ionicons name="sparkles" size={12} color="#8b5cf6" />
                        <Text style={styles.aiTagText}>AI Analizi Bekleniyor</Text>
                      </View>
                    )}
                    
                    <View style={styles.commentActions}>
                      <TouchableOpacity 
                        style={styles.commentAction}
                        onPress={() => handleCommentLike(comment.id)}
                      >
                        <Text style={[
                          styles.commentActionText, 
                          comment.isLiked && styles.likedActionText
                        ]}>
                          {comment.isLiked ? 'Beğenildi' : 'Beğen'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.commentAction}
                        onPress={() => handleReplyToComment(comment)}
                      >
                        <Text style={styles.commentActionText}>Yanıtla</Text>
                      </TouchableOpacity>
                      {/* Kendi yorumunda silme seçeneği */}
                      {comment.isOwnComment && (
                        <TouchableOpacity 
                          style={styles.commentAction}
                          onPress={() => handleDeleteComment(comment.id)}
                        >
                          <Text style={[styles.commentActionText, styles.deleteActionText]}>Sil</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Comment Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.commentInputContainer}
          >
            {/* AI Etiketleme Önerisi */}
            <View style={styles.aiTagSuggestion}>
              <Text style={styles.aiTagSuggestionText}>
                💡 AI'dan yardım için: <Text style={styles.aiTagExample}>@GeminiHoca</Text> yazın
              </Text>
            </View>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Yorum yaz... (@GeminiHoca ile AI'dan yardım al)"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    ...FONT_STYLES.medium,
    fontSize: FONT_SIZES.xs,
    color: '#fff',
  },
  feedSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  feedTab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 6,
    position: 'relative',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFeedTab: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  feedTabText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  activeFeedTabText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 3,
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPanel: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filterCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    ...SHADOWS.sm,
  },
  filterSection: {
    marginBottom: SPACING.lg,
  },
  filterSectionTitle: {
    ...FONT_STYLES.bodyBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.neutral[100],
    gap: SPACING.xs,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary[500],
  },
  filterOptionText: {
    ...FONT_STYLES.captionMedium,
    color: COLORS.text.secondary,
  },
  filterOptionTextActive: {
    color: COLORS.text.inverse,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  clearFiltersText: {
    ...FONT_STYLES.captionMedium,
    color: COLORS.text.secondary,
  },

  feed: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 8,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 20,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfoText: {
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    borderWidth: 3,
    borderColor: '#f1f5f9',
  },
  userAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f1f5f9',
  },
  userAvatarFallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.2,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postTypeBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  postTypeText: {
    ...FONT_STYLES.caption,
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  timeAgo: {
    ...FONT_STYLES.caption,
    color: '#666',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  aiBadgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  aiBadgeTextOverlay: {
    marginLeft: 4,
    ...FONT_STYLES.captionBold,
    color: '#fff',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  bookmarkButton: {
    padding: 4,
  },

  // AI Post Styles
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    marginLeft: 4,
    ...FONT_STYLES.captionBold,
    color: '#8b5cf6',
  },
  aiCaptionContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 8,
  },
  aiCaptionText: {
    ...FONT_STYLES.body,
    lineHeight: 20,
    color: '#000000',
  },
  captionContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 8,
  },
  captionContent: {
    marginBottom: 4,
  },
  captionText: {
    ...FONT_STYLES.body,
    lineHeight: 20,
    color: '#000000',
  },
  usernameInCaption: {
    ...FONT_STYLES.bodyBold,
    color: '#000000',
  },
  captionTime: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    ...FONT_STYLES.h3,
    color: '#000',
  },
  modalSendText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  modalSendTextDisabled: {
    color: '#ccc',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
  commentInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...FONT_STYLES.h3,
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    ...FONT_STYLES.body,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Comment Styles
  commentsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  commentsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  commentUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    ...FONT_STYLES.bodyBold,
    color: '#000',
    marginRight: 8,
  },
  commentTime: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
  },
  commentText: {
    ...FONT_STYLES.body,
    color: '#000',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentAction: {
    paddingVertical: 4,
  },
  commentActionText: {
    ...FONT_STYLES.captionMedium,
    color: '#9ca3af',
  },
  deleteActionText: {
    color: '#ef4444',
  },
  // AI Etiketleme Stilleri
  aiTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  aiTagText: {
    marginLeft: 4,
    ...FONT_STYLES.caption,
    color: '#8b5cf6',
  },
  // AI Etiketleme Önerisi
  aiTagSuggestion: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  aiTagSuggestionText: {
    ...FONT_STYLES.caption,
    color: '#666',
    textAlign: 'center',
  },
  aiTagExample: {
    ...FONT_STYLES.captionBold,
    color: '#8b5cf6',
  },
  replyCommentItem: {
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    paddingLeft: 10,
  },
  replyToText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  replyToUsername: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  likedActionText: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  commentCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  likeCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  // Bildirim Stilleri
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    ...FONT_STYLES.bodyBold,
    color: '#fff',
    marginBottom: 2,
  },
  notificationMessage: {
    ...FONT_STYLES.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // AI Yanıt Stilleri
  aiResponseCommentItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  aiResponseUserImage: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  aiResponseUsername: {
    color: '#8b5cf6',
  },
  aiResponseText: {
    color: '#374151',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  // Yeni Gönderiler Butonu Stilleri
  newPostsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  newPostsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  newPostsButtonText: {
    ...FONT_STYLES.body,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  // Etiket Stilleri - Daha kompakt
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tagItem: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#d1d5db',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
  },

});