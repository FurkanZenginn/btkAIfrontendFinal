import api, { API_ENDPOINTS } from './api';
import authService from './authService';

class PostsService {
  // Etiketlere göre benzer sorular getir (post ekranındaki postlardan)
  async getSimilarQuestionsByTags(tags, limit = 10) {
    try {
      console.log('🔍 Getting similar questions by tags:', tags);
      
      // Kullanıcı ID'sini al
      const user = await authService.getUser();
      const userId = user?._id;
      console.log('🔍 Similar Questions - User ID:', userId);
      
      // Etiketleri normalize et ve filtrele
      const normalizedTags = Array.isArray(tags) 
        ? tags.map(tag => tag.replace('#', '').toLowerCase())
        : [tags?.replace('#', '').toLowerCase()].filter(Boolean);
      
      console.log('🏷️ Normalized tags:', normalizedTags);
      
      // 1. Önce post ekranındaki tüm postları getir (daha fazla veri için)
      const allPostsResponse = await api.get(
        `${API_ENDPOINTS.POSTS.LIST}?limit=50&type=all`
      );
      
             console.log('📡 All posts response:', allPostsResponse);
       
       if (!allPostsResponse.success || !allPostsResponse.data) {
         console.log('❌ Failed to fetch posts');
         return { success: false, data: [] };
       }
       
       // Backend'den gelen veri yapısını kontrol et (çift data sarması var)
       const postsData = allPostsResponse.data?.data || allPostsResponse.data;
       const allPosts = postsData?.posts || postsData || [];
       
       console.log('🔍 Data structure debug:');
       console.log('  - allPostsResponse.data:', allPostsResponse.data);
       console.log('  - postsData:', postsData);
       console.log('  - allPosts:', allPosts);
       console.log('  - allPosts type:', typeof allPosts);
       console.log('  - allPosts is array:', Array.isArray(allPosts));
       console.log('📊 Total posts fetched:', allPosts.length);
      
      // 2. Etiketlere göre filtrele
      const filteredPosts = allPosts.filter(post => {
        // Post'un etiketlerini al
        const postTags = post.tags || post.topicTags || [];
        const normalizedPostTags = Array.isArray(postTags) 
          ? postTags.map(tag => tag.replace('#', '').toLowerCase())
          : [postTags?.replace('#', '').toLowerCase()].filter(Boolean);
        
        // Hap Bilgi etiketleri ile post etiketlerini karşılaştır
        const hasMatchingTag = normalizedTags.some(hapTag => 
          normalizedPostTags.some(postTag => 
            postTag.includes(hapTag) || hapTag.includes(postTag)
          )
        );
        
        console.log('🏷️ Post tag comparison:', {
          postId: post._id,
          hapTags: normalizedTags,
          postTags: normalizedPostTags,
          hasMatch: hasMatchingTag
        });
        
        return hasMatchingTag;
      });
      
      console.log('📊 Posts with matching tags:', filteredPosts.length);
      
             // 3. Daha geniş post tipi filtresi - soru, danışma, tartışma hepsi
       console.log('🔍 Post type filtering debug:');
       filteredPosts.forEach((post, index) => {
         const isSoru = post.postType === 'soru';
         const isQuestion = post.postType === 'question';
         const isDanisma = post.postType === 'danışma';
         const isTartisma = post.postType === 'tartışma';
         const hasQuestionMark = post.content?.includes('?') || post.caption?.includes('?');
         const passes = isSoru || isQuestion || isDanisma || isTartisma || hasQuestionMark;
         
         console.log(`  Post ${index + 1}:`, {
           id: post._id.substring(post._id.length - 6),
           postType: post.postType,
           isSoru,
           isQuestion,
           isDanisma,
           isTartisma,
           hasQuestionMark,
           passes,
           content: (post.content || post.caption || '').substring(0, 30) + '...'
         });
       });
       
       const questionPosts = filteredPosts.filter(post => 
         post.postType === 'soru' || post.postType === 'question' || 
         post.postType === 'danışma' || post.postType === 'tartışma' ||
         post.content?.includes('?') || post.caption?.includes('?')
       );
       
       console.log('📊 Question posts found:', questionPosts.length);
      
      // 4. Tekrarlanan postları kaldır
      const uniqueQuestions = questionPosts.filter((post, index, self) => 
        index === self.findIndex(p => p._id === post._id)
      );
      
      // 5. Tarihe göre sırala (yeni önce)
      const sortedQuestions = uniqueQuestions.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      console.log('✅ Final similar questions:', sortedQuestions.length);
      
      return {
        success: true,
        data: sortedQuestions.slice(0, limit)
      };
    } catch (error) {
      console.error('❌ Get similar questions error:', error);
      return { success: false, data: [] };
    }
  }

  // Post listesi getir (public feed)
  async getPosts(page = 1, limit = 10) {
    try {
      console.log('🌐 getPosts function called');
      console.log('🌐 Calling API:', `${API_ENDPOINTS.POSTS.LIST}?page=${page}&limit=${limit}`);
      
      // Public endpoint - token gerektirmez
      console.log('🔓 Public endpoint - no token required');
      
      // Tüm postları getir (isModerated filter'ı olmadan)
      const response = await api.get(
        `${API_ENDPOINTS.POSTS.LIST}?page=${page}&limit=${limit}`
      );
      console.log('📡 API Response:', response);
      return response;
    } catch (error) {
      console.error('❌ Get posts error:', error);
      return { success: false, error: 'Postlar yüklenirken bir hata oluştu.' };
    }
  }

  // Yeni gönderileri kontrol et
  async checkNewPosts(lastSeenPostId = null) {
    try {
      console.log('🔍 checkNewPosts function called');
      console.log('🔍 Last seen post ID:', lastSeenPostId);
      
      // Backend'de /latest endpoint'i sorun çıkarıyor, normal posts endpoint'ini kullan
      const url = lastSeenPostId 
        ? `${API_ENDPOINTS.POSTS.LIST}?lastSeenPostId=${lastSeenPostId}&limit=5`
        : `${API_ENDPOINTS.POSTS.LIST}?limit=5`;
      
      console.log('🌐 Calling API:', url);
      
      const response = await api.get(url);
      console.log('📡 Check new posts response:', response);
      
      // Backend'den gelen veriyi kontrol et
      if (response.success && response.data) {
        const newPosts = response.data.posts || response.data;
        const currentPostIds = new Set(); // Mevcut post ID'lerini set'e ekle
        
        // Yeni post var mı kontrol et
        const hasNewPosts = newPosts.length > 0 && lastSeenPostId && 
          newPosts.some(post => post._id !== lastSeenPostId);
        
        return {
          success: true,
          data: {
            hasNewPosts: hasNewPosts,
            newPosts: newPosts
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Check new posts error:', error);
      return { success: false, error: 'Yeni gönderiler kontrol edilirken hata oluştu.' };
    }
  }

  // Yeni post oluştur (görsel ile)
  async createPostWithImage(postData, imageFile = null) {
    try {
      const token = await authService.getToken();
      console.log('🔐 CreatePostWithImage - Token:', token ? 'Token var' : 'Token yok');
      
      if (!token) {
        console.log('❌ CreatePostWithImage - No token found');
        return { success: false, error: 'Token eksik' };
      }
      
      const formData = new FormData();
      
      // Backend'in beklediği EN TEMEL alanlar (sadece 3-4 field)
      if (postData.content) formData.append('content', postData.content);
      if (postData.caption) formData.append('caption', postData.caption);
      if (postData.postType) formData.append('postType', postData.postType);
      
      // Etiketleri ekle (varsa) - Backend topicTags field'ını bekliyor
      if (postData.tags && postData.tags.length > 0) {
        formData.append('topicTags', postData.tags.join(','));
        console.log('🏷️ Tags added to FormData as topicTags:', postData.tags);
      }
      
      // User bilgilerini al
      const user = await authService.getUser();
      console.log('👤 User data:', user);
      
      if (user && user._id) {
        formData.append('userId', user._id);
        console.log('👤 User ID added:', user._id);
      } else {
        console.log('❌ No user data found');
        return { success: false, error: 'Kullanıcı bilgileri bulunamadı' };
      }
      
      // Görsel dosyasını ekle (backend sadece "image" alanını bekliyor)
      if (imageFile) {
        // Görsel dosyasını doğru formatta ekle
        const imageData = {
          uri: imageFile.uri,
          type: imageFile.type || 'image/jpeg',
          name: imageFile.name || 'image.jpg',
        };
        
        // ✅ DOĞRU: Sadece "image" alanını kullan
        formData.append('image', imageData);
        console.log('✅ image alanı eklendi:', imageData);
        
        console.log('📸 Image appended to FormData with correct field name');
      } else {
        console.log('⚠️ No image provided');
        return { success: false, error: 'Görsel zorunludur' };
      }
      
      console.log('🌐 Creating post with FormData fields:', {
        content: postData.content,
        caption: postData.caption,
        postType: postData.postType,
        tags: postData.tags,
        topicTags: postData.topicTags,
        isFromAI: postData.isFromAI,
        aiPrompt: postData.aiPrompt,
        aiResponseType: postData.aiResponseType,
        hasImage: !!imageFile
      });
      
      // FormData'yı debug et
      console.log('📋 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  - ${key}:`, value);
      }
      
      console.log('🔐 About to make API request with token:', token ? 'Token var' : 'Token yok');
      console.log('🔐 Token value:', token);
      console.log('🔐 Token type:', typeof token);
      console.log('🔐 Token length:', token ? token.length : 0);
      
      // ✅ Content-Type header'ı GEREKSİZ - FormData otomatik ayarlar
      const response = await api.post(
        API_ENDPOINTS.POSTS.CREATE,
        formData,
        token
      );
      console.log('📡 Create post response:', response);
      
      // 🔧 GÖRSEL YÜKLEME: Hata analizi
      if (!response.success) {
        console.log('❌ Görsel yükleme hatası:');
        console.log('  - Error message:', response.error);
        console.log('  - Status code:', response.status);
        console.log('  - Full response:', response);
        
        // "Unexpected field" hatası için özel analiz
        if (response.error && response.error.includes('Unexpected field')) {
          console.log('🔧 "Unexpected field" hatası tespit edildi!');
          console.log('🔧 Backend farklı alan adı bekliyor olabilir.');
          console.log('🔧 Önerilen çözümler:');
          console.log('  1. Backend\'de Multer konfigürasyonunu kontrol et');
          console.log('  2. Farklı alan adları dene (postImage, file, media)');
          console.log('  3. Backend loglarını kontrol et');
        }
      } else {
        console.log('✅ Görsel yükleme başarılı!');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Create post error:', error);
      return { success: false, error: 'Post oluşturulurken bir hata oluştu.' };
    }
  }

  // Kişiselleştirilmiş post listesi getir (authenticated users)
  async getPersonalizedPosts(page = 1, limit = 10) {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        `${API_ENDPOINTS.POSTS.PERSONALIZED}?page=${page}&limit=${limit}`,
        token
      );
      return response;
    } catch (error) {
      console.error('Get personalized posts error:', error);
      return { success: false, error: 'Kişiselleştirilmiş postlar yüklenirken bir hata oluştu.' };
    }
  }

  // Tekil post getir
  async getPost(postId) {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        API_ENDPOINTS.POSTS.DETAIL(postId),
        token
      );
      return response;
    } catch (error) {
      console.error('Get post error:', error);
      return { success: false, error: 'Post yüklenirken bir hata oluştu.' };
    }
  }

  // Yeni post oluştur (görselsiz)
  async createPost(postData) {
    try {
      const token = await authService.getToken();
      console.log('🔐 CreatePost - Token:', token ? 'Token var' : 'Token yok');
      
      if (!token) {
        console.log('❌ CreatePost - No token found');
        return { success: false, error: 'Token eksik' };
      }

      // Backend'in beklediği field'ları hazırla
      const requestData = {
        postType: postData.postType,
        content: postData.content, // Backend 'content' field'ını bekliyor
      };

      // Etiketleri ekle (varsa) - Backend topicTags field'ını bekliyor
      if (postData.tags && postData.tags.length > 0) {
        requestData.topicTags = postData.tags.join(',');
        console.log('🏷️ Tags added to request as topicTags:', postData.tags);
      }

      console.log('📝 Creating text-only post with data:', requestData);
      
      const response = await api.post(
        API_ENDPOINTS.POSTS.CREATE,
        requestData,
        token
      );
      return response;
    } catch (error) {
      console.error('Create post error:', error);
      return { success: false, error: 'Post oluşturulurken bir hata oluştu.' };
    }
  }

  // Post güncelle
  async updatePost(postId, postData) {
    try {
      const token = await authService.getToken();
      const response = await api.put(
        API_ENDPOINTS.POSTS.UPDATE(postId),
        postData,
        token
      );
      return response;
    } catch (error) {
      console.error('Update post error:', error);
      return { success: false, error: 'Post güncellenirken bir hata oluştu.' };
    }
  }

  // Post sil
  async deletePost(postId) {
    try {
      console.log('🗑️ deletePost called with postId:', postId);
      
      const token = await authService.getToken();
      console.log('🗑️ Token available:', !!token);
      
      if (!token) {
        console.error('🗑️ No token available for delete');
        return { success: false, error: 'Kimlik doğrulama gerekli' };
      }
      
      // API endpoint'ini kullan
      const response = await api.delete(
        API_ENDPOINTS.POSTS.DELETE(postId),
        token
      );
      
      console.log('🗑️ Delete response:', response);
      
      if (response.success) {
        console.log('🗑️ Delete successful');
        return response;
      } else {
        console.error('🗑️ Delete failed:', response.error);
        return response;
      }
    } catch (error) {
      console.error('🗑️ Delete post error:', error);
      return { success: false, error: 'Post silinirken bir hata oluştu.' };
    }
  }

  // Post beğen/beğenme
  async toggleLike(postId) {
    try {
      const token = await authService.getToken();
      console.log('🔐 Toggle like - Token:', token ? 'Token var' : 'Token yok');
      console.log('🔐 Toggle like - Post ID:', postId);
      
      // Backend'in gerçek endpoint'ini kullan (görsellerden aldığımız bilgiye göre)
      console.log('🔐 Toggle like - Using real endpoint:', API_ENDPOINTS.POSTS.LIKE(postId));
      let response = await api.put(
        API_ENDPOINTS.POSTS.LIKE(postId),
        {},
        token
      );
      
      console.log('🔐 Toggle like - Response:', response);
      return response;
    } catch (error) {
      console.error('Toggle like error:', error);
      return { success: false, error: 'Beğeni işlemi yapılırken bir hata oluştu.' };
    }
  }

  // Post'a yorum ekle
  async addComment(postId, comment) {
    try {
      const token = await authService.getToken();
      const response = await api.post(
        API_ENDPOINTS.POSTS.COMMENT(postId),
        { comment },
        token
      );
      return response;
    } catch (error) {
      console.error('Add comment error:', error);
      return { success: false, error: 'Yorum eklenirken bir hata oluştu.' };
    }
  }

  // Tek bir post'u getir
  async getPostById(postId) {
    try {
      console.log('📱 getPostById called with postId:', postId);
      const token = await authService.getToken();
      
      const response = await api.get(
        `${API_ENDPOINTS.POSTS.GET_BY_ID(postId)}`,
        token
      );
      console.log('📱 getPostById response:', response);
      return response;
    } catch (error) {
      console.error('Get post by id error:', error);
      return { success: false, error: 'Post detayları yüklenirken bir hata oluştu.' };
    }
  }

  // Kullanıcının postlarını getir
  async getUserPosts(userId, page = 1, limit = 10) {
    try {
      console.log('📱 getUserPosts called with userId:', userId);
      const token = await authService.getToken();
      
      // Backend'de endpoint eklendi, gerçek endpoint'i kullan
      const endpoint = API_ENDPOINTS.USERS.POSTS(userId) + `?page=${page}&limit=${limit}`;
      console.log('📱 Using real endpoint:', endpoint);
      
      const response = await api.get(endpoint, token);
      console.log('📱 getUserPosts response:', response);
      return response;
    } catch (error) {
      console.error('Get user posts error:', error);
      return { success: false, error: 'Kullanıcı postları yüklenirken bir hata oluştu.' };
    }
  }

  // Kullanıcının beğendiği postları getir
  async getLikedPosts(page = 1, limit = 10) {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        `/posts/liked?page=${page}&limit=${limit}`,
        token
      );
      return response;
    } catch (error) {
      console.error('Get liked posts error:', error);
      return { success: false, error: 'Beğenilen postlar yüklenirken bir hata oluştu.' };
    }
  }

  // Post arama
  async searchPosts(query, page = 1, limit = 10) {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        `/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
        token
      );
      return response;
    } catch (error) {
      console.error('Search posts error:', error);
      return { success: false, error: 'Post arama yapılırken bir hata oluştu.' };
    }
  }

  // Gelişmiş post arama (yeni API)
  async searchPostsAdvanced(params = {}) {
    try {
      console.log('🔍 Advanced search params:', params);
      
      const token = await authService.getToken();
      
      // Query parametrelerini oluştur
      const queryParams = new URLSearchParams();
      
      if (params.q) queryParams.append('q', params.q);
      if (params.tags) queryParams.append('tags', params.tags);
      if (params.category) queryParams.append('category', params.category);
      if (params.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const url = `/posts/search?${queryParams.toString()}`;
      console.log('🔍 Search URL:', url);
      
      const response = await api.get(url, token);
      console.log('🔍 Search response:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Advanced search error:', error);
      return { success: false, error: 'Gelişmiş arama yapılırken bir hata oluştu.' };
    }
  }

  // Popüler etiketleri getir
  async getPopularTags(limit = 20) {
    try {
      console.log('🏷️ Getting popular tags, limit:', limit);
      
      const token = await authService.getToken();
      const url = `${API_ENDPOINTS.POSTS.POPULAR_TAGS}?limit=${limit}`;
      
      console.log('🏷️ Popular tags URL:', url);
      
      const response = await api.get(url, token);
      console.log('🏷️ Popular tags response:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Get popular tags error:', error);
      return { success: false, error: 'Popüler etiketler yüklenirken bir hata oluştu.' };
    }
  }

  // Post paylaş (resim/video ile)
  async sharePost(postData, mediaFiles = []) {
    try {
      const token = await authService.getToken();
      
      // FormData oluştur (medya dosyaları için)
      const formData = new FormData();
      
      // Post verilerini ekle
      formData.append('caption', postData.caption || '');
      formData.append('location', postData.location || '');
      formData.append('privacy', postData.privacy || 'public');
      
      // Medya dosyalarını ekle (backend sadece "image" alanını bekliyor)
      mediaFiles.forEach((file, index) => {
        formData.append('image', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        });
      });

      // ✅ Sadece Authorization header'ı gerekli (FormData otomatik Content-Type ayarlar)
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      const response = await api.post(
        API_ENDPOINTS.POSTS.CREATE,
        formData,
        token,
        headers
      );
      
      return response;
    } catch (error) {
      console.error('Share post error:', error);
      return { success: false, error: 'Post paylaşılırken bir hata oluştu.' };
    }
  }

  // 🔧 GÖRSEL YÜKLEME TEST: Backend'in desteklediği alan adlarını test et
  async testBackendConfiguration() {
    try {
      console.log('🔧 Görsel yükleme test başlatılıyor...');
      
      const token = await authService.getToken();
      if (!token) {
        console.log('❌ Test için token gerekli');
        return { success: false, error: 'Token gerekli' };
      }

      // Test 1: Backend bağlantısı
      console.log('🔧 Test 1: Backend bağlantısı kontrol ediliyor...');
      const healthCheck = await api.get('/health', token);
      console.log('🔧 Health check response:', healthCheck);

      // Test 2: Posts endpoint
      console.log('🔧 Test 2: Posts endpoint kontrol ediliyor...');
      const postsTest = await api.get('/posts?limit=1', token);
      console.log('🔧 Posts test response:', postsTest);

      // Test 3: Farklı alan adları ile görsel yükleme testi
      console.log('🔧 Test 3: Görsel alan adları test ediliyor...');
      
      const testResults = {};
      
             // Test alan adları (backend loglarından gördüğümüz kadarıyla 'avatar' da var)
       const fieldNames = ['avatar', 'image', 'postImage', 'file', 'media', 'photo', 'attachment'];
      
      for (const fieldName of fieldNames) {
        try {
          console.log(`🔧 ${fieldName} alanı test ediliyor...`);
          
          const testFormData = new FormData();
          testFormData.append('content', 'Test post');
          testFormData.append('postType', 'soru');
          testFormData.append(fieldName, {
            uri: 'file://test.jpg',
            type: 'image/jpeg',
            name: 'test.jpg',
          });
          
          const fieldTest = await api.post(
            '/posts',
            testFormData,
            token,
            { 'Content-Type': 'multipart/form-data' }
          );
          
          testResults[fieldName] = {
            success: fieldTest.success,
            error: fieldTest.error,
            hasUnexpectedField: fieldTest.error && fieldTest.error.includes('Unexpected field')
          };
          
          console.log(`🔧 ${fieldName} test sonucu:`, testResults[fieldName]);
          
        } catch (error) {
          testResults[fieldName] = {
            success: false,
            error: error.message,
            hasUnexpectedField: error.message.includes('Unexpected field')
          };
          console.log(`🔧 ${fieldName} test hatası:`, error.message);
        }
      }

      // Sonuçları analiz et
      const workingFields = Object.keys(testResults).filter(field => 
        testResults[field].success && !testResults[field].hasUnexpectedField
      );
      
      const unexpectedFieldErrors = Object.keys(testResults).filter(field => 
        testResults[field].hasUnexpectedField
      );

      console.log('🔧 Test sonuçları:');
      console.log('  - Çalışan alan adları:', workingFields);
      console.log('  - "Unexpected field" hatası veren alanlar:', unexpectedFieldErrors);
      console.log('  - Tüm test sonuçları:', testResults);

      return {
        success: true,
        data: {
          healthCheck,
          postsTest,
          fieldTests: testResults,
          workingFields,
          unexpectedFieldErrors
        }
      };
    } catch (error) {
      console.error('🔧 Görsel yükleme test hatası:', error);
      return { success: false, error: 'Test sırasında hata oluştu' };
    }
  }
}

export default new PostsService(); 