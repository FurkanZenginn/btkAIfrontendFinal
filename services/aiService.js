import api, { API_ENDPOINTS } from './api';
import authService from './authService';

// API Base URL'yi al
const getApiBaseUrl = () => {
  const { Platform } = require('react-native');
  
  if (__DEV__) {
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api';
    }
    if (Platform.OS === 'ios') {
      return 'http://localhost:3000/api';
    }
    return 'http://10.0.2.2:3000/api';
  }
  
  return 'https://your-production-api.com/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🌐 AI Service API Base URL:', API_BASE_URL);

class AIService {
  // AI cevabını kullanıcı dostu hale getir
  userFriendlyResponse(aiResponse) {
    try {
      if (!aiResponse || typeof aiResponse !== 'string') {
        return aiResponse;
      }

      let filteredResponse = aiResponse;

      // Sistem talimatlarını ve teknik detayları kaldır
      const patternsToRemove = [
        // Matematik formatı talimatları
        /📐 MATEMATİK FORMATI TALİMATLARI:.*?(?=\n\n|\n$|$)/gs,
        // Sistem açıklamaları
        /Bu yapı genellikle.*?tasarlandı/g,
        /Bu yapı.*?belirli bir problemi çözmek.*?açıklamak.*?tasarlandı/gs,
        // AI'nin kendi talimatlarını açıklaması
        /Ancak, matematik.*?belirtilen format.*?talimatlarına uyarak.*?/gs,
        // Gereksiz teknik açıklamalar
        /📋.*?talimatları.*?/g,
        /🔧.*?sistem.*?/g,
        // Boş satırları temizle
        /\n\s*\n\s*\n/g,
        // Başta ve sonda fazla boşluk
        /^\s+|\s+$/g
      ];

      patternsToRemove.forEach(pattern => {
        filteredResponse = filteredResponse.replace(pattern, '');
      });

      // Basit selamlaşma için özel cevap
      if (filteredResponse.toLowerCase().includes('merhaba') && filteredResponse.length < 100) {
        return 'Merhaba! Size nasıl yardımcı olabilirim?';
      }

      // Cevap çok kısaysa ve anlamsızsa, basit bir cevap ver
      if (filteredResponse.trim().length < 20) {
        return 'Merhaba! Size nasıl yardımcı olabilirim?';
      }

      return filteredResponse.trim();
    } catch (error) {
      console.error('User friendly response error:', error);
      return aiResponse; // Hata durumunda orijinal cevabı döndür
    }
  }

  // AI ile soru sor
  async askQuestion(question, context = '') {
    try {
      console.log('🤖 AI Service - Question:', question);
      console.log('🤖 AI Service - Context:', context);
      
      const token = await authService.getToken();
      console.log('🤖 AI Service - Token:', token ? 'Token var' : 'Token yok');

      // Kullanıcı ID'sini al
      const user = await authService.getUser();
      const userId = user?._id;
      console.log('🤖 AI Service - User ID:', userId);
      
      // Backend'in beklediği format: prompt + responseType
      const requestData = { 
        prompt: question, 
        responseType: "step-by-step",
        userId: userId // Kullanıcı ID'sini ekle
      };
      console.log('🤖 AI Service - Request data:', requestData);
      
      // Timeout ile API çağrısı (2 dakika)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      try {
        const response = await api.post(
          API_ENDPOINTS.AI.QUESTION,
          requestData,
          token
        );
        clearTimeout(timeoutId);

        // AI cevabını kullanıcı dostu hale getir
        if (response.success && response.data && response.data.aiResponse) {
          response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
                 if (error.name === 'AbortError') {
           console.error('🤖 AI Timeout Error: 2 dakika bekleme süresi doldu');
           return { success: false, error: 'AI servisi çok uzun sürdü. Lütfen daha kısa bir soru sorun veya tekrar deneyin.' };
         }
        throw error;
      }
      
      console.log('🤖 AI Service - Full response:', response);
      return response;
    } catch (error) {
      console.error('Ask question error:', error);
      return { success: false, error: 'Soru sorulurken bir hata oluştu.' };
    }
  }

  // Post analizi
  async analyzePost(postId) {
    try {
      const token = await authService.getToken();
      const response = await api.post(
        `/ai/analyze-post/${postId}`,
        {},
        token
      );

      // AI cevabını kullanıcı dostu hale getir
      if (response.success && response.data && response.data.aiResponse) {
        response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
      }

      return response;
    } catch (error) {
      console.error('Analyze post error:', error);
      return { success: false, error: 'Post analizi yapılırken bir hata oluştu.' };
    }
  }

  // Hap bilgi önerisi
  async getHapBilgi(topic, context = '') {
    try {
      const token = await authService.getToken();
      const response = await api.post(
        '/hap-bilgi',
        { topic, context },
        token
      );

      // AI cevabını kullanıcı dostu hale getir
      if (response.success && response.data && response.data.aiResponse) {
        response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
      }

      return response;
    } catch (error) {
      console.error('Get hap bilgi error:', error);
      return { success: false, error: 'Hap bilgi alınırken bir hata oluştu.' };
    }
  }

  // Yorum analizi - Soru ve yorumu birlikte analiz et
  async analyzeComment(postContent, commentText, postType = 'soru') {
    try {
      console.log('🤖 AI Comment Analysis - Post:', postContent);
      console.log('🤖 AI Comment Analysis - Comment:', commentText);
      
      const token = await authService.getToken();
      
      // AI'ya gönderilecek analiz prompt'u
      const analysisPrompt = `
Soru/Yorum Analizi Görevi:

POST İÇERİĞİ: ${postContent}
POST TÜRÜ: ${postType}
KULLANICI YORUMU: ${commentText}

Lütfen şunları analiz et:
1. Sorunun konusu ve zorluk seviyesi
2. Kullanıcı yorumunun doğruluğu
3. Yorumda eksik olan noktalar
4. İyileştirme önerileri

Kısa ve öz bir analiz yap (maksimum 2-3 cümle). 
Format: "💡 [Kısa analiz ve öneri]"
      `;
      
      const requestData = { 
        prompt: analysisPrompt, 
        responseType: "direct-solution" 
      };
      
             // Retry mekanizması ile AI çağrısı
       let lastError;
       for (let attempt = 1; attempt <= 3; attempt++) {
         try {
           console.log(`🤖 AI Comment Analysis - Attempt ${attempt}/3`);
           
           // Timeout ile API çağrısı (30 saniye)
           const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 30000);
           
           try {
             const response = await api.post(
               API_ENDPOINTS.AI.QUESTION,
               requestData,
               token
             );
             
             clearTimeout(timeoutId);
             console.log('🤖 AI Comment Analysis - Response:', response);

             // AI cevabını kullanıcı dostu hale getir
             if (response.success && response.data && response.data.aiResponse) {
               response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
             }

             return response;
           } catch (timeoutError) {
             clearTimeout(timeoutId);
             if (timeoutError.name === 'AbortError') {
               console.error(`🤖 AI Comment Analysis - Attempt ${attempt} timeout`);
               throw new Error('AI servisi çok uzun sürdü');
             }
             throw timeoutError;
           }
         } catch (error) {
           lastError = error;
           console.error(`🤖 AI Comment Analysis - Attempt ${attempt} failed:`, error.message);
           
           if (attempt < 3) {
             // 3 saniye bekle ve tekrar dene
             await new Promise(resolve => setTimeout(resolve, 3000));
           }
         }
       }
      
             // Tüm denemeler başarısız
       console.error('🤖 AI Comment Analysis - All attempts failed');
       console.error('🤖 Last error details:', lastError);
       return { 
         success: false, 
         error: 'AI servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
         status: 503,
         details: lastError?.message || 'Unknown error'
       };
    } catch (error) {
      console.error('Analyze comment error:', error);
      return { success: false, error: 'Yorum analizi yapılırken bir hata oluştu.' };
    }
  }

  // Hızlı AI soru sorma (basit soru-cevap)
  async askFast(prompt, imageURL = null, conversationHistory = [], isHapBilgiRequest = false) {
    try {
      console.log('🚀 AI Fast Service - Question:', prompt);
      console.log('🚀 AI Fast Service - Conversation History:', conversationHistory);

      const token = await authService.getToken();
      console.log('🚀 AI Fast Service - Token:', token ? 'Token var' : 'Token yok');

      // Kullanıcı ID'sini al
      const user = await authService.getUser();
      const userId = user?._id;
      console.log('🚀 AI Fast Service - User ID:', userId);

      // Matematik formülleri için gelişmiş prompt iyileştirme
      let enhancedPrompt = prompt;
      
      // Matematik formatı talimatları ekle
      const mathFormatInstructions = `

📐 MATEMATİK FORMATI TALİMATLARI:
ÖNEMLİ: Matematik formüllerini şu formatta ver:
• v = v₀ + a·t (alt simge için ₀ kullan)
• x = x₀ + v₀·t + ½at² (kesir için ½ kullan)
• v² = v₀² + 2a(x-x₀) (üs için ² kullan)
• F = ma (çarpma için · kullan)
• E = mc² (üs için ² kullan)
• sin(θ) = a/c (fonksiyonlar için normal yazı)

❌ LaTeX formatı kullanma: $v = v_0 + a \cdot t$
✅ Unicode karakterler kullan: v = v₀ + a·t

`;
      
      // Konuşma geçmişi varsa ve Hap Bilgi isteği değilse, prompt'a ekle
      if (conversationHistory && conversationHistory.length > 0 && !isHapBilgiRequest) {
        const historyText = conversationHistory
          .map(msg => `${msg.role === 'user' ? 'Kullanıcı' : 'AI'}: ${msg.content}`)
          .join('\n');
        enhancedPrompt = `[KONUŞMA GEÇMİŞİ]\n${historyText}\n\n[YENİ SORU]\n${enhancedPrompt}${mathFormatInstructions}`;
      } else {
        // Hap Bilgi isteği ise sadece mevcut soruyu kullan
        enhancedPrompt = `${enhancedPrompt}${mathFormatInstructions}`;
      }
      
      // Backend'in beklediği format
      const requestData = {
        prompt: enhancedPrompt,
        responseType: 'simple', // Basit yanıt türü
        imageURL: imageURL || null,
        conversationHistory: conversationHistory || [],
        userId: userId // Kullanıcı ID'sini ekle
      };
      console.log('🚀 AI Fast Service - Request data:', requestData);

      // Timeout ile API çağrısı (60 saniye - daha uzun süre!)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 saniye

      try {
        const response = await fetch(`${API_BASE_URL}/ai/ask-with-options`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const result = await response.json();
        
        console.log('🚀 AI Fast Service - Full response:', result);
        console.log('🚀 AI Fast Service - Response status:', response.status);
        console.log('🚀 AI Fast Service - Response headers:', response.headers);
        
        // AI cevabını kullanıcı dostu hale getir
        if (result.success && result.data && result.data.aiResponse) {
          result.data.aiResponse = this.userFriendlyResponse(result.data.aiResponse);
        }
        
        // Backend'den gelen response'u doğrudan döndür
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error('🚀 AI Timeout Error: 60 saniye bekleme süresi doldu');
          return { success: false, error: 'AI servisi çok uzun sürdü. Lütfen daha kısa bir soru sorun veya tekrar deneyin.' };
        }
        throw error;
      }
    } catch (error) {
      console.error('Ask fast error:', error);

      // Hata türüne göre özel mesajlar
      let errorMessage = 'AI servisi şu anda kullanılamıyor.';

      if (error.message?.includes('Network request failed')) {
        errorMessage = 'İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'AI endpoint bulunamadı. Backend sunucusunu kontrol edin.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.';
      }

      return { success: false, error: errorMessage };
    }
  }

  // AI soruya göre hap bilgi önerileri getir
  async getHapBilgiSuggestions(prompt) {
    try {
      console.log('📚 Getting hap bilgi suggestions for prompt:', prompt);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'Giriş yapmanız gerekiyor.' };
      }

      // Kullanıcı ID'sini al
      const user = await authService.getUser();
      const userId = user?._id;
      console.log('📚 Hap Bilgi - User ID:', userId);

      // AI'ya hap bilgi önerileri için özel istek
      const requestData = {
        prompt,
        responseType: 'step-by-step', // Backend'in beklediği responseType
        requestType: 'hap-bilgi-suggestions', // Ek bilgi
        userId: userId // Kullanıcı ID'sini ekle
      };

      const response = await api.post(
        '/ai/ask-with-options',
        requestData,
        token
      );

      // AI cevabını kullanıcı dostu hale getir
      if (response.success && response.data && response.data.aiResponse) {
        response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
      }

      console.log('📚 Hap bilgi suggestions response:', response);
      return response;
    } catch (error) {
      console.error('Hap bilgi suggestions error:', error);
      return { success: false, error: 'Hap bilgi önerileri alınırken bir hata oluştu.' };
    }
  }

  // AI soru paylaşma - Post oluşturma
  async shareQuestion(content, imageUri = null, postType = 'soru', shareTags = []) {
    try {
      console.log('📝 AI Share Question - Creating post from modal');
      console.log('📝 postType:', postType);
      console.log('📝 content:', content);
      console.log('📝 imageUri:', imageUri);
      console.log('📝 shareTags:', shareTags);

      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'Giriş yapmanız gerekiyor.' };
      }

      // postsService'i import et
      const postsService = require('./postsService').default;

      // Görsel varsa FormData ile, yoksa JSON ile gönder
      if (imageUri) {
        // Görsel ile post oluştur
        const imageFile = {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'image.jpg',
        };

        const postData = {
          postType: postType,
          content: content,
          tags: shareTags, // Etiketleri ekle
        };

        console.log('📸 Creating post with image:', { postData, imageFile });
        console.log('📸 Image URI:', imageUri);
        console.log('📸 Image file object:', imageFile);
        
        const result = await postsService.createPostWithImage(postData, imageFile);
        return result;
      } else {
        // Sadece metin ile post oluştur (Twitter gibi)
        const postData = {
          postType: postType,
          content: content,
          tags: shareTags, // Etiketleri ekle
        };

        console.log('📝 Creating text-only post:', postData);
        const result = await postsService.createPost(postData);
        return result;
      }
    } catch (error) {
      console.error('shareQuestion error:', error);
      return { success: false, error: 'Paylaşım sırasında bağlantı hatası oluştu.' };
    }
  }

  // Prompt iyileştirme (yeni endpoint)
  async improvePrompt(prompt) {
    try {
      console.log('✨ AI Improve Prompt - Original:', prompt);
      
      const response = await api.post(
        '/ai/improve-prompt',
        { prompt }
      );

      // AI cevabını kullanıcı dostu hale getir
      if (response.success && response.data && response.data.aiResponse) {
        response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
      }
      
      console.log('✨ AI Improve Prompt - Response:', response);
      return response;
    } catch (error) {
      console.error('Improve prompt error:', error);
      return { success: false, error: 'Prompt iyileştirme hatası.' };
    }
  }

  // Gelişmiş AI soru sorma (eski endpoint)
  async askWithOptions(prompt, responseType = 'step-by-step', postId = null, imageURL = null) {
    try {
      const token = await authService.getToken();
      const requestData = { prompt, responseType };
      
      if (postId) requestData.postId = postId;
      if (imageURL) requestData.imageURL = imageURL;
      
      const response = await api.post(
        '/ai/ask-with-options',
        requestData,
        token
      );

      // AI cevabını kullanıcı dostu hale getir
      if (response.success && response.data && response.data.aiResponse) {
        response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
      }

      return response;
    } catch (error) {
      console.error('Ask with options error:', error);
      return { success: false, error: 'Soru sorulurken bir hata oluştu.' };
    }
  }

  // Görsel analizi
  async analyzeImage(imageURL, analysisType = 'general') {
    try {
      const token = await authService.getToken();
      const response = await api.post(
        '/ai/analyze-image',
        { imageURL, analysisType },
        token
      );

      // AI cevabını kullanıcı dostu hale getir
      if (response.success && response.data && response.data.aiResponse) {
        response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
      }

      return response;
    } catch (error) {
      console.error('Analyze image error:', error);
      return { success: false, error: 'Görsel analizi yapılırken bir hata oluştu.' };
    }
  }

  // Kullanıcı analizi
  async getUserAnalysis() {
    try {
      const token = await authService.getToken();
      const response = await api.post(
        '/ai/user-analysis',
        {},
        token
      );

      // AI cevabını kullanıcı dostu hale getir
      if (response.success && response.data && response.data.aiResponse) {
        response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
      }

      return response;
    } catch (error) {
      console.error('User analysis error:', error);
      return { success: false, error: 'Kullanıcı analizi yapılırken bir hata oluştu.' };
    }
  }

  // Sistem durumu kontrolü
  async checkSystemStatus() {
    try {
      console.log('🔍 Checking system status...');
      
      const response = await api.get('/ai/system-status');
      
      console.log('🔍 System status response:', response);
      return response;
    } catch (error) {
      console.error('System status check error:', error);
      
      // Hata detaylarını logla
      if (error.response) {
        console.error('🔍 Error response status:', error.response.status);
        console.error('🔍 Error response data:', error.response.data);
      }
      
      return { 
        success: false, 
        error: 'Sistem durumu kontrol edilirken bir hata oluştu.',
        details: error.message || 'Unknown error',
        status: error.response?.status || 'No status'
      };
    }
  }

  // Benzerlik analizi yap (soruları üretme, sadece analiz et)
  async analyzeSimilarity(questionData) {
    try {
      console.log('🔍 Analyzing similarity for:', questionData);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'Giriş yapmanız gerekiyor.' };
      }

      // Kullanıcı ID'sini al
      const user = await authService.getUser();
      const userId = user?._id;
      console.log('🔍 Similarity Analysis - User ID:', userId);

      // AI'ya sadece benzerlik analizi yap
      const requestData = {
        prompt: `Benzerlik analizi görevi:
        
MEVCUT SORU: ${questionData.question}
ETİKETLER: ${questionData.tags?.join(', ') || 'Yok'}

Bu soru için benzerlik kriterlerini analiz et:
1. Konu benzerliği (%)
2. Zorluk seviyesi benzerliği (%)
3. Etiket benzerliği (%)
4. Genel benzerlik skoru (%)

Sadece analiz sonucunu döndür, yeni soru üretme.`,
        responseType: 'structured',
        requestType: 'similarity-analysis',
        userId: userId // Kullanıcı ID'sini ekle
      };

      const response = await api.post(
        '/ai/ask-with-options',
        requestData,
        token
      );

      // AI cevabını kullanıcı dostu hale getir
      if (response.success && response.data && response.data.aiResponse) {
        response.data.aiResponse = this.userFriendlyResponse(response.data.aiResponse);
      }

      console.log('🔍 Similarity analysis response:', response);
      return response;
    } catch (error) {
      console.error('Similarity analysis error:', error);
      return { success: false, error: 'Benzerlik analizi yapılırken bir hata oluştu.' };
    }
  }

}

export default new AIService(); 