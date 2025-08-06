import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import postsService from '../services/postsService';
import { transformPostsData, validateApiResponse } from '../utils/dataTransformers';

/**
 * Custom hook for managing posts data and operations
 */
export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [lastPostCount, setLastPostCount] = useState(0);
  
  const { user } = useAuth();

  // Load posts from backend
  const loadPosts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await postsService.getPosts();
      const validatedResult = validateApiResponse(result);

      if (validatedResult.success) {
        const postsData = validatedResult.data?.data?.posts || validatedResult.data?.posts;
        
        if (Array.isArray(postsData)) {
          const transformedPosts = transformPostsData(postsData, user);
          
          // Check for new posts
          const currentPostCount = transformedPosts.length;
          if (!isRefresh && lastPostCount > 0 && currentPostCount > lastPostCount) {
            setHasNewPosts(true);
          }
          
          setPosts(transformedPosts);
          setLastPostCount(transformedPosts.length);
          
          if (isRefresh) {
            setHasNewPosts(false);
          }
        } else {
          setPosts([]);
        }
      } else {
        setError(validatedResult.error || 'Posts yüklenirken bir hata oluştu');
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Posts loading error:', error);
      setError('Posts yüklenirken bir hata oluştu');
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, lastPostCount]);

  // Like a post
  const likePost = useCallback(async (postId) => {
    try {
      const result = await postsService.likePost(postId);
      
      if (result.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  isLiked: !post.isLiked,
                  likes: post.isLiked 
                    ? Math.max(0, parseInt(post.likes) - 1).toString()
                    : (parseInt(post.likes) + 1).toString()
                }
              : post
          )
        );
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Like post error:', error);
      return { success: false, error: 'Beğenme işlemi başarısız' };
    }
  }, []);

  // Bookmark a post
  const bookmarkPost = useCallback(async (postId) => {
    try {
      const result = await postsService.bookmarkPost(postId);
      
      if (result.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, isSaved: !post.isSaved }
              : post
          )
        );
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Bookmark post error:', error);
      return { success: false, error: 'Kaydetme işlemi başarısız' };
    }
  }, []);

  // Delete a post
  const deletePost = useCallback(async (postId) => {
    try {
      const result = await postsService.deletePost(postId);
      
      if (result.success) {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Delete post error:', error);
      return { success: false, error: 'Silme işlemi başarısız' };
    }
  }, []);

  // Refresh posts
  const refreshPosts = useCallback(() => {
    loadPosts(true);
  }, [loadPosts]);

  // Check for new posts
  const checkNewPosts = useCallback(async () => {
    try {
      const result = await postsService.getPosts();
      const validatedResult = validateApiResponse(result);
      
      if (validatedResult.success) {
        const postsData = validatedResult.data?.data?.posts || validatedResult.data?.posts;
        
        if (Array.isArray(postsData) && postsData.length > lastPostCount) {
          setHasNewPosts(true);
        }
      }
    } catch (error) {
      console.error('❌ Check new posts error:', error);
    }
  }, [lastPostCount]);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return {
    posts,
    loading,
    refreshing,
    error,
    hasNewPosts,
    loadPosts,
    likePost,
    bookmarkPost,
    deletePost,
    refreshPosts,
    checkNewPosts,
    setHasNewPosts,
  };
}; 