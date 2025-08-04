import { authenticatedApiRequest } from './api';
import authService from './authService';

const API_ENDPOINTS = {
  GAMIFICATION: {
    PROFILE: '/gamification/profile',
    LEADERBOARD: '/gamification/leaderboard',
    ACHIEVEMENTS: '/gamification/achievements',
    ACTIVITY: '/gamification/activity',
  },
};

class GamificationService {
  // Puan liderliği getir
  async getLeaderboard() {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      const result = await authenticatedApiRequest(API_ENDPOINTS.GAMIFICATION.LEADERBOARD, token, {
        method: 'GET',
      });

      console.log('📊 Liderlik tablosu alındı:', result);
      console.log('🔍 Result structure:', {
        success: result.success,
        hasData: !!result.data,
        dataType: typeof result.data,
        isArray: Array.isArray(result.data),
        length: result.data?.length
      });
      
      // Backend'den gelen veriyi kontrol et - çift data wrapper'ı düzelt
      let leaderboardData = result.data;
      
      // Eğer result.data.data varsa (çift wrapper), onu kullan
      if (result.success && result.data && result.data.data && Array.isArray(result.data.data)) {
        leaderboardData = result.data.data;
        console.log('🔧 Çift data wrapper tespit edildi, düzeltiliyor...');
      }
      
      if (result.success && leaderboardData && Array.isArray(leaderboardData) && leaderboardData.length > 0) {
        console.log('✅ Backend\'den gelen kullanıcılar:', leaderboardData);
        return { success: true, data: leaderboardData };
      }
      
      // Veri yoksa boş array döndür
      console.log('❌ Backend\'den veri gelmedi veya boş, boş array döndürülüyor');
      return { success: true, data: [] };
    } catch (error) {
      console.error('Liderlik tablosu alınırken hata:', error);
      // Hata durumunda boş array döndür
      return { success: false, data: [], error: error.message };
    }
  }

  // Başarılar ve rozetler getir
  async getAchievements() {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      const result = await authenticatedApiRequest(API_ENDPOINTS.GAMIFICATION.ACHIEVEMENTS, token, {
        method: 'GET',
      });

      console.log('Başarılar alındı:', result);
      return result;
    } catch (error) {
      console.error('Başarılar alınırken hata:', error);
      throw error;
    }
  }

  // Son aktiviteler getir
  async getActivity() {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      const result = await authenticatedApiRequest(API_ENDPOINTS.GAMIFICATION.ACTIVITY, token, {
        method: 'GET',
      });

      console.log('Aktiviteler alındı:', result);
      return result;
    } catch (error) {
      console.error('Aktiviteler alınırken hata:', error);
      throw error;
    }
  }

  // Profil bilgileri getir (gamification dahil)
  async getProfile() {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      const result = await authenticatedApiRequest(API_ENDPOINTS.GAMIFICATION.PROFILE, token, {
        method: 'GET',
      });

      console.log('Gamification profil alındı:', result);
      return result;
    } catch (error) {
      console.error('Gamification profil alınırken hata:', error);
      throw error;
    }
  }
}

export default new GamificationService(); 