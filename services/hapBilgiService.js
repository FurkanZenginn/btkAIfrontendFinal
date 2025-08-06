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
  async createHapBilgiFromQuestion(question, aiResponse, aiGeneratedTags = []) {
    try {
      console.log('📚 createHapBilgiFromQuestion çağrıldı');
      console.log('📚 Question:', question);
      console.log('📚 AI Response:', aiResponse);
      
      // AI etiketlerini oluştur (eğer AI'dan gelen etiketler varsa onları kullan, yoksa otomatik oluştur)
      let aiTags = [];
      console.log('🔍 HapBilgiService - AI Generated Tags Input:', aiGeneratedTags);
      
      if (aiGeneratedTags && aiGeneratedTags.length > 0) {
        aiTags = aiGeneratedTags;
        console.log('🏷️ AI\'dan gelen etiketler kullanılıyor:', aiTags);
      } else {
        console.log('🔄 AI etiketleri boş, otomatik etiketleme devreye giriyor...');
        aiTags = this.extractKeywords(question, aiResponse);
        console.log('🏷️ Otomatik oluşturulan etiketler:', aiTags);
      }
      
      console.log('🎯 Final AI Tags for HapBilgi:', aiTags);
      
      // Bellekte Hap Bilgi oluştur (backend'e gitme)
      console.log('💾 Bellekte Hap Bilgi oluşturuluyor...');
      
      const hapBilgi = {
        _id: `local_${Date.now()}`,
        title: this.generateTitleFromQuestion(question),
        content: this.generateContentFromAIResponse(aiResponse),
        category: this.detectCategory(question),
        difficulty: this.detectDifficulty(question),
        keywords: aiTags, // AI etiketlerini kullan
        tags: aiTags, // Yeni tags alanı
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
        // En yeni verileri önce göster (tarihe göre sırala)
        const sortedData = localData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return { success: true, data: sortedData.slice(0, limit) };
      }
      
      // Veri yoksa boş array döndür
      console.log('❌ Yerel Hap Bilgi verisi bulunamadı, boş array döndürülüyor');
      return { success: true, data: [] };
    } catch (error) {
      console.error('Yerel Hap Bilgi alma hatası:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  // YENİ: Tüm verileri zorla temizle ve yeniden başlat
  async resetAllHapBilgiler() {
    try {
      console.log('🔄 TÜM Hap Bilgi verileri sıfırlanıyor...');
      await this.forceClearAllHapBilgiler();
      console.log('✅ Tüm veriler temizlendi, sistem yeniden başlatıldı');
      return { success: true, message: 'Tüm veriler temizlendi' };
    } catch (error) {
      console.error('❌ Veri sıfırlama hatası:', error);
      return { success: false, error: error.message };
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

  // Akıllı AI etiket sistemi - YENİ VERSİYON
  extractKeywords(question, aiResponse) {
    console.log('🧠 YENİ AKILLI AI ETİKET SİSTEMİ BAŞLADI');
    console.log('📝 Question:', question);
    console.log('🤖 AI Response:', aiResponse);
    
    const text = question + ' ' + aiResponse;
    const lowerText = text.toLowerCase();
    
    console.log('🔍 Analiz edilen metin:', lowerText);
    
    // Ana ders tespiti (sadece bir tane)
    const mainSubject = this.detectMainSubject(lowerText);
    console.log('📚 Ana ders tespit edildi:', mainSubject);
    
    // Sınav türü tespiti (sadece bir tane)
    const examType = this.detectExamType(lowerText);
    console.log('📋 Sınav türü tespit edildi:', examType);
    
    // Spesifik konu etiketleri (içeriğe göre)
    const topicTags = this.detectSpecificTopics(lowerText, mainSubject);
    console.log('🎯 Spesifik konular:', topicTags);
    
    // Zorluk seviyesi
    const difficultyTags = [this.detectDifficultyLevel(lowerText)];
    console.log('📊 Zorluk seviyesi:', difficultyTags);
    
    // Tüm etiketleri birleştir
    const allTags = [...(examType ? [examType] : []), ...(mainSubject ? [mainSubject] : []), ...topicTags, ...difficultyTags];
    
    // Tekrar eden etiketleri kaldır ve maksimum 4 etiket döndür
    const uniqueTags = [...new Set(allTags)].filter(tag => tag);
    
    console.log('🏷️ YENİ AKILLI AI etiketleri oluşturuldu:', uniqueTags);
    return uniqueTags.slice(0, 4); // Maksimum 4 etiket
  }

  // Ana ders tespiti (sadece bir tane)
  detectMainSubject(text) {
    // Matematik
    if (text.includes('integral') || text.includes('türev') || text.includes('limit') || 
        text.includes('geometri') || text.includes('trigonometri') || text.includes('logaritma') ||
        text.includes('fonksiyon') || text.includes('denklem') || text.includes('polinom') ||
        text.includes('matematik') || text.includes('sayı') || text.includes('hesap')) {
      return '#Matematik';
    }
    
    // Fizik
    if (text.includes('kuvvet') || text.includes('enerji') || text.includes('hız') || 
        text.includes('ivme') || text.includes('elektrik') || text.includes('manyetizma') ||
        text.includes('dalga') || text.includes('optik') || text.includes('termodinamik') ||
        text.includes('fizik') || text.includes('mekanik') || text.includes('atom')) {
      return '#Fizik';
    }
    
    // Kimya
    if (text.includes('molekül') || text.includes('reaksiyon') || text.includes('element') ||
        text.includes('organik') || text.includes('analitik') || text.includes('karbon') ||
        text.includes('hidrokarbon') || text.includes('asit') || text.includes('baz') ||
        text.includes('kimya') || text.includes('bileşik') || text.includes('çözelti')) {
      return '#Kimya';
    }
    
    // Biyoloji
    if (text.includes('hücre') || text.includes('organ') || text.includes('dna') ||
        text.includes('genetik') || text.includes('ekoloji') || text.includes('evrim') ||
        text.includes('sistem') || text.includes('enzim') || text.includes('protein') ||
        text.includes('biyoloji') || text.includes('canlı') || text.includes('organizma')) {
      return '#Biyoloji';
    }
    
    // Tarih
    if (text.includes('savaş') || text.includes('devrim') || text.includes('osmanlı') ||
        text.includes('cumhuriyet') || text.includes('inkılap') || text.includes('padişah') ||
        text.includes('tarih') || text.includes('yıl') || text.includes('dönem') ||
        text.includes('imparatorluk') || text.includes('devlet') || text.includes('hükümdar')) {
      return '#Tarih';
    }
    
    // Coğrafya
    if (text.includes('ülke') || text.includes('şehir') || text.includes('iklim') ||
        text.includes('nüfus') || text.includes('ekonomi') || text.includes('bölge') ||
        text.includes('coğrafya') || text.includes('harita') || text.includes('doğal') ||
        text.includes('çevre') || text.includes('kaynak') || text.includes('yerleşim')) {
      return '#Coğrafya';
    }
    
    // Türkçe
    if (text.includes('dil') || text.includes('gramer') || text.includes('edebiyat') ||
        text.includes('paragraf') || text.includes('anlatım') || text.includes('cümle') ||
        text.includes('türkçe') || text.includes('kelime') || text.includes('anlam') ||
        text.includes('yazım') || text.includes('noktalama') || text.includes('kompozisyon')) {
      return '#Türkçe';
    }
    
    // İngilizce
    if (text.includes('english') || text.includes('grammar') || text.includes('vocabulary') ||
        text.includes('reading') || text.includes('writing') || text.includes('speaking') ||
        text.includes('ingilizce') || text.includes('tense') || text.includes('preposition') ||
        text.includes('pronoun') || text.includes('adjective') || text.includes('adverb')) {
      return '#İngilizce';
    }
    
    // Felsefe
    if (text.includes('felsefe') || text.includes('mantık') || text.includes('etik') ||
        text.includes('estetik') || text.includes('bilgi') || text.includes('varlık') ||
        text.includes('ahlak') || text.includes('değer') || text.includes('düşünce') ||
        text.includes('akıl') || text.includes('bilinç') || text.includes('gerçeklik')) {
      return '#Felsefe';
    }
    
    // Din Kültürü
    if (text.includes('din') || text.includes('kültür') || text.includes('ahlak') ||
        text.includes('ibadet') || text.includes('iman') || text.includes('kuran') ||
        text.includes('peygamber') || text.includes('allah') || text.includes('namaz') ||
        text.includes('oruç') || text.includes('zekat') || text.includes('hac')) {
      return '#DinKültürü';
    }
    
    return null;
  }

  // Sınav türü tespiti
  detectExamType(text) {
    if (text.includes('yks') || text.includes('tyt') || text.includes('ayt') || 
        text.includes('üniversite') || text.includes('yükseköğretim')) {
      return '#YKS';
    }
    if (text.includes('lgs') || text.includes('ortaokul') || text.includes('8. sınıf') ||
        text.includes('ilköğretim')) {
      return '#LGS';
    }
    if (text.includes('kpss') || text.includes('memur') || text.includes('devlet') ||
        text.includes('kamu')) {
      return '#KPSS';
    }
    if (text.includes('ales') || text.includes('yüksek lisans') || text.includes('doktora') ||
        text.includes('akademik')) {
      return '#ALES';
    }
    if (text.includes('yös') || text.includes('yabancı') || text.includes('yurtdışı') ||
        text.includes('uluslararası')) {
      return '#YÖS';
    }
    
    return null;
  }

  // Spesifik konu etiketleri (ana derse göre)
  detectSpecificTopics(text, mainSubject) {
    const topics = [];
    
    if (mainSubject === '#Matematik') {
      if (text.includes('integral') || text.includes('türev') || text.includes('limit')) {
        topics.push('#Kalkülüs');
      }
      if (text.includes('geometri') || text.includes('üçgen') || text.includes('çember') || text.includes('kare')) {
        topics.push('#Geometri');
      }
      if (text.includes('trigonometri') || text.includes('sin') || text.includes('cos') || text.includes('tan')) {
        topics.push('#Trigonometri');
      }
      if (text.includes('logaritma') || text.includes('log')) {
        topics.push('#Logaritma');
      }
      if (text.includes('fonksiyon') || text.includes('f(x)')) {
        topics.push('#Fonksiyonlar');
      }
    }
    
    if (mainSubject === '#Kimya') {
      if (text.includes('organik') || text.includes('karbon') || text.includes('hidrokarbon')) {
        topics.push('#OrganikKimya');
      }
      if (text.includes('analitik') || text.includes('çözelti') || text.includes('titrasyon')) {
        topics.push('#AnalitikKimya');
      }
      if (text.includes('asit') || text.includes('baz') || text.includes('ph')) {
        topics.push('#AsitBaz');
      }
      if (text.includes('elektrokimya') || text.includes('pil') || text.includes('elektroliz')) {
        topics.push('#Elektrokimya');
      }
    }
    
    if (mainSubject === '#Fizik') {
      if (text.includes('elektrik') || text.includes('akım') || text.includes('voltaj') || text.includes('ohm')) {
        topics.push('#Elektrik');
      }
      if (text.includes('manyetizma') || text.includes('manyetik') || text.includes('indüksiyon')) {
        topics.push('#Manyetizma');
      }
      if (text.includes('optik') || text.includes('ışık') || text.includes('mercek') || text.includes('ayna')) {
        topics.push('#Optik');
      }
      if (text.includes('mekanik') || text.includes('kuvvet') || text.includes('hareket')) {
        topics.push('#Mekanik');
      }
    }
    
    if (mainSubject === '#Biyoloji') {
      if (text.includes('genetik') || text.includes('kalıtım') || text.includes('mutasyon') || text.includes('dna')) {
        topics.push('#Genetik');
      }
      if (text.includes('hücre') || text.includes('organel') || text.includes('mitokondri')) {
        topics.push('#HücreBiyolojisi');
      }
      if (text.includes('ekoloji') || text.includes('çevre') || text.includes('popülasyon')) {
        topics.push('#Ekoloji');
      }
      if (text.includes('sistem') || text.includes('organ') || text.includes('dolaşım')) {
        topics.push('#Sistemler');
      }
    }
    
    if (mainSubject === '#Tarih') {
      if (text.includes('osmanlı') || text.includes('padişah') || text.includes('devlet')) {
        topics.push('#OsmanlıTarihi');
      }
      if (text.includes('cumhuriyet') || text.includes('atatürk') || text.includes('inkılap')) {
        topics.push('#CumhuriyetTarihi');
      }
      if (text.includes('savaş') || text.includes('çanakkale') || text.includes('kurtuluş')) {
        topics.push('#SavaşTarihi');
      }
    }
    
    if (mainSubject === '#Türkçe') {
      if (text.includes('paragraf') || text.includes('anlatım') || text.includes('anlam')) {
        topics.push('#Paragraf');
      }
      if (text.includes('gramer') || text.includes('dilbilgisi') || text.includes('cümle')) {
        topics.push('#Dilbilgisi');
      }
      if (text.includes('edebiyat') || text.includes('şiir') || text.includes('roman')) {
        topics.push('#Edebiyat');
      }
    }
    
    return topics.slice(0, 2); // Maksimum 2 spesifik konu
  }

  // Zorluk seviyesi tespiti
  detectDifficultyLevel(text) {
    if (text.includes('kolay') || text.includes('basit') || text.includes('temel') || 
        text.includes('başlangıç') || text.includes('ilk') || text.includes('giriş')) {
      return '#Kolay';
    }
    if (text.includes('zor') || text.includes('karmaşık') || text.includes('ileri') || 
        text.includes('üst') || text.includes('yüksek') || text.includes('profesyonel')) {
      return '#Zor';
    }
    return '#Orta';
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

  // TÜM ESKİ VERİLERİ TEMİZLE (ZORLA)
  async forceClearAllHapBilgiler() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      
      console.log('🔍 Tüm AsyncStorage keyleri:', keys);
      
      // Tüm hap bilgi ile ilgili keyleri bul
      const hapBilgiKeys = keys.filter(key => 
        key.includes('hap_bilgi') || 
        key.includes('hapBilgi') || 
        key.includes('local_hap') ||
        key.includes('hap') ||
        key.includes('bilgi')
      );
      
      console.log('🗑️ Bulunan Hap Bilgi keyleri:', hapBilgiKeys);
      
      if (hapBilgiKeys.length > 0) {
        console.log('🧹 TÜM Hap Bilgi verileri zorla temizleniyor...');
        await AsyncStorage.multiRemove(hapBilgiKeys);
        console.log('✅ TÜM eski veriler temizlendi');
        
        // Tekrar kontrol et
        const remainingKeys = await AsyncStorage.getAllKeys();
        const remainingHapKeys = remainingKeys.filter(key => 
          key.includes('hap_bilgi') || 
          key.includes('hapBilgi') || 
          key.includes('local_hap')
        );
        console.log('✅ Kalan Hap Bilgi keyleri:', remainingHapKeys);
      } else {
        console.log('✅ Zaten temiz, eski veri yok');
      }
    } catch (error) {
      console.error('❌ Eski veriler temizleme hatası:', error);
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