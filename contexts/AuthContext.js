import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
// import socketService from '../services/socketService'; // Geçici olarak kaldırıldı

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const userData = await authService.getUser();
        
        // Onboarding kaldırıldı - direkt true yap
        if (userData) {
          userData.isOnboardingCompleted = true;
        }
        
        setUser(userData);
        
        // WebSocket bağlantısını geçici olarak devre dışı bırak
        // const token = await authService.getToken();
        // if (token && !socketService.isSocketConnected()) {
        //   socketService.connect(token);
        // }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        // Login sonrası onboarding durumunu kontrol et
        const userData = result.user;
        if (userData) {
          userData.isOnboardingCompleted = true;
        }
        setUser(userData);
        
        // WebSocket bağlantısını geçici olarak devre dışı bırak
        // const token = await authService.getToken();
        // if (token && !socketService.isSocketConnected()) {
        //   socketService.connect(token);
        // }
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Giriş yapılırken bir hata oluştu.' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        // Register sonrası onboarding durumunu kontrol et
        const newUserData = result.user;
        if (newUserData) {
          newUserData.isOnboardingCompleted = true;
        }
        setUser(newUserData);
      }
      
      return result;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Kayıt olurken bir hata oluştu.' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      
      // WebSocket bağlantısını geçici olarak devre dışı bırak
      // socketService.disconnect();
      
      // Kaydedilen postları temizle (AsyncStorage'dan manuel olarak)
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const keys = await AsyncStorage.getAllKeys();
        const savedPostKeys = keys.filter(key => key.startsWith('savedPosts_'));
        if (savedPostKeys.length > 0) {
          await AsyncStorage.multiRemove(savedPostKeys);
        }
      } catch (storageError) {
        console.error('Failed to clear saved posts on logout:', storageError);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData) => {
    try {
      console.log('🔄 AuthContext updateUser called with:', userData);
      console.log('🔄 Current user before update:', user);
      
      // userData'nın geçerli olduğundan emin ol
      if (!userData || typeof userData !== 'object') {
        console.error('❌ Invalid userData provided:', userData);
        return;
      }
      
      // State'i güncelle
      setUser(userData);
      console.log('✅ User state updated');
      
      // AsyncStorage'a da kaydet
      await authService.updateUser(userData);
      console.log('✅ User saved to AsyncStorage');
      
      console.log('✅ User updated successfully:', userData);
      console.log('✅ New user state should be:', userData);
    } catch (error) {
      console.error('❌ Error updating user:', error);
      // Hata durumunda state'i geri al
      console.log('🔄 Reverting user state due to error');
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};