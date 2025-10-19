import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../utils/fonts';
import aiService from '../services/aiService';
import { postsService } from '../services';

const SimilarQuestionsModal = ({ visible, onClose, hapBilgiId, hapBilgiTitle, hapBilgiContent, hapBilgiTags, navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && hapBilgiContent) {
      loadSimilarQuestions();
    }
  }, [visible, hapBilgiContent]);

  // Etiket benzerliği hesapla (TAM ESNEKLİKLE)
  const calculateTagSimilarity = (hapBilgiTags, questionTags) => {
    if (!hapBilgiTags || !questionTags) return 0;
    
    const hapTags = Array.isArray(hapBilgiTags) ? hapBilgiTags : [];
    const qTags = Array.isArray(questionTags) ? questionTags : [];
    
    if (hapTags.length === 0 || qTags.length === 0) return 0;
    
    // Etiketleri normalize et (büyük/küçük harf duyarsız, # işareti kaldır)
    const normalizedHapTags = hapTags.map(tag => 
      tag.toLowerCase().replace('#', '').replace(/\s+/g, '').trim()
    );
    const normalizedQTags = qTags.map(tag => 
      tag.toLowerCase().replace('#', '').replace(/\s+/g, '').trim()
    );
    
    console.log('🏷️ Tag comparison debug:', {
      original_hapTags: hapTags,
      original_qTags: qTags,
      normalized_hapTags: normalizedHapTags,
      normalized_qTags: normalizedQTags
    });
    
    // Ortak etiketleri bul
    let matchingTags = [];
    
    normalizedHapTags.forEach(hapTag => {
      normalizedQTags.forEach(qTag => {
        // TAM EŞLEŞMELERİ kontrol et
        if (hapTag === qTag) {
          matchingTags.push({ hapTag, qTag, type: 'exact' });
        }
        // KISMEN EŞLEŞMELERİ kontrol et
        else if (hapTag.includes(qTag) || qTag.includes(hapTag)) {
          matchingTags.push({ hapTag, qTag, type: 'partial' });
        }
        // KELİME BAZINDA EŞLEŞMELERİ kontrol et
        else {
          const hapWords = hapTag.split(/[\s\-_]+/);
          const qWords = qTag.split(/[\s\-_]+/);
          
          const hasWordMatch = hapWords.some(hw => 
            qWords.some(qw => hw === qw || hw.includes(qw) || qw.includes(hw))
          );
          
          if (hasWordMatch) {
            matchingTags.push({ hapTag, qTag, type: 'word_match' });
          }
        }
      });
    });
    
    // Tekrarlanan eşleşmeleri kaldır
    const uniqueMatches = matchingTags.filter((match, index, arr) => 
      index === arr.findIndex(m => m.hapTag === match.hapTag && m.qTag === match.qTag)
    );
    
    // Benzerlik skorunu hesapla - DÜZELTME
    const totalTags = Math.max(normalizedHapTags.length, normalizedQTags.length);
    const similarity = totalTags > 0 ? (uniqueMatches.length / totalTags) * 100 : 0;
    
    console.log('🏷️ Tag similarity calculation result:', {
      matchingTags: uniqueMatches,
      totalTags,
      uniqueMatchesCount: uniqueMatches.length,
      similarity: `${similarity.toFixed(1)}%`,
      calculation: `${uniqueMatches.length} / ${totalTags} * 100 = ${similarity.toFixed(1)}%`
    });
    
    return Math.round(similarity);
  };

  // İçerik benzerliği hesapla (basit keyword matching)
  const calculateContentSimilarity = (hapBilgiContent, questionContent) => {
    if (!hapBilgiContent || !questionContent) return 0;
    
    const hapWords = hapBilgiContent.toLowerCase().split(/\s+/);
    const qWords = questionContent.toLowerCase().split(/\s+/);
    
    // Önemli kelimeleri filtrele (3+ karakter)
    const hapKeywords = hapWords.filter(word => word.length >= 3);
    const qKeywords = qWords.filter(word => word.length >= 3);
    
    if (hapKeywords.length === 0 || qKeywords.length === 0) return 0;
    
    // Ortak kelimeleri bul
    const commonKeywords = hapKeywords.filter(word => 
      qKeywords.includes(word)
    );
    
    // Benzerlik yüzdesi hesapla
    const similarity = (commonKeywords.length / Math.max(hapKeywords.length, qKeywords.length)) * 100;
    
    return Math.round(similarity);
  };

  const loadSimilarQuestions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading similar questions for:', {
        title: hapBilgiTitle,
        tags: hapBilgiTags,
        content: hapBilgiContent?.substring(0, 100) + '...'
      });
      
      // 1. Backend'den gerçek soruları getir
      const realQuestionsResult = await postsService.getSimilarQuestionsByTags(
        hapBilgiTags || [], 
        15 // Daha fazla soru getir
      );
      
      console.log('📡 Real questions result:', realQuestionsResult);
      
      if (realQuestionsResult.success && realQuestionsResult.data.length > 0) {
        // 2. Her soru için benzerlik skorunu hesapla
        const questionsWithSimilarity = realQuestionsResult.data.map((question, index) => {
                     console.log(`🔍 Processing question ${index + 1}:`, {
             id: question._id,
             content: question.content?.substring(0, 50) + '...',
             tags: question.tags || question.topicTags || [],
             hapBilgiTags: hapBilgiTags,
             user: question.user,
             userId: question.userId,
             userInfo: {
               name: question.user?.name || question.userId?.name,
               username: question.user?.username || question.userId?.username,
               avatar: question.user?.avatar || question.userId?.avatar,
               id: question.user?._id || question.userId?._id || question.userId?.id
             }
           });
          
          // Etiket benzerliği hesapla
          const tagSimilarity = calculateTagSimilarity(hapBilgiTags, question.tags || question.topicTags);
          
          // İçerik benzerliği hesapla
          const contentSimilarity = calculateContentSimilarity(
            hapBilgiContent, 
            question.content || question.caption || ''
          );
          
          // Genel benzerlik skoru (etiket %60, içerik %40)
          const overallSimilarity = Math.round(
            (tagSimilarity * 0.6) + (contentSimilarity * 0.4)
          );
          
          console.log('📊 Similarity scores for question:', {
            id: question._id,
            tagSimilarity: `${tagSimilarity}%`,
            contentSimilarity: `${contentSimilarity}%`,
            overallSimilarity: `${overallSimilarity}%`
          });
          
                     // Kullanıcı bilgilerini doğru al
           const userInfo = question.user || question.userId || {};
           const username = userInfo.name || userInfo.username || 'Bilinmeyen Kullanıcı';
           const userAvatar = userInfo.avatar || null;
           const userId = userInfo._id || userInfo.id;
           
           return {
             _id: question._id,
             username: username,
             userAvatar: userAvatar,
             userId: userId,
             timeAgo: formatTimeAgo(question.createdAt),
             content: question.content || question.caption || 'Soru içeriği bulunamadı',
             similarityScore: overallSimilarity,
             tagSimilarity: tagSimilarity,
             contentSimilarity: contentSimilarity,
             commentCount: question.commentCount || question.comments?.length || 0,
             likes: question.likes?.length || 0,
             views: question.views || 0,
             postId: question._id,
             tags: question.tags || question.topicTags || [],
             postType: question.postType || 'soru',
             hasImage: !!question.imageURL || !!question.image || !!question.images
           };
        });
        
        // 3. Benzerlik skoruna göre sırala (yüksekten düşüğe)
        const sortedQuestions = questionsWithSimilarity
          .filter(q => q.similarityScore > 0) // Herhangi bir benzerlik varsa göster
          .sort((a, b) => b.similarityScore - a.similarityScore)
          .slice(0, 10); // En iyi 10 soruyu al
        
        console.log('✅ Final similar questions:', sortedQuestions.length);
        setQuestions(sortedQuestions);
      } else {
        console.log('❌ No real questions found');
        setQuestions([]);
      }
    } catch (error) {
      console.error('❌ Benzer sorular yükleme hatası:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Zaman formatla
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Şimdi';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Şimdi';
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}g`;
    
    return date.toLocaleDateString('tr-TR');
  };

     const handleQuestionPress = (question) => {
     onClose();
     // Post detay sayfasına git
     navigation.navigate('PostDetail', { postId: question.postId });
   };

   const handleUserPress = (question) => {
     if (question.userId) {
       onClose();
       // Kullanıcı profil sayfasına git
       navigation.navigate('UserProfile', { userId: question.userId });
     }
   };

  const renderQuestionCard = (question, index) => (
    <TouchableOpacity
      key={question._id || index}
      style={styles.questionCard}
      onPress={() => handleQuestionPress(question)}
    >
      <View style={styles.questionHeader}>
                 <View style={styles.userInfo}>
           <TouchableOpacity 
             style={styles.userRow}
             onPress={() => handleUserPress(question)}
             disabled={!question.userId}
           >
             {question.userAvatar ? (
               <Image 
                 source={{ uri: question.userAvatar }} 
                 style={styles.userAvatar}
               />
             ) : (
               <View style={styles.userAvatarPlaceholder}>
                 <Text style={styles.userAvatarText}>
                   {question.username.charAt(0).toUpperCase()}
                 </Text>
               </View>
             )}
             <View style={styles.userDetails}>
               <Text style={[styles.username, question.userId && styles.clickableUsername]} numberOfLines={1}>
                 {question.username}
               </Text>
               <Text style={styles.timeAgo}>{question.timeAgo}</Text>
             </View>
           </TouchableOpacity>
         </View>
                 <View style={styles.similarityScore}>
           <View style={[
             styles.similarityBadge,
             { backgroundColor: question.similarityScore >= 70 ? '#27ae60' : 
                              question.similarityScore >= 40 ? '#f39c12' : '#e74c3c' }
           ]}>
             <Text style={styles.similarityText}>{question.similarityScore}%</Text>
           </View>
           <Text style={styles.similarityLabel}>Benzerlik</Text>
         </View>
      </View>
      
      <Text style={styles.questionText} numberOfLines={3}>
        {question.content}
      </Text>
      
      {/* Etiketler */}
      {question.tags && question.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {question.tags.slice(0, 3).map((tag, tagIndex) => (
            <View key={tagIndex} style={styles.tagItem}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {question.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{question.tags.length - 3}</Text>
          )}
        </View>
      )}
      
      <View style={styles.questionMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#7f8c8d" />
          <Text style={styles.metaText}>{question.commentCount || 0}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="heart-outline" size={16} color="#7f8c8d" />
          <Text style={styles.metaText}>{question.likes || 0}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="eye-outline" size={16} color="#7f8c8d" />
          <Text style={styles.metaText}>{question.views || 0}</Text>
        </View>
        {question.hasImage && (
          <View style={styles.metaItem}>
            <Ionicons name="image-outline" size={16} color="#7f8c8d" />
            <Text style={styles.metaText}>Görsel</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              "{hapBilgiTitle}" konusunda sorular
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Benzer sorular aranıyor...</Text>
              </View>
            ) : questions.length > 0 ? (
              <>
                <View style={styles.infoContainer}>
                  <Ionicons name="information-circle" size={20} color="#3498db" />
                  <Text style={styles.infoText}>
                    Bu konuyla ilgili {questions.length} benzer soru bulundu
                  </Text>
                </View>
                
                {questions.map((question, index) => renderQuestionCard(question, index))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#bdc3c7" />
                <Text style={styles.emptyTitle}>Benzer soru bulunamadı</Text>
                <Text style={styles.emptyText}>
                  Bu konuyla ilgili henüz başka soru sorulmamış. İlk siz sorun!
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerTitle: {
    ...FONT_STYLES.h3,
    color: '#2c3e50',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...FONT_STYLES.body,
    color: '#7f8c8d',
    marginTop: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    ...FONT_STYLES.caption,
    color: '#2c3e50',
    marginLeft: 8,
  },
  questionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
     userAvatar: {
     width: 32,
     height: 32,
     borderRadius: 16,
     marginRight: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.2,
     shadowRadius: 2,
     elevation: 2,
   },
     userAvatarPlaceholder: {
     width: 32,
     height: 32,
     borderRadius: 16,
     backgroundColor: '#3498db',
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.2,
     shadowRadius: 2,
     elevation: 2,
   },
     userAvatarText: {
     ...FONT_STYLES.caption,
     color: '#ffffff',
     fontWeight: 'bold',
     fontSize: 14,
   },
  userDetails: {
    flex: 1,
  },
     username: {
     ...FONT_STYLES.caption,
     color: '#2c3e50',
     fontWeight: '600',
   },
   clickableUsername: {
     color: '#3498db',
     textDecorationLine: 'underline',
   },
  timeAgo: {
    ...FONT_STYLES.caption,
    color: '#7f8c8d',
    fontSize: 12,
  },
     similarityScore: {
     alignItems: 'center',
   },
   similarityBadge: {
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 12,
     marginBottom: 4,
     minWidth: 40,
     alignItems: 'center',
   },
   similarityText: {
     ...FONT_STYLES.caption,
     color: '#ffffff',
     fontWeight: 'bold',
     fontSize: 12,
   },
   similarityLabel: {
     ...FONT_STYLES.caption,
     color: '#7f8c8d',
     fontSize: 10,
   },
  questionText: {
    ...FONT_STYLES.body,
    color: '#34495e',
    lineHeight: 18,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagItem: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    ...FONT_STYLES.caption,
    color: '#1976d2',
    fontSize: 11,
  },
  moreTagsText: {
    ...FONT_STYLES.caption,
    color: '#7f8c8d',
    fontSize: 11,
    alignSelf: 'center',
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    ...FONT_STYLES.caption,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    ...FONT_STYLES.h3,
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    ...FONT_STYLES.body,
    color: '#95a5a6',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default SimilarQuestionsModal; 