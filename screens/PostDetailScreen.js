import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSavedPosts } from '../contexts/SavedPostsContext';
import postsService from '../services/postsService';
import commentsService from '../services/commentsService';

const { width, height } = Dimensions.get('window');

export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const { user } = useAuth();
  const { savePost, unsavePost, isPostSaved } = useSavedPosts();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [sendingComment, setSendingComment] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadPostDetails();
  }, [postId]);

  const loadPostDetails = async () => {
    try {
      setLoading(true);
      
      // Post detaylarını getir
      const postResult = await postsService.getPostById(postId);
      if (postResult.success) {
        const postData = postResult.data;
        setPost(postData);
        setIsLiked(postData.likes?.includes(user?._id) || false);
        setLikeCount(postData.likes?.length || 0);
        
        // Post'un kaydedilip kaydedilmediğini kontrol et
        setIsSaved(isPostSaved(postId));
      }

      // Yorumları getir
      const commentsResult = await commentsService.getComments(postId);
      if (commentsResult.success) {
        const commentsData = commentsResult.data?.data?.comments || commentsResult.data?.comments || [];
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Post detayları yüklenirken hata:', error);
      Alert.alert('Hata', 'Post detayları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const result = await postsService.toggleLike(postId);
      if (result.success) {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      }
    } catch (error) {
      console.error('Like hatası:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSendingComment(true);
      const result = await commentsService.createComment(postId, commentText.trim());
      if (result.success) {
        setCommentText('');
        // Yorumları yeniden yükle
        const commentsResult = await commentsService.getComments(postId);
        if (commentsResult.success) {
          const commentsData = commentsResult.data?.data?.comments || commentsResult.data?.comments || [];
          setComments(commentsData);
        }
      }
    } catch (error) {
      console.error('Yorum gönderme hatası:', error);
      Alert.alert('Hata', 'Yorum gönderilirken bir hata oluştu.');
    } finally {
      setSendingComment(false);
    }
  };

  const handleBookmark = async () => {
    if (!post) return;

    try {
      if (isSaved) {
        const result = await unsavePost(postId);
        if (result.success) {
          setIsSaved(false);
          Alert.alert('Başarılı', 'Post kaydedilenlerden çıkarıldı.');
        }
      } else {
        const postData = {
          id: postId,
          postImage: post.imageURL,
          caption: post.caption,
          likes: post.likes?.length?.toString() || '0',
          comments: post.commentCount?.toString() || '0',
          isFromAI: post.isFromAI || false,
        };
        const result = await savePost(postData);
        if (result.success) {
          setIsSaved(true);
          Alert.alert('Başarılı', 'Post kaydedildi.');
        }
      }
    } catch (error) {
      console.error('Bookmark hatası:', error);
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;

    Alert.alert(
      'Postu Sil',
      'Bu postu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await postsService.deletePost(postId);
              if (result.success) {
                Alert.alert('Başarılı', 'Post başarıyla silindi.');
                // Ana sayfaya geri dön
                navigation.goBack();
              } else {
                Alert.alert('Hata', result.error || 'Post silinirken bir hata oluştu');
              }
            } catch (error) {
              console.error('Delete post error:', error);
              Alert.alert('Hata', 'Post silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    if (diffInHours < 48) return 'Dün';
    return date.toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Bar için ekstra padding */}
      {Platform.OS === 'android' && (
        <View style={styles.statusBarPadding} />
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        {post && (post.userId?._id === user?._id || post.userId === user?._id) && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeletePost}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: post.imageURL }} style={styles.postImage} />
          {post.isFromAI && (
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={28} 
                color={isLiked ? "#e31b23" : "#000"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={26} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={26} color="#000" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleBookmark}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={26} 
              color={isSaved ? "#000" : "#000"} 
            />
          </TouchableOpacity>
        </View>

        {/* Likes */}
        <View style={styles.likesContainer}>
          <Text style={styles.likesText}>{likeCount} beğenme</Text>
        </View>

        {/* Caption */}
        <View style={styles.captionContainer}>
          <Text style={styles.username}>{post.userId?.name || 'Kullanıcı'}</Text>
          <Text style={styles.caption}>{post.caption}</Text>
          <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
        </View>

        {/* Comments */}
        <View style={styles.commentsContainer}>
          <Text style={styles.commentsTitle}>Yorumlar ({comments.length})</Text>
          {comments.map((comment, index) => (
            <View key={comment._id || index} style={styles.commentItem}>
              <Text style={styles.commentUsername}>{comment.userId?.name || 'Kullanıcı'}</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
              <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Yorum ekle..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity 
          onPress={handleComment}
          disabled={!commentText.trim() || sendingComment}
          style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
        >
          {sendingComment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBarPadding: {
    height: Platform.OS === 'android' ? 25 : 0,
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
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
    zIndex: 1001,
  },
  deleteButton: {
    padding: 8,
    zIndex: 1001,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: width, // Square image
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  aiBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  likesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  likesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  caption: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
    marginBottom: 8,
  },
  postDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  commentsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 80,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 20,
    padding: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
}); 