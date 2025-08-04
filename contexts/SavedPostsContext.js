import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const SavedPostsContext = createContext();

export const SavedPostsProvider = ({ children }) => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [postDeletedEvent, setPostDeletedEvent] = useState(0);
  const { user } = useAuth();

  // Kullanıcı ID'sine göre storage key oluştur
  const getStorageKey = (userId) => `savedPosts_${userId}`;

  useEffect(() => {
    if (user?._id) {
      loadSavedPosts();
    } else {
      // Kullanıcı yoksa kaydedilen postları temizle
      setSavedPosts([]);
    }
  }, [user?._id]);

  const loadSavedPosts = async () => {
    try {
      if (!user?._id) return;
      
      const storageKey = getStorageKey(user._id);
      const saved = await AsyncStorage.getItem(storageKey);
      if (saved) {
        setSavedPosts(JSON.parse(saved));
      } else {
        setSavedPosts([]);
      }
    } catch (error) {
      console.error('Failed to load saved posts:', error);
      setSavedPosts([]);
    }
  };

  const savePost = async (post) => {
    try {
      if (!user?._id) {
        return { success: false, error: 'Kullanıcı girişi gerekli.' };
      }

      const storageKey = getStorageKey(user._id);
      const updatedPosts = [...savedPosts, { ...post, savedAt: new Date().toISOString() }];
      setSavedPosts(updatedPosts);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedPosts));
      return { success: true };
    } catch (error) {
      console.error('Failed to save post:', error);
      return { success: false, error: 'Post kaydedilemedi.' };
    }
  };

  const unsavePost = async (postId) => {
    try {
      if (!user?._id) {
        return { success: false, error: 'Kullanıcı girişi gerekli.' };
      }

      const storageKey = getStorageKey(user._id);
      const updatedPosts = savedPosts.filter(post => post.id !== postId);
      setSavedPosts(updatedPosts);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedPosts));
      return { success: true };
    } catch (error) {
      console.error('Failed to unsave post:', error);
      return { success: false, error: 'Post kayıttan çıkarılamadı.' };
    }
  };

  const isPostSaved = (postId) => {
    return savedPosts.some(post => post.id === postId);
  };

  const clearSavedPosts = async () => {
    try {
      if (!user?._id) return;
      
      const storageKey = getStorageKey(user._id);
      await AsyncStorage.removeItem(storageKey);
      setSavedPosts([]);
    } catch (error) {
      console.error('Failed to clear saved posts:', error);
    }
  };

  // Post silme event'i tetikle (sadece gerçekten silinen postlar için)
  const triggerPostDeleted = (postId = null) => {
    console.log('🔄 Post deleted event triggered for post:', postId);
    setPostDeletedEvent(prev => prev + 1);
  };

  const value = {
    savedPosts,
    savePost,
    unsavePost,
    isPostSaved,
    clearSavedPosts,
    postDeletedEvent,
    triggerPostDeleted,
  };

  return <SavedPostsContext.Provider value={value}>{children}</SavedPostsContext.Provider>;
};

export const useSavedPosts = () => {
  return useContext(SavedPostsContext);
}; 