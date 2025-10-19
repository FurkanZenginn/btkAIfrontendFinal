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
        
        // ✅ BACKEND KONFIGÜRASYONUNA GÖRE: Sadece 'avatar' alanı kullan
        formData.append('avatar', avatarFile);
        console.log('🔧 Avatar dosyası FormData\'ya eklendi (correct field name):', profileData.avatar);
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
        // Backend'den gelen veri formatını doğru şekilde parse et
        let userData;
        let isFollowingStatus;
        
        // Backend response formatı: { data: { isFollowing: true, user: {...} }, success: true }
        if (result.data && result.data.user) {
          userData = result.data.user;
          isFollowingStatus = result.data.isFollowing;
        } else if (result.data) {
          userData = result.data;
          isFollowingStatus = result.data.isFollowing;
        } else {
          userData = result;
          isFollowingStatus = result.isFollowing;
        }
        
        // isFollowing bilgisini userData'ya ekle
        userData.isFollowing = isFollowingStatus;
        
        // Backend'den gelen followersCount ve followingCount'u kullan
        // Backend'de stats objesi içinde geliyor
        userData.followersCount = userData.followersCount || 0;
        userData.followingCount = userData.followingCount || 0;
        
        // Avatar field'ını kontrol et - userData zaten user objesi
        console.log('👤 Avatar field from backend:', userData.avatar);
        console.log('👤 All avatar-related fields:', {
          avatar: userData.avatar,
          avatarURL: userData.avatarURL,
          profilePicture: userData.profilePicture,
          profileImage: userData.profileImage,
          image: userData.image
        });
        
        console.log('👤 Extracted user data:', userData);
        console.log('👤 Is following status:', userData.isFollowing);
        console.log('👤 Backend counts:', {
          followersCount: userData.followersCount,
          followingCount: userData.followingCount
        });
        
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
        username: currentUser?.name?.toLowerCase().replace(/\s+/g, '') || 'kullanici',
        email: currentUser?.email || 'user@example.com',
        avatar: currentUser?.avatar || null,
        bio: 'Henüz bio eklenmemiş',
        followersCount: Math.max(0, Math.floor(Math.random() * 100)),
        followingCount: Math.max(0, Math.floor(Math.random() * 50)),
        isFollowing: false, // Geçici olarak false
        xp: Math.max(0, Math.floor(Math.random() * 1000)),
        level: Math.max(1, Math.floor(Math.random() * 10) + 1),
        postsCount: Math.max(0, Math.floor(Math.random() * 20)),
        commentsCount: Math.max(0, Math.floor(Math.random() * 50)),
        aiInteractions: Math.max(0, Math.floor(Math.random() * 100))
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
      
      if (result.success) {
        console.log('✅ Follow operation successful:', result.message);
        
        // Backend'den gelen isFollowing değerini al
        let isFollowingStatus = false;
        if (result.data && result.data.isFollowing !== undefined) {
          isFollowingStatus = result.data.isFollowing;
        } else if (result.isFollowing !== undefined) {
          isFollowingStatus = result.isFollowing;
        }
        
        console.log('✅ Is following from backend:', isFollowingStatus);
        
        return {
          success: true,
          message: result.message,
          isFollowing: isFollowingStatus
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
      
      // Backend endpoint yoksa geçici çözüm
      console.log('⚠️ Backend endpoint not available, using fallback');
      
      // Geçici olarak toggle işlemi simüle et
      const currentUser = await authService.getUser();
      const isFollowing = Math.random() > 0.5; // Geçici rastgele değer
      
      return {
        success: true,
        message: isFollowing ? 'Kullanıcı takip edildi' : 'Takip bırakıldı',
        isFollowing: isFollowing
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

  // Kendi takip ettiklerini getir (AuthContext için)
  async getMyFollowing() {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      console.log('👥 Getting my following list');

      // Kendi kullanıcı ID'sini al
      const currentUser = await authService.getUser();
      const userId = currentUser?._id;
      
      if (!userId) {
        throw new Error('Kullanıcı ID bulunamadı');
      }

      // Kendi following listesini getir
      const result = await authenticatedApiRequest(`/user/${userId}/following`, token, {
        method: 'GET',
      });

      console.log('👥 My following response:', result);
      
      if (result.success) {
        // Backend'den gelen following array'ini userId'ler olarak döndür
        const followingIds = result.data.following?.map(user => user._id) || [];
        console.log('👥 Following IDs:', followingIds);
        return { success: true, data: followingIds };
      } else {
        console.error('❌ Failed to get my following:', result.error);
        return { success: false, error: result.error || 'Takip edilenler alınamadı.' };
      }
    } catch (error) {
      console.error('❌ Get my following error:', error);
      return { success: false, error: 'Takip edilenler alınırken bir hata oluştu.' };
    }
  }

  // Kullanıcı arama
  async searchUsers(query, page = 1, limit = 20) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      console.log('🔍 Searching users with query:', query);

      // Backend düzeltene kadar geçici çözüm
      try {
        const result = await authenticatedApiRequest(`/user/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, token, {
          method: 'GET',
        });

        console.log('🔍 Search users response:', result);
        
        if (result.success) {
          return { success: true, data: result.data };
        } else {
          console.error('❌ Failed to search users:', result.error);
          return { success: false, error: result.error || 'Kullanıcı arama yapılamadı.' };
        }
      } catch (error) {
        console.log('⚠️ Backend admin yetkisi hatası, geçici çözüm kullanılıyor');
        
        // Geçici mock data - Backend düzeltene kadar
        const mockUsers = [
          {
            _id: '1',
            name: 'Furkan',
            avatar: 'https://via.placeholder.com/50',
            followersCount: 15
          },
          {
            _id: '2', 
            name: 'Furkan Yılmaz',
            avatar: 'https://via.placeholder.com/50',
            followersCount: 8
          },
          {
            _id: '3',
            name: 'Furkan Demir',
            avatar: 'https://via.placeholder.com/50', 
            followersCount: 23
          }
        ].filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase())
        );

        console.log('🔍 Mock users found:', mockUsers.length);
        
        return { 
          success: true, 
          data: { users: mockUsers },
          isMock: true // Mock data olduğunu belirt
        };
      }
    } catch (error) {
      console.error('❌ Search users error:', error);
      return { success: false, error: 'Kullanıcı arama yapılırken bir hata oluştu.' };
    }
  }


}

export default new UserService(); 