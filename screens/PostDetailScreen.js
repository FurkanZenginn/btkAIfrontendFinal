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
      let commentsData = [];
      
      if (commentsResult.success) {
        commentsData = commentsResult.data?.data?.comments || commentsResult.data?.comments || [];
      }
      
      // Sadece gerçek yorumları kullan
      console.log('💬 Yorumlar yükleniyor...');
      
             // Post ID'sine göre farklı mock yorumlar (Zengin tartışma ortamı)
       const getMockCommentsByPostId = (postId) => {
         if (postId.includes('mock_physics')) {
           return [
             {
               _id: 'mock_user_1',
               text: 'Bu fizik sorusu gerçekten zor! Sürtünme katsayısı 0.2 verilmiş, mekanik enerji korunumu mu kullanmalıyız?',
               userId: {
                 _id: 'user_1',
                 name: 'Ahmet Yılmaz',
                 avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
               },
               createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
             },
             {
               _id: 'mock_ai_1',
               text: 'Bu fizik sorusu için mekanik enerji korunumu prensibini kullanabilirsin. Sürtünme katsayısı 0.2 olduğuna göre, enerji kaybı hesaba katılmalı. Formül: E = mgh + ½mv² - μmgd. Adım adım çözüm için sürtünme kuvvetini hesaplayıp, net kuvveti bulmalısın.',
               userId: {
                 _id: 'ai_user_1',
                 name: 'GeminiHoca',
                 avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150'
               },
               createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
               isAIResponse: true
             },
             {
               _id: 'mock_user_2',
               text: '@GeminiHoca Bu formülü nasıl uygulayacağım? Detaylı açıklayabilir misin?',
               userId: {
                 _id: 'user_2',
                 name: 'Zeynep Kaya',
                 avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
               },
               createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
               hasAITag: true
             },
             {
               _id: 'mock_user_3',
               text: 'Ben de bu soruyu çözmeye çalışıyordum! Sürtünme kuvveti f = μN = 0.2 × 2 × 9.8 = 3.92 N oluyor. Net kuvvet F = mg - f = 19.6 - 3.92 = 15.68 N. İvme a = F/m = 15.68/2 = 7.84 m/s².',
               userId: {
                 _id: 'user_3',
                 name: 'Mehmet Demir',
                 avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
               },
               createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
             },
             {
               _id: 'mock_ai_2',
               text: 'Harika bir çözüm! Zeynep\'in yaklaşımı doğru. Enerji korunumu da kullanılabilir ama kuvvet yaklaşımı daha direkt. Önemli nokta: Sürtünme kuvveti her zaman hareket yönüne ters yöndedir.',
               userId: {
                 _id: 'ai_user_1',
                 name: 'GeminiHoca',
                 avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150'
               },
               createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
               isAIResponse: true
             },
             {
               _id: 'mock_user_4',
               text: 'Çok güzel çözüm! Ben de aynı sonucu buldum. Enerji korunumu yaklaşımı da kullanılabilir ama kuvvet yaklaşımı daha pratik.',
               userId: {
                 _id: 'user_4',
                 name: 'Elif Özkan',
                 avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
               },
               createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
             }
           ];
         } else if (postId.includes('mock_chemistry')) {
           return [
             {
               _id: 'mock_user_1',
               text: 'Bu organik bileşik analizi çok karmaşık. C₆H₁₂O₂ formülü ne olabilir? Ester mi, karboksilik asit mi?',
               userId: {
                 _id: 'user_1',
                 name: 'KimyaÖğretmeni',
                 avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
               },
               createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
             },
             {
               _id: 'mock_ai_1',
               text: 'Bu organik bileşik analizi için önce fonksiyonel grupları tespit etmelisin. C₆H₁₂O₂ formülü ester veya karboksilik asit olabilir. IUPAC adlandırması için ana zinciri bulup, fonksiyonel grubu belirtmelisin.',
               userId: {
                 _id: 'ai_user_1',
                 name: 'GeminiHoca',
                 avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150'
               },
               createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
               isAIResponse: true
             },
             {
               _id: 'mock_user_2',
               text: '@GeminiHoca Bu bileşik muhtemelen bir ester. Ana zincir 6 karbonlu olduğuna göre hekzil esteri olabilir.',
               userId: {
                 _id: 'user_2',
                 name: 'Ahmet Yılmaz',
                 avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
               },
               createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
               hasAITag: true
             },
             {
               _id: 'mock_user_3',
               text: 'Evet, ester olabilir. Ama karboksilik asit de olabilir. Fonksiyonel grup testleri yapmak gerekir.',
               userId: {
                 _id: 'user_3',
                 name: 'Zeynep Kaya',
                 avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
               },
               createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
             }
           ];
         } else if (postId.includes('mock_biology')) {
           return [
             {
               _id: 'mock_user_1',
               text: 'Bu görselde hangi hücre bölünmesi aşaması gösteriliyor? Mitoz mu mayoz mu?',
               userId: {
                 _id: 'user_1',
                 name: 'BiyolojiSever',
                 avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
               },
               createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
             },
             {
               _id: 'mock_ai_1',
               text: 'Bu görselde mitoz bölünmenin metafaz aşaması gösteriliyor. Kromozomlar ekvatoral düzlemde sıralanmış durumda. Mitoz ve mayoz arasındaki temel fark: mitozda 2n→2n, mayozda 2n→n kromozom sayısı değişimi olur.',
               userId: {
                 _id: 'ai_user_1',
                 name: 'GeminiHoca',
                 avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150'
               },
               createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
               isAIResponse: true
             },
             {
               _id: 'mock_user_2',
               text: 'Kromozomların bu şekilde sıralanması çok net görünüyor. Hangi boyama tekniği kullanılmış?',
               userId: {
                 _id: 'user_2',
                 name: 'Mehmet Demir',
                 avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
               },
               createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
             },
             {
               _id: 'mock_user_3',
               text: '@GeminiHoca Mitoz ve mayoz arasındaki farkları daha detaylı açıklayabilir misin?',
               userId: {
                 _id: 'user_3',
                 name: 'Elif Özkan',
                 avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
               },
               createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
               hasAITag: true
             }
           ];
         } else if (postId.includes('mock_math')) {
           return [
             {
               _id: 'mock_user_1',
               text: 'Bu integral gerçekten karmaşık! Trigonometrik özdeşlikler mi kullanmalıyız?',
               userId: {
                 _id: 'user_1',
                 name: 'MatematikTutkunu',
                 avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
               },
               createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
             },
             {
               _id: 'mock_ai_1',
               text: 'Bu integral için trigonometrik özdeşlikler kullanmalısın. sin²x = (1-cos2x)/2 ve cos³x = cosx(1-sin²x) dönüşümlerini uygulayarak çözebilirsin. Adım adım çözüm için u = cosx dönüşümü de kullanılabilir.',
               userId: {
                 _id: 'ai_user_1',
                 name: 'GeminiHoca',
                 avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150'
               },
               createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
               isAIResponse: true
             },
             {
               _id: 'mock_user_2',
               text: '@GeminiHoca Bu integral gerçekten karmaşık. Kısmi integral yöntemi de kullanılabilir mi?',
               userId: {
                 _id: 'user_2',
                 name: 'Zeynep Kaya',
                 avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
               },
               createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
               hasAITag: true
             },
             {
               _id: 'mock_user_3',
               text: 'Evet, kısmi integral de kullanılabilir ama trigonometrik özdeşlikler daha pratik olacaktır.',
               userId: {
                 _id: 'user_3',
                 name: 'Ahmet Yılmaz',
                 avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
               },
               createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
             }
           ];
         } else {
           // Varsayılan mock yorumlar
           return [
             {
               _id: 'mock_user_1',
               text: 'Bu soru gerçekten ilginç! Nasıl çözebiliriz?',
               userId: {
                 _id: 'user_1',
                 name: 'Öğrenci',
                 avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
               },
               createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
             },
             {
               _id: 'mock_ai_1',
               text: 'Bu soru için detaylı analiz yapmak gerekiyor. Adım adım çözüm yaklaşımı en iyisi olacaktır.',
               userId: {
                 _id: 'ai_user_1',
                 name: 'GeminiHoca',
                 avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150'
               },
               createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
               isAIResponse: true
             }
           ];
         }
       };
      
      // Sadece gerçek yorumları kullan, mock veri yok
      setComments(commentsData);
      
      console.log('💬 Gerçek yorumlar yüklendi:', commentsData.length);
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

    // Tüm postlar için normal API çağrısı yap
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
          {comments.map((comment, index) => {
            // AI yorumu mu kontrol et
            const isAIComment = comment.userId?.name === 'GeminiHoca' || 
                               comment.userId?.name === 'AI Assistant' ||
                               comment.text?.includes('@GeminiHoca') ||
                               comment.isAIResponse;
            
            return (
              <View key={comment._id || index} style={[
                styles.commentItem,
                isAIComment && styles.aiCommentItem
              ]}>
                {/* AI Badge */}
                {isAIComment && (
                  <View style={styles.aiCommentHeader}>
                    <View style={styles.aiAvatar}>
                      <Ionicons name="sparkles" size={16} color="#fff" />
                    </View>
                    <View style={styles.aiUserInfo}>
                      <Text style={styles.aiUsername}>GeminiHoca</Text>
                      <View style={styles.aiBadgeSmall}>
                        <Ionicons name="robot" size={12} color="#8b5cf6" />
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    </View>
                    <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                  </View>
                )}
                
                {/* Normal User Comment */}
                {!isAIComment && (
                  <View style={styles.userCommentHeader}>
                    <Text style={styles.commentUsername}>{comment.userId?.name || 'Kullanıcı'}</Text>
                    <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                  </View>
                )}
                
                <Text style={[
                  styles.commentText,
                  isAIComment && styles.aiCommentText
                ]}>
                  {comment.text}
                </Text>
                
                {/* AI Response Status */}
                {comment.text?.includes('@GeminiHoca') && !isAIComment && (
                  <View style={styles.aiResponseStatus}>
                    <Ionicons name="sparkles" size={14} color="#8b5cf6" />
                    <Text style={styles.aiResponseStatusText}>AI Analizi Bekleniyor</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* AI Suggestion Bar */}
      <View style={styles.aiSuggestionBar}>
        <Ionicons name="bulb-outline" size={16} color="#8b5cf6" />
        <Text style={styles.aiSuggestionText}>AI'dan yardım için: @GeminiHoca yazın</Text>
      </View>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Yorum yaz... (@GeminiHoca ile AI'dan yardım al)"
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
  // 🎭 AI Comment Styles
  aiCommentItem: {
    backgroundColor: '#f8f7ff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
    marginBottom: 16,
  },
  aiCommentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  aiBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  aiCommentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  userCommentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiResponseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  aiResponseStatusText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  aiSuggestionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f7ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 6,
  },
  aiSuggestionText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
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