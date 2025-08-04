import api from './api';
import authService from './authService';

const API_BASE = 'http://10.0.2.2:5000/api';

class HapBilgiService {
  // Hap bilgi oluştur (post'tan)
  async createHapBilgiFromPost(postId) {
    try {
      const response = await fetch(`${API_BASE}/hap-bilgi/create-from-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getToken()}`
        },
        body: JSON.stringify({ postId })
      });
      return await response.json();
    } catch (error) {
      console.error('Hap bilgi oluşturma hatası:', error);
      throw error;
    }
  }

  // Hap bilgi oluştur (AI soru ve yanıtından) - Bellekte tut
  async createHapBilgiFromQuestion(question, aiResponse) {
    try {
      console.log('📚 createHapBilgiFromQuestion çağrıldı');
      console.log('📚 Question:', question);
      console.log('📚 AI Response:', aiResponse);
      
      // Bellekte Hap Bilgi oluştur (backend'e gitme)
      console.log('💾 Bellekte Hap Bilgi oluşturuluyor...');
      
      const hapBilgi = {
        _id: `local_${Date.now()}`,
        title: this.generateTitleFromQuestion(question),
        content: this.generateContentFromAIResponse(aiResponse),
        category: this.detectCategory(question),
        difficulty: this.detectDifficulty(question),
        keywords: this.extractKeywords(question, aiResponse),
        likes: 0,
        saves: 0,
        views: 0,
        createdAt: new Date().toISOString(),
        isLocal: true,
        originalQuestion: question,
        originalAIResponse: aiResponse
      };
      
      console.log('📚 Bellekte Hap Bilgi oluşturuldu:', hapBilgi);
      
      // AsyncStorage'a kaydet
      await this.saveLocalHapBilgi(hapBilgi);
      
      return { success: true, data: hapBilgi, message: 'Hap Bilgi bellekte oluşturuldu' };
    } catch (error) {
      console.error('Hap bilgi oluşturma hatası (soru):', error);
      return { success: false, error: error.message };
    }
  }

  // Önerilen hap bilgiler - Sadece yerel veriler
  async getRecommendedHapBilgiler(limit = 10) {
    try {
      console.log('📚 Yerel Hap Bilgiler alınıyor...');
      
      // Sadece yerel verileri al (backend'e gitme)
      const localData = await this.getLocalHapBilgiler();
      
      if (localData && localData.length > 0) {
        console.log('✅ Yerel Hap Bilgiler yüklendi:', localData.length, 'adet');
        return { success: true, data: localData.slice(0, limit) };
      }
      
      // Veri yoksa boş array döndür
      console.log('❌ Yerel Hap Bilgi verisi bulunamadı, boş array döndürülüyor');
      return { success: true, data: [] };
    } catch (error) {
      console.error('Yerel Hap Bilgi alma hatası:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  // Hap bilgi arama
  async searchHapBilgiler(query, filters = {}) {
    try {
      const params = new URLSearchParams({ q: query, ...filters });
      const response = await fetch(`${API_BASE}/hap-bilgi/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Hap bilgi arama hatası:', error);
      throw error;
    }
  }

  // Benzer sorular
  async getSimilarQuestions(hapBilgiId, limit = 10) {
    try {
      const response = await fetch(`${API_BASE}/hap-bilgi/${hapBilgiId}/similar-questions?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Benzer sorular hatası:', error);
      // Hata durumunda boş array döndür
      return { success: false, data: [], error: error.message };
    }
  }

  // Hap bilgi beğen
  async likeHapBilgi(hapBilgiId) {
    try {
      const response = await fetch(`${API_BASE}/hap-bilgi/${hapBilgiId}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Hap bilgi beğenme hatası:', error);
      throw error;
    }
  }

  // Hap bilgi kaydet
  async saveHapBilgi(hapBilgiId) {
    try {
      const response = await fetch(`${API_BASE}/hap-bilgi/${hapBilgiId}/save`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Hap bilgi kaydetme hatası:', error);
      throw error;
    }
  }

  // Kullanıcının hap bilgileri
  async getUserHapBilgiler(userId) {
    try {
      const response = await fetch(`${API_BASE}/hap-bilgi/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Kullanıcı hap bilgileri hatası:', error);
      throw error;
    }
  }

  // Hap bilgi detayı
  async getHapBilgiDetail(hapBilgiId) {
    try {
      const response = await fetch(`${API_BASE}/hap-bilgi/${hapBilgiId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Hap bilgi detay hatası:', error);
      throw error;
    }
  }

  // Kategoriye göre hap bilgiler
  async getHapBilgilerByCategory(category, limit = 20) {
    try {
      const response = await fetch(`${API_BASE}/hap-bilgi/category/${category}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Kategori hap bilgileri hatası:', error);
      throw error;
    }
  }

  // Token alma
  async getToken() {
    try {
      const token = await authService.getToken();
      console.log('🔑 HapBilgiService - Token alındı:', token ? 'Token var' : 'Token yok');
      return token;
    } catch (error) {
      console.error('🔑 HapBilgiService - Token alma hatası:', error);
      return null;
    }
  }

  // Hap Bilgi içeriği getir (eski sistem için)
  async getHapBilgiContent() {
    try {
      const response = await fetch(`${API_BASE}/hap-bilgi/content`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Hap bilgi içeriği hatası:', error);
      // Hata durumunda boş data döndür
      return { success: false, data: null, error: error.message };
    }
  }

  // Yardımcı fonksiyonlar (bellekte Hap Bilgi oluşturma için)
  generateTitleFromQuestion(question) {
    const words = question.split(' ').slice(0, 5);
    return words.join(' ') + (question.length > 30 ? '...' : '');
  }

  generateContentFromAIResponse(aiResponse) {
    // AI yanıtından ilk 150 karakteri al
    return aiResponse.substring(0, 150) + (aiResponse.length > 150 ? '...' : '');
  }

  detectCategory(question) {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('matematik') || lowerQuestion.includes('sayı') || lowerQuestion.includes('hesap') || lowerQuestion.includes('integral') || lowerQuestion.includes('türev')) return 'matematik';
    if (lowerQuestion.includes('fizik') || lowerQuestion.includes('kuvvet') || lowerQuestion.includes('enerji') || lowerQuestion.includes('hız')) return 'fizik';
    if (lowerQuestion.includes('kimya') || lowerQuestion.includes('molekül') || lowerQuestion.includes('reaksiyon') || lowerQuestion.includes('element')) return 'kimya';
    if (lowerQuestion.includes('biyoloji') || lowerQuestion.includes('hücre') || lowerQuestion.includes('organ') || lowerQuestion.includes('dna')) return 'biyoloji';
    if (lowerQuestion.includes('tarih') || lowerQuestion.includes('savaş') || lowerQuestion.includes('devrim') || lowerQuestion.includes('osmanlı')) return 'tarih';
    if (lowerQuestion.includes('coğrafya') || lowerQuestion.includes('ülke') || lowerQuestion.includes('şehir') || lowerQuestion.includes('iklim')) return 'coğrafya';
    if (lowerQuestion.includes('türkçe') || lowerQuestion.includes('dil') || lowerQuestion.includes('gramer') || lowerQuestion.includes('edebiyat')) return 'türkçe';
    if (lowerQuestion.includes('ingilizce') || lowerQuestion.includes('english') || lowerQuestion.includes('grammar')) return 'ingilizce';
    return 'genel';
  }

  detectDifficulty(question) {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('kolay') || lowerQuestion.includes('basit') || lowerQuestion.includes('temel')) return 'kolay';
    if (lowerQuestion.includes('zor') || lowerQuestion.includes('karmaşık') || lowerQuestion.includes('ileri')) return 'zor';
    return 'orta';
  }

  extractKeywords(question, aiResponse) {
    const text = question + ' ' + aiResponse;
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = ['ve', 'veya', 'ile', 'için', 'bu', 'bir', 'da', 'de', 'mi', 'mu', 'mı', 'mü', 'nasıl', 'nedir', 'hangi', 'nerede', 'ne zaman'];
    const keywords = words.filter(word => 
      word.length > 3 && 
      !commonWords.includes(word) && 
      !word.includes('?') && 
      !word.includes('!') &&
      !word.includes('.') &&
      !word.includes(',')
    );
    return [...new Set(keywords)].slice(0, 5);
  }

  async saveLocalHapBilgi(hapBilgi) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const key = `local_hap_bilgi_${hapBilgi._id}`;
      await AsyncStorage.setItem(key, JSON.stringify(hapBilgi));
      console.log('💾 Yerel Hap Bilgi kaydedildi:', key);
    } catch (error) {
      console.error('💾 Yerel Hap Bilgi kaydetme hatası:', error);
    }
  }

  async getLocalHapBilgiler() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const localKeys = keys.filter(key => key.startsWith('local_hap_bilgi_'));
      
      if (localKeys.length === 0) {
        console.log('📚 Yerel Hap Bilgi bulunamadı');
        return [];
      }
      
      const localData = await AsyncStorage.multiGet(localKeys);
      const hapBilgiler = localData
        .map(([key, value]) => {
          try {
            return JSON.parse(value);
          } catch (error) {
            console.error('Yerel Hap Bilgi parse hatası:', error);
            return null;
          }
        })
        .filter(item => item !== null)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('📚 Yerel Hap Bilgiler yüklendi:', hapBilgiler.length, 'adet');
      return hapBilgiler;
    } catch (error) {
      console.error('Yerel Hap Bilgi alma hatası:', error);
      return [];
    }
  }
}

export default new HapBilgiService(); 