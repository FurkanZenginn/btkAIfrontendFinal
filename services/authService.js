import api, { API_ENDPOINTS } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

class AuthService {
  // JWT Token decode
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  // Token yönetimi
  async getToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('🔐 Getting token:', token ? 'Token var' : 'Token yok');
      console.log('🔐 Token value:', token);
      
      // Token'ın geçerli olduğundan emin ol
      if (!token || token === 'null' || token === 'undefined' || token === '') {
        console.log('❌ Invalid token detected:', token);
        return null;
      }
      
      // Token'ın JWT formatında olduğunu kontrol et
      if (typeof token === 'string' && token.split('.').length === 3) {
        console.log('✅ Valid JWT token format');
        return token;
      } else {
        console.log('❌ Invalid JWT token format');
        return null;
      }
    } catch (error) {
      console.error('Token get error:', error);
      return null;
    }
  }

  async setToken(token) {
    try {
      console.log('🔐 Setting token:', token ? 'Token var' : 'Token yok');
      console.log('🔐 Token key:', TOKEN_KEY);
      console.log('🔐 Token value to save:', token);
      
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('🔐 Token set successfully');
      
      // Hemen test et
      const testToken = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('🔐 Test read after save:', testToken ? 'Token var' : 'Token yok');
      console.log('🔐 Test token value:', testToken);
    } catch (error) {
      console.error('Token set error:', error);
      console.error('Error details:', error.message);
    }
  }

  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Refresh token get error:', error);
      return null;
    }
  }

  async setRefreshToken(token) {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Refresh token set error:', error);
    }
  }

  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.error('Clear tokens error:', error);
    }
  }

  // User data yönetimi
  async getUser() {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async setUser(userData) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Set user error:', error);
    }
  }

  async updateUser(userData) {
    try {
      console.log('🔧 Updating user in AsyncStorage:', userData);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      console.log('✅ User updated in AsyncStorage successfully');
    } catch (error) {
      console.error('❌ Update user error:', error);
      throw error;
    }
  }

  // Login işlemi
  async login(email, password) {
    try {
      console.log('🔐 Login attempt for:', email);
      
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      console.log('🔐 Login response:', response);
      console.log('🔐 Response data:', response.data);
      console.log('🔐 Response success:', response.success);

      if (response.success) {
        // Backend'den gelen response formatını kontrol et
        const token = response.data?.token || response.data?.access_token || response.data?.auth_token;
        console.log('🔐 Token extracted:', token ? 'Token var' : 'Token yok');
        console.log('🔐 Token value:', token);
        
        // Token'ı kaydet
        console.log('🔐 About to save token to storage...');
        await this.setToken(token);
        console.log('🔐 Token saved to storage');
        
        // Token'ı tekrar oku ve kontrol et
        console.log('🔐 About to read token from storage...');
        const savedToken = await this.getToken();
        console.log('🔐 Token read from storage:', savedToken ? 'Token var' : 'Token yok');
        console.log('🔐 Saved token value:', savedToken);
        
        // User data'yı token'dan çıkar
        const decodedToken = this.decodeToken(token);
        const user = { 
          email, 
          _id: decodedToken?.id, // MongoDB _id formatı
          id: decodedToken?.id   // Alternatif id
        };
        console.log('👤 User data created:', user);
        await this.setUser(user);
        
        return { success: true, user };
      } else {
        console.log('🔐 Login failed:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Giriş yapılırken bir hata oluştu.' };
    }
  }

  // Register işlemi
  async register(userData) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, {
        email: userData.email,
        password: userData.password,
      });

      if (response.success) {
        // Kayıt başarılı, otomatik giriş yap
        const loginResponse = await this.login(userData.email, userData.password);
        return loginResponse;
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Kayıt olurken bir hata oluştu.' };
    }
  }

  // Logout işlemi
  async logout() {
    try {
      // Backend'de logout endpoint'i yok, sadece local storage'ı temizle
      await this.clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Token refresh işlemi
  async refreshToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('Refresh token bulunamadı');
      }

      const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refresh_token: refreshToken,
      });

      if (response.success) {
        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Yeni token'ları kaydet
        await this.setToken(token);
        if (newRefreshToken) {
          await this.setRefreshToken(newRefreshToken);
        }
        
        return { success: true, token };
      } else {
        // Refresh token geçersiz, logout yap
        await this.logout();
        return { success: false, error: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.' };
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      await this.logout();
      return { success: false, error: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.' };
    }
  }

  // Şifremi unuttum
  async forgotPassword(email) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email,
      });

      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'Şifre sıfırlama isteği gönderilirken bir hata oluştu.' };
    }
  }

  // Şifre sıfırlama
  async resetPassword(token, password, passwordConfirmation) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Şifre sıfırlanırken bir hata oluştu.' };
    }
  }

  // Email doğrulama
  async verifyEmail(token) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
        token,
      });

      return response;
    } catch (error) {
      console.error('Verify email error:', error);
      return { success: false, error: 'Email doğrulanırken bir hata oluştu.' };
    }
  }

  // Google ile giriş
  async googleLogin(accessToken) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, {
        access_token: accessToken,
      });

      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Token'ları kaydet
        await this.setToken(token);
        if (refreshToken) {
          await this.setRefreshToken(refreshToken);
        }
        
        // User data'yı kaydet
        await this.setUser(user);
        
        return { success: true, user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Google ile giriş yapılırken bir hata oluştu.' };
    }
  }

  // Facebook ile giriş
  async facebookLogin(accessToken) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.FACEBOOK_LOGIN, {
        access_token: accessToken,
      });

      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Token'ları kaydet
        await this.setToken(token);
        if (refreshToken) {
          await this.setRefreshToken(refreshToken);
        }
        
        // User data'yı kaydet
        await this.setUser(user);
        
        return { success: true, user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      return { success: false, error: 'Facebook ile giriş yapılırken bir hata oluştu.' };
    }
  }

  // Apple ile giriş
  async appleLogin(identityToken) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.APPLE_LOGIN, {
        identity_token: identityToken,
      });

      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Token'ları kaydet
        await this.setToken(token);
        if (refreshToken) {
          await this.setRefreshToken(refreshToken);
        }
        
        // User data'yı kaydet
        await this.setUser(user);
        
        return { success: true, user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Apple login error:', error);
      return { success: false, error: 'Apple ile giriş yapılırken bir hata oluştu.' };
    }
  }

  // Kullanıcı profilini güncelle
  async updateProfile(profileData) {
    try {
      const token = await this.getToken();
      
      if (!token) {
        return { success: false, error: 'Oturum bulunamadı.' };
      }

      const response = await api.put(API_ENDPOINTS.USER.UPDATE_PROFILE, profileData, token);

      if (response.success) {
        // Güncellenmiş user data'yı kaydet
        await this.setUser(response.data.user);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Profil güncellenirken bir hata oluştu.' };
    }
  }

  // Şifre değiştirme
  async changePassword(currentPassword, newPassword, newPasswordConfirmation) {
    try {
      const token = await this.getToken();
      
      if (!token) {
        return { success: false, error: 'Oturum bulunamadı.' };
      }

      const response = await api.post(API_ENDPOINTS.USER.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      }, token);

      return response;
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Şifre değiştirilirken bir hata oluştu.' };
    }
  }

  // Oturum kontrolü
  async isAuthenticated() {
    try {
      const token = await this.getToken();
      const user = await this.getUser();
      
      console.log('🔐 isAuthenticated - Token:', token ? 'Token var' : 'Token yok');
      console.log('🔐 isAuthenticated - User:', user ? 'User var' : 'User yok');
      console.log('🔐 isAuthenticated - Result:', !!(token && user));
      
      return !!(token && user);
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  // Debug: Token durumunu kontrol et
  async debugTokenStatus() {
    try {
      const token = await this.getToken();
      const user = await this.getUser();
      const isAuth = await this.isAuthenticated();
      
      console.log('🔍 Debug Token Status:');
      console.log('  - Token exists:', !!token);
      console.log('  - Token value:', token);
      console.log('  - User exists:', !!user);
      console.log('  - User value:', user);
      console.log('  - Is authenticated:', isAuth);
      
      // AsyncStorage'ı manuel test et
      console.log('🔍 Manual AsyncStorage test:');
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('  - All AsyncStorage keys:', allKeys);
      
      const allItems = await AsyncStorage.multiGet(allKeys);
      console.log('  - All AsyncStorage items:', allItems);
      
      return { token: !!token, user: !!user, isAuthenticated: isAuth };
    } catch (error) {
      console.error('Debug token status error:', error);
      return { token: false, user: false, isAuthenticated: false };
    }
  }
}

export default new AuthService(); 