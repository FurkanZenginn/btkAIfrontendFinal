import { authenticatedApiRequest } from './api';
import authService from './authService';

const API_ENDPOINTS = {
  FOLLOW: {
    FOLLOW_USER: (userId) => `/user/follow/${userId}`,
    UNFOLLOW_USER: (userId) => `/user/follow/${userId}`,
    GET_FOLLOWING_POSTS: '/user/following/posts',
    GET_USER_POSTS: (userId) => `/user/${userId}/posts`,
    GET_USER_PROFILE: (userId) => `/user/${userId}/profile`,
  },
};

class FollowService {
  // Kullanıcıyı takip et
  async followUser(userId) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      const result = await authenticatedApiRequest(API_ENDPOINTS.FOLLOW.FOLLOW_USER(userId), token, {
        method: 'POST',
      });

      console.log('Kullanıcı takip edildi:', result);
      return result;
    } catch (error) {
      console.error('Kullanıcı takip edilirken hata:', error);
      throw error;
    }
  }

  // Kullanıcıyı takipten çıkar
  async unfollowUser(userId) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      const result = await authenticatedApiRequest(API_ENDPOINTS.FOLLOW.UNFOLLOW_USER(userId), token, {
        method: 'DELETE',
      });

      console.log('Kullanıcı takipten çıkarıldı:', result);
      return result;
    } catch (error) {
      console.error('Kullanıcı takipten çıkarılırken hata:', error);
      throw error;
    }
  }

  // Takip edilen kullanıcıların postlarını getir
  async getFollowingPosts() {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      const result = await authenticatedApiRequest(API_ENDPOINTS.FOLLOW.GET_FOLLOWING_POSTS, token, {
        method: 'GET',
      });

      console.log('Takip edilen postlar alındı:', result);
      return result;
    } catch (error) {
      console.error('Takip edilen postlar alınırken hata:', error);
      throw error;
    }
  }

  // Belirli kullanıcının postlarını getir
  async getUserPosts(userId) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      const result = await authenticatedApiRequest(API_ENDPOINTS.FOLLOW.GET_USER_POSTS(userId), token, {
        method: 'GET',
      });

      console.log('Kullanıcı postları alındı:', result);
      return result;
    } catch (error) {
      console.error('Kullanıcı postları alınırken hata:', error);
      throw error;
    }
  }

  // Başka kullanıcının profilini getir
  async getUserProfile(userId) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      const result = await authenticatedApiRequest(API_ENDPOINTS.FOLLOW.GET_USER_PROFILE(userId), token, {
        method: 'GET',
      });

      console.log('Kullanıcı profili alındı:', result);
      return result;
    } catch (error) {
      console.error('Kullanıcı profili alınırken hata:', error);
      throw error;
    }
  }

  // Kullanıcının takip ettiği kişilerin listesini getir
  async getFollowingList(userId = null) {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token eksik');
      }

      // userId parametresi verilmişse onu kullan, yoksa token'dan çıkar
      let targetUserId = userId;
      if (!targetUserId) {
        try {
          const userData = await authService.getUser();
          if (userData && userData._id) {
            targetUserId = userData._id;
          } else {
            throw new Error('Kullanıcı bilgisi bulunamadı');
          }
        } catch (error) {
          console.error('Kullanıcı bilgisi alınırken hata:', error);
          throw new Error('Kullanıcı bilgisi alınamadı');
        }
      }

      // ✅ DOĞRU endpoint: /user/:userId/following
      const result = await authenticatedApiRequest(`/user/${targetUserId}/following`, token, {
        method: 'GET',
      });

      console.log('Following list alındı:', result);
      return result;
    } catch (error) {
      console.error('Following list alınırken hata:', error);
      throw error;
    }
  }
}

export default new FollowService(); 