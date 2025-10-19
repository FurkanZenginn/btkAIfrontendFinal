
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { postsService } from '../services';
import userService from '../services/userService';
import aiService from '../services/aiService';

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'users', 'posts', 'tags'
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({
    users: [],
    posts: [],
    tags: []
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [similarContentResults, setSimilarContentResults] = useState([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  // Search input ref
  const searchInputRef = useRef(null);

  // Search types
  const searchTypes = [
    { id: 'all', title: 'Tümü', icon: 'search' },
    { id: 'users', title: 'Kullanıcılar', icon: 'people' },
    { id: 'posts', title: 'Gönderiler', icon: 'document-text' },
    { id: 'tags', title: 'Etiketler', icon: 'pricetag' },
  ];

  useEffect(() => {
    loadRecentSearches();
    loadPopularTags();
  }, []);

  // Recent searches yükle
  const loadRecentSearches = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const saved = await AsyncStorage.getItem('recent_searches');
      let savedSearches = [];
      
      if (saved) {
        savedSearches = JSON.parse(saved);
        console.log('💾 Kaydedilmiş aramalar yüklendi:', savedSearches);
      }
      
      // Sadece gerçek aramaları kullan
      setRecentSearches(savedSearches);
      
      console.log('🔍 Son aramalar yüklendi:', savedSearches);
      
    } catch (error) {
      console.error('❌ Recent searches yükleme hatası:', error);
      
      // Hata durumunda boş array kullan
      console.log('⚠️ Hata durumunda boş arama listesi kullanılıyor');
      setRecentSearches([]);
    }
  };

  // Popüler etiketleri backend'den yükle
  const loadPopularTags = async () => {
    try {
      console.log('🏷️ Popüler etiketler yükleniyor...');
      const response = await postsService.getPopularTags(20);
      
      if (response.success && response.data) {
        const tags = response.data.tags || [];
        const tagNames = tags.map(tag => `#${tag.name}`);
        setPopularTags(tagNames);
        console.log('🏷️ Popüler etiketler yüklendi:', tagNames);
      } else {
        console.log('⚠️ Popüler etiketler yüklenemedi, boş liste kullanılıyor');
        setPopularTags([]);
      }
    } catch (error) {
      console.error('❌ Popüler etiketler yükleme hatası:', error);
      // Hata durumunda boş liste kullan
      setPopularTags([]);
    }
  };

  // Etiket bazlı benzer içerik bul
  const findSimilarContentByTags = async (tags) => {
    try {
      setIsLoadingSimilar(true);
      console.log('🔍 Etiket bazlı benzer içerik aranıyor:', tags);
      
      // 1. Backend'den gerçek içerikleri getir
      const realContentResult = await postsService.getSimilarQuestionsByTags(tags, 10);
      
      if (realContentResult.success && realContentResult.data.length > 0) {
        // 2. AI ile benzerlik analizi yap
        const aiAnalysisResult = await aiService.analyzeSimilarity({
          question: `Bu etiketlerle ilgili içerikler: ${tags.join(', ')}`,
          tags: tags
        });
        
        // 3. Gerçek içerikleri AI analizi ile birleştir
        const contentWithSimilarity = realContentResult.data.map((content, index) => {
          // AI'dan gelen benzerlik skorunu kullan (varsa)
          let similarityScore = 85; // Varsayılan skor
          
          if (aiAnalysisResult.success && aiAnalysisResult.data?.aiResponse) {
            try {
              const aiResponse = aiAnalysisResult.data.aiResponse;
              if (aiResponse.includes('%')) {
                const scoreMatch = aiResponse.match(/(\d+)%/);
                if (scoreMatch) {
                  similarityScore = parseInt(scoreMatch[1]);
                }
              }
            } catch (error) {
              console.log('AI response parse hatası, varsayılan skor kullanılıyor');
            }
          }
          
          return {
            _id: content._id,
            title: content.content?.substring(0, 100) + '...' || 'İçerik bulunamadı',
            similarityScore: similarityScore - (index * 5), // İndekse göre azalan skor
            type: content.postType || 'post',
            tags: content.topicTags || []
          };
        });
        
        setSimilarContentResults(contentWithSimilarity);
      } else {
        console.log('Gerçek içerik bulunamadı');
        setSimilarContentResults([]);
      }
    } catch (error) {
      console.error('Benzer içerik arama hatası:', error);
      setSimilarContentResults([]);
    } finally {
      setIsLoadingSimilar(false);
    }
  };



  // Search yap
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Uyarı', 'Lütfen arama yapmak için bir kelime girin.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔍 Search başlatılıyor:', searchQuery, 'Type:', searchType);
      
      // Recent search'e ekle
      addToRecentSearches(searchQuery);
      
      // Backend API çağrısı
      const results = await searchFromBackend(searchQuery, searchType);
      
      // Results'ı güvenli hale getir
      const safeResults = {
        users: results?.users || [],
        posts: results?.posts || [],
        tags: results?.tags || []
      };
      
      setSearchResults(safeResults);
      
      console.log('✅ Search tamamlandı:', results);
    } catch (error) {
      console.error('❌ Search hatası:', error);
      Alert.alert('Hata', 'Arama yapılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Backend'den arama yap
  const searchFromBackend = async (query, type) => {
    try {
      console.log('🌐 Backend search çağrısı:', { query, type });
      
      let allResults = {
        users: [],
        posts: [],
        tags: []
      };
      
      // Post arama API'si
      if (type === 'all' || type === 'posts') {
        const searchParams = {
          page: 1,
          limit: 20
        };
        
        // Etiket araması için
        if (query.startsWith('#')) {
          const tagName = query.substring(1); // # işaretini kaldır
          searchParams.tags = tagName;
        } else {
          // Normal metin araması
          searchParams.q = query;
        }
        
        console.log('🔍 Post search params:', searchParams);
        const response = await postsService.searchPostsAdvanced(searchParams);
        
        if (response.success && response.data) {
          // Nested response yapısını düzelt
          const posts = response.data?.data?.posts || response.data?.posts || response.data || [];
          console.log('📝 Bulunan postlar:', posts.length);
          console.log('📝 Response data:', response.data);
          
          allResults.posts = Array.isArray(posts) ? posts.map(post => ({
            id: post._id,
            title: post.content?.substring(0, 50) + '...',
            content: post.content,
            author: post.user?.username || 'Anonim',
            authorAvatar: post.user?.avatar || 'https://via.placeholder.com/30',
            likes: post.likes?.length || 0,
            comments: post.comments?.length || 0,
            tags: post.topicTags || [],
            createdAt: formatDate(post.createdAt)
          })) : [];
        }
      }
      
      // Kullanıcı arama (gerçek API)
      if (type === 'all' || type === 'users') {
        console.log('👥 Kullanıcı arama yapılıyor:', query);
        const response = await userService.searchUsers(query, 1, 20);
        
        if (response.success && response.data) {
          // Nested response yapısını düzelt
          const users = response.data?.data?.users || response.data?.users || response.data || [];
          console.log('👥 Bulunan kullanıcılar:', users.length);
          console.log('👥 Response data:', response.data);
          console.log('👥 Users array:', users);
          console.log('👥 Response success:', response.success);
          console.log('👥 Response error:', response.error);
          
          allResults.users = Array.isArray(users) ? users.map(user => ({
            id: user._id || user.id,
            username: user.name, // Backend'de sadece name var
            fullName: user.name, // Backend'de sadece name var
            avatar: user.avatar || 'https://via.placeholder.com/50',
            followers: user.followersCount || 0, // Backend'de followersCount
            posts: 0, // Backend'de posts count yok
            isFollowing: false // Backend'de isFollowing yok
          })) : [];
        } else {
          console.log('❌ Kullanıcı arama başarısız:', response);
        }
      }
      
      // Etiket arama
      if (type === 'all' || type === 'tags') {
        console.log('🏷️ Etiket arama yapılıyor:', query);
        const response = await postsService.getPopularTags(50);
        
        if (response.success && response.data) {
          // Nested response yapısını düzelt
          const allTags = response.data?.data?.tags || response.data?.tags || [];
          const searchTerm = query.toLowerCase().replace('#', '');
          const filteredTags = Array.isArray(allTags) ? allTags.filter(tag =>
            tag.name.toLowerCase().includes(searchTerm)
          ) : [];
          
          console.log('🏷️ Bulunan etiketler:', filteredTags.length);
          console.log('🏷️ Response data:', response.data);
          
          allResults.tags = filteredTags.map(tag => ({
            tag: `#${tag.name}`,
            count: tag.count || 0
          }));
        }
      }
      
      console.log('🎯 Tüm sonuçlar:', allResults);
      return allResults;
      
    } catch (error) {
      console.error('❌ Backend search hatası:', error);
      return { users: [], posts: [], tags: [] };
    }
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return 'Az önce';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
  };

  // Recent search'e ekle
  const addToRecentSearches = async (query) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Recent search kaydetme hatası:', error);
    }
  };

  // Recent search'ten sil
  const removeFromRecentSearches = async (queryToRemove) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const updated = recentSearches.filter(s => s !== queryToRemove);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
      console.log('🗑️ Arama silindi:', queryToRemove);
    } catch (error) {
      console.error('❌ Arama silme hatası:', error);
    }
  };

  // Tag'a tıkla
  const handleTagPress = (tag) => {
    setSelectedTag(tag);
    setSearchQuery(tag);
    setSearchType('tags');
    
    // Etiket bazlı benzer içerik bul
    const cleanTag = tag.replace('#', '');
    findSimilarContentByTags([cleanTag]);
    
    performSearch();
  };

  // Recent search'e tıkla
  const handleRecentSearchPress = (query) => {
    setSearchQuery(query);
    performSearch();
  };

  // Kullanıcıya tıkla
  const handleUserPress = (user) => {
    navigation.navigate('Profile', { 
      screen: 'UserProfileScreen',
      params: { 
        userId: user.id, 
        username: user.username,
        avatar: user.avatar // Avatar URL'i de gönder
      }
    });
  };

  // Gönderiye tıkla
  const handlePostPress = (post) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  // Follow/Unfollow
  const handleFollowToggle = (user) => {
    // API çağrısı yapılacak
    console.log('Follow/Unfollow:', user.username);
  };

  // Render functions
  const renderSearchTypeButton = (type) => (
  <TouchableOpacity
      key={type.id}
      style={[
        styles.searchTypeButton,
        searchType === type.id && styles.searchTypeButtonActive
      ]}
      onPress={() => setSearchType(type.id)}
    >
      <Ionicons 
        name={type.icon} 
        size={16} 
        color={searchType === type.id ? '#fff' : '#6b7280'} 
      />
      <Text style={[
        styles.searchTypeText,
        searchType === type.id && styles.searchTypeTextActive
      ]}>
        {type.title}
      </Text>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
    >
      <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userFullName}>{item.fullName}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
        <Text style={styles.userStats}>
          {item.followers} takipçi • {item.posts} gönderi
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          item.isFollowing && styles.followingButton
        ]}
        onPress={() => handleFollowToggle(item)}
      >
        <Text style={[
          styles.followButtonText,
          item.isFollowing && styles.followingButtonText
        ]}>
          {item.isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSimilarContentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.similarContentItem}
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.similarContentHeader}>
        <View style={styles.similarityBadge}>
          <Text style={styles.similarityText}>{item.similarityScore}%</Text>
        </View>
        <Text style={styles.similarContentType}>{item.type}</Text>
      </View>
      <Text style={styles.similarContentTitle}>{item.title}</Text>
      {item.tags && item.tags.length > 0 && (
        <View style={styles.similarContentTags}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <Text key={index} style={styles.similarContentTag}>#{tag}</Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.postItem}
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.postHeader}>
        <Image source={{ uri: item.authorAvatar }} style={styles.postAuthorAvatar} />
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>@{item.author}</Text>
          <Text style={styles.postTime}>{item.createdAt}</Text>
        </View>
      </View>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>
        {item.content}
      </Text>
      <View style={styles.postTags}>
        {item.tags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            style={styles.postTag}
            onPress={() => handleTagPress(tag)}
          >
            <Text style={styles.postTagText}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.postStats}>
        <View style={styles.postStat}>
          <Ionicons name="heart" size={12} color="#ef4444" />
          <Text style={styles.postStatText}>{item.likes}</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="chatbubble" size={12} color="#6b7280" />
          <Text style={styles.postStatText}>{item.comments}</Text>
        </View>
      </View>
  </TouchableOpacity>
);

  const renderTagItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.tagItem}
      onPress={() => handleTagPress(item.tag)}
    >
      <Text style={styles.tagText}>{item.tag}</Text>
      <Text style={styles.tagCount}>{item.count} gönderi</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={48} color="#9ca3af" />
      <Text style={styles.emptyStateTitle}>Arama Sonucu Bulunamadı</Text>
      <Text style={styles.emptyStateText}>
        "{searchQuery}" için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arama</Text>
        </View>

      {/* Search Input */}
        <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={16} color="#6b7280" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={performSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={performSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Types */}
      <View style={styles.searchTypesContainer}>
        <View style={styles.searchTypesContent}>
          {searchTypes.map(renderSearchTypeButton)}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.length === 0 ? (
          // Ana sayfa - Recent searches ve popular tags
          <View>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Son Aramalar</Text>
                                 {recentSearches.map((search, index) => (
                   <View key={index} style={styles.recentSearchItem}>
                     <TouchableOpacity
                       style={styles.recentSearchContent}
                       onPress={() => handleRecentSearchPress(search)}
                     >
                       <Ionicons name="time" size={14} color="#6b7280" />
                       <Text style={styles.recentSearchText}>{search}</Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                       style={styles.recentSearchDeleteButton}
                       onPress={() => removeFromRecentSearches(search)}
                     >
                       <Ionicons name="close" size={14} color="#9ca3af" />
                     </TouchableOpacity>
                   </View>
             ))}
          </View>
            )}

            {/* Popular Tags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popüler Etiketler</Text>
              <View style={styles.tagsContainer}>
                {popularTags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.popularTag}
                    onPress={() => handleTagPress(tag)}
                  >
                  <Text style={styles.popularTagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            

          </View>
        </View>
        ) : (
          // Search results
          <View>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingText}>Aranıyor...</Text>
              </View>
            ) : (
              <View>
                {/* Users */}
                {searchResults.users.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kullanıcılar</Text>
                    <FlatList
                      data={searchResults.users}
                      renderItem={renderUserItem}
                      keyExtractor={(item) => item.id.toString()}
                      scrollEnabled={false}
                    />
                  </View>
                )}

                {/* Posts */}
                {searchResults.posts.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gönderiler</Text>
                    <FlatList
                      data={searchResults.posts}
                      renderItem={renderPostItem}
                      keyExtractor={(item) => item.id.toString()}
                      scrollEnabled={false}
                    />
                  </View>
                )}

                {/* Tags */}
                {searchResults.tags.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Etiketler</Text>
                    <FlatList
                      data={searchResults.tags}
                      renderItem={renderTagItem}
                      keyExtractor={(item) => item.tag}
                      scrollEnabled={false}
                    />
                  </View>
                )}

                {/* Benzer İçerik */}
                {similarContentResults.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Benzer İçerik</Text>
                    {isLoadingSimilar ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#8b5cf6" />
                        <Text style={styles.loadingText}>Benzer içerik aranıyor...</Text>
                      </View>
                    ) : (
                      <FlatList
                        data={similarContentResults}
                        renderItem={renderSimilarContentItem}
                        keyExtractor={(item) => item._id}
                        scrollEnabled={false}
                      />
                    )}
                  </View>
                )}

                {/* Empty State */}
                {searchResults.users.length === 0 && 
                 searchResults.posts.length === 0 && 
                 searchResults.tags.length === 0 && 
                 similarContentResults.length === 0 && (
                  renderEmptyState()
                )}
              </View>
            )}
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 8,
  },
  searchButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 6,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchTypesContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  searchTypesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    gap: 6,
  },
  searchTypeButtonActive: {
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchTypeText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  searchTypeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
     recentSearchItem: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 8,
     paddingHorizontal: 10,
     backgroundColor: '#f9fafb',
     borderRadius: 6,
     marginBottom: 4,
   },
   recentSearchContent: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     gap: 6,
   },
   recentSearchDeleteButton: {
     padding: 4,
     borderRadius: 12,
     backgroundColor: '#e5e7eb',
   },
  recentSearchText: {
    fontSize: 13,
    color: '#374151',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  popularTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularTagText: {
    fontSize: 11,
    color: '#3730a3',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: '#f9fafb',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userFullName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  userUsername: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  userStats: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followingButton: {
    backgroundColor: '#e5e7eb',
  },
  followButtonText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  followingButtonText: {
    color: '#6b7280',
  },
  postItem: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAuthorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  postAuthorInfo: {
    marginLeft: 8,
  },
  postAuthorName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  postTime: {
    fontSize: 10,
    color: '#9ca3af',
  },
  postTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  postContent: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 6,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 6,
  },
  postTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  postTagText: {
    fontSize: 10,
    color: '#6b7280',
  },
  postStats: {
    flexDirection: 'row',
    gap: 8,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  postStatText: {
    fontSize: 10,
    color: '#6b7280',
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  tagCount: {
    fontSize: 11,
    color: '#9ca3af',
  },
  similarContentItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  similarContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  similarityBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  similarityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  similarContentType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  similarContentTitle: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  similarContentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  similarContentTag: {
    fontSize: 12,
    color: '#8b5cf6',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },

});
