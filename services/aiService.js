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
  // AI ile soru sor
  async askQuestion(question, context = '') {
    try {
      console.log('🤖 AI Service - Question:', question);
      console.log('🤖 AI Service - Context:', context);
      
      const token = await authService.getToken();
      console.log('🤖 AI Service - Token:', token ? 'Token var' : 'Token yok');
      
      // Backend'in beklediği format: prompt + responseType
      const requestData = { 
        prompt: question, 
        responseType: "step-by-step" 
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
      return response;
    } catch (error) {
      console.error('Get hap bilgi error:', error);
      return { success: false, error: 'Hap bilgi alınırken bir hata oluştu.' };
    }
  }

  // Hızlı AI soru sorma (2x daha hızlı endpoint)
  async askFast(prompt, responseType = 'step-by-step', imageURL = null, postId = null) {
    try {
      console.log('🚀 AI Fast Service - Question:', prompt);
      console.log('🚀 AI Fast Service - Response Type:', responseType);

      const token = await authService.getToken();
      console.log('🚀 AI Fast Service - Token:', token ? 'Token var' : 'Token yok');

      // Backend'in beklediği format
      const requestData = {
        prompt,
        responseType, // 'step-by-step' veya 'direct-solution'
        imageURL: imageURL || null,
        postId: postId || null
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

      // AI'ya hap bilgi önerileri için özel istek
      const requestData = {
        prompt,
        responseType: 'step-by-step', // Backend'in beklediği responseType
        requestType: 'hap-bilgi-suggestions' // Ek bilgi
      };

      const response = await api.post(
        '/ai/ask-with-options',
        requestData,
        token
      );

      console.log('📚 Hap bilgi suggestions response:', response);
      return response;
    } catch (error) {
      console.error('Hap bilgi suggestions error:', error);
      return { success: false, error: 'Hap bilgi önerileri alınırken bir hata oluştu.' };
    }
  }

  // AI soru paylaşma - Post oluşturma
  async shareQuestion(content, imageUri = null, postType = 'soru') {
    try {
      console.log('📝 AI Share Question - Creating post from modal');
      console.log('📝 postType:', postType);
      console.log('📝 content:', content);
      console.log('📝 imageUri:', imageUri);

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
        };

        console.log('📸 Creating post with image:', { postData, imageFile });
        const result = await postsService.createPostWithImage(postData, imageFile);
        return result;
      } else {
        // Sadece metin ile post oluştur (Twitter gibi)
        const postData = {
          postType: postType,
          content: content,
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
      return response;
    } catch (error) {
      console.error('User analysis error:', error);
      return { success: false, error: 'Kullanıcı analizi yapılırken bir hata oluştu.' };
    }
  }

}

export default new AIService(); 