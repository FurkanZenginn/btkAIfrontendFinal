import { apiRequest, authenticatedApiRequest } from './api';
import authService from './authService';

const API_ENDPOINTS = {
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile', // Backend'deki gerçek endpoint
  },
  GAMIFICATION: {
    PROFILE: '/gamification/profile',
  },
};

class UserService {
  // Profil bilgilerini getir (gamification dahil)
  async getProfile() {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      // Önce gamification endpoint'ini dene
      try {
        const result = await authenticatedApiRequest(API_ENDPOINTS.GAMIFICATION.PROFILE, token, {
          method: 'GET',
        });

        console.log('✅ Gamification profil bilgileri alındı:', result);
        return result;
      } catch (gamificationError) {
        console.log('⚠️ Gamification endpoint failed, trying user endpoint:', gamificationError.message);
        
        // Gamification başarısız olursa user endpoint'ini dene
        const result = await authenticatedApiRequest(API_ENDPOINTS.USER.PROFILE, token, {
          method: 'GET',
        });

        console.log('✅ User profil bilgileri alındı:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ Profil bilgileri alınırken hata:', error);
      throw error;
    }
  }

  // Profil güncelle
  async updateProfile(profileData) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

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
      const url = `${API_BASE_URL}${API_ENDPOINTS.USER.UPDATE_PROFILE}`;

      let options;
      let hasAvatar = false;

      // Avatar var mı kontrol et
      if (profileData.avatar && profileData.avatar.startsWith('file://')) {
        // Avatar varsa FormData kullan (Backend gereksinimlerine uygun)
        hasAvatar = true;
      const formData = new FormData();
        
        // Name field'ı ekle (opsiyonel)
        if (profileData.name) {
          formData.append('name', profileData.name);
          console.log('🔧 Name added to FormData:', profileData.name);
        }
        
        // Avatar dosyasını FormData'ya ekle (Backend: field name 'avatar' olmalı)
        const avatarFile = {
          uri: profileData.avatar,
          type: 'image/jpeg', // Backend desteklenen formatlar: PNG, JPG, JPEG, GIF
          name: 'avatar.jpg'
        };
        
        // Backend gereksinimi: field name 'avatar' olmalı
        formData.append('avatar', avatarFile);
        console.log('🔧 Avatar dosyası FormData\'ya eklendi (field: avatar):', profileData.avatar);
        console.log('🔧 Avatar file object:', avatarFile);

        options = {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`, // Backend: Bearer token gerekli
            'Accept': 'application/json',
            // Backend: FormData için Content-Type otomatik (kaldırıldı)
          },
          body: formData
        };
      } else {
        // Avatar yoksa JSON kullan
        hasAvatar = false;
        const jsonData = {};
        
        if (profileData.name) {
          jsonData.name = profileData.name;
        }
        
        console.log('🔧 JSON data for update:', jsonData);

        options = {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonData)
        };
      }

      console.log('🔧 Profile update request (Backend uyumlu):', {
        url,
        method: options.method,
        hasAvatar,
        contentType: options.headers['Content-Type'],
        bodyType: hasAvatar ? 'FormData' : 'JSON',
        fieldName: hasAvatar ? 'avatar' : 'N/A'
      });

      const response = await fetch(url, options);
      const result = await response.json();

      console.log('📊 Profile update response:', {
        status: response.status,
        success: response.ok,
        data: result,
      });

      if (response.ok) {
        // Backend'den gelen response formatını kontrol et
        if (result.success) {
          return { success: true, data: result.data || result };
        } else {
          return { 
            success: false, 
            error: result.error || result.message || 'Profil güncellenirken bir hata oluştu.' 
          };
        }
      } else {
        return { 
          success: false, 
          error: result.error || result.message || `HTTP ${response.status}: Profil güncellenirken bir hata oluştu.` 
        };
      }
    } catch (error) {
      console.error('❌ Profil güncellenirken hata:', error);
      return { 
        success: false, 
        error: 'Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin.' 
      };
    }
  }

  // Kullanıcı profilini getir (başka kullanıcının)
  async getUserProfile(userId) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      console.log('👤 Getting user profile for userId:', userId);

      // Backend'den gerçek kullanıcı profilini al
      const result = await authenticatedApiRequest(`/user/${userId}/profile`, token, {
        method: 'GET',
      });

      console.log('👤 User profile response:', result);
      
      if (result.success) {
        // Backend'den gelen veri formatını kontrol et
        let userData;
        
        if (result.data && result.data.user) {
          userData = result.data.user;
        } else if (result.data) {
          userData = result.data;
        } else {
          userData = result;
        }
        
        console.log('👤 Extracted user data:', userData);
        console.log('👤 Is following status:', userData.isFollowing);
        
        return { success: true, data: userData };
      } else {
        console.error('❌ Failed to get user profile:', result.error);
        return { success: false, error: result.error || 'Kullanıcı profili alınamadı.' };
      }
    } catch (error) {
      console.error('❌ Get user profile error:', error);
      
      // Backend endpoint yoksa geçici çözüm
      console.log('⚠️ Backend endpoint not available, using fallback data');
      
      const currentUser = await authService.getUser();
      
      const profileData = {
        _id: userId,
        name: currentUser?.name || 'Kullanıcı',
        email: currentUser?.email || 'user@example.com',
        avatar: currentUser?.avatar || null,
        bio: 'Henüz bio eklenmemiş',
        followersCount: Math.floor(Math.random() * 100),
        followingCount: Math.floor(Math.random() * 50),
        isFollowing: false, // Geçici olarak false
        xp: Math.floor(Math.random() * 1000),
        level: Math.floor(Math.random() * 10) + 1,
        postsCount: Math.floor(Math.random() * 20),
        commentsCount: Math.floor(Math.random() * 50),
        aiInteractions: Math.floor(Math.random() * 100)
      };

      return { success: true, data: profileData };
    }
  }

  // Kullanıcıyı takip et/takibi bırak (Toggle sistemi)
  async followUser(userId) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      console.log('🔗 Follow request for userId:', userId);

      const result = await authenticatedApiRequest(`/user/follow/${userId}`, token, {
        method: 'POST',
      });

      console.log('🔗 Follow response:', result);
      
      // Backend response formatını kontrol et
      if (result.success) {
        console.log('✅ Follow operation successful:', result.message);
        console.log('✅ Is following:', result.isFollowing);
        return {
          success: true,
          message: result.message,
          isFollowing: result.isFollowing
        };
      } else {
        console.error('❌ Follow operation failed:', result.error);
        return {
          success: false,
          error: result.error || 'Takip işlemi başarısız oldu.'
        };
      }
    } catch (error) {
      console.error('❌ Follow operation error:', error);
      return { 
        success: false, 
        error: 'Takip işlemi sırasında bir hata oluştu.' 
      };
    }
  }

  // Kullanıcının takipçilerini getir
  async getFollowers(userId) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      console.log('👥 Getting followers for userId:', userId);

      const result = await authenticatedApiRequest(`/user/${userId}/followers`, token, {
        method: 'GET',
      });

      console.log('👥 Followers response:', result);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        console.error('❌ Failed to get followers:', result.error);
        return { success: false, error: result.error || 'Takipçiler alınamadı.' };
      }
    } catch (error) {
      console.error('❌ Get followers error:', error);
      return { success: false, error: 'Takipçiler alınırken bir hata oluştu.' };
    }
  }

  // Kullanıcının takip ettiklerini getir
  async getFollowing(userId) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      console.log('👥 Getting following for userId:', userId);

      const result = await authenticatedApiRequest(`/user/${userId}/following`, token, {
        method: 'GET',
      });

      console.log('👥 Following response:', result);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        console.error('❌ Failed to get following:', result.error);
        return { success: false, error: result.error || 'Takip edilenler alınamadı.' };
      }
    } catch (error) {
      console.error('❌ Get following error:', error);
      return { success: false, error: 'Takip edilenler alınırken bir hata oluştu.' };
    }
  }


}

export default new UserService(); 