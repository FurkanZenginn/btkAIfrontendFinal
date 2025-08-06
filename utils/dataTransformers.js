// Data transformation utilities for clean separation of concerns

/**
 * Transform backend post data to frontend format
 * @param {Array} postsData - Raw posts data from backend
 * @param {Object} currentUser - Current authenticated user
 * @returns {Array} Transformed posts
 */
export const transformPostsData = (postsData, currentUser) => {
  if (!Array.isArray(postsData)) {
    console.warn('⚠️ transformPostsData: postsData is not an array');
    return [];
  }

  return postsData.map(post => {
    // Check if it's user's own post
    const isOwnPost = currentUser && (
      post.userId?._id === currentUser._id || 
      post.userId === currentUser._id
    );
    
    // Use current user data for own posts
    const displayUsername = isOwnPost 
      ? (currentUser.name || 'Sen') 
      : (post.userId?.name || post.name || 'Unknown User');
    
    const displayUserImage = isOwnPost 
      ? (currentUser.avatar || post.userId?.avatar) 
      : (post.userId?.avatar || post.userImage);
    
    return {
      id: post._id || post.id,
      userId: post.userId?._id || post.userId || null,
      username: displayUsername,
      userImage: displayUserImage,
      postImage: post.imageURL || post.postImage || null,
      caption: post.caption || post.text || '',
      likes: post.likes?.length?.toString() || post.likes || '0',
      timeAgo: post.createdAt ? getTimeAgo(new Date(post.createdAt)) : post.timeAgo || '1h',
      isLiked: post.isLiked || false,
      isFromAI: post.isFromAI || false,
      aiPrompt: post.aiPrompt || null,
      aiResponseType: post.aiResponseType || null,
      commentCount: post.commentCount || 0,
      isOwnPost: isOwnPost,
      postType: post.postType || null,
    };
  });
};

/**
 * Transform backend user data to frontend format
 * @param {Object} userData - Raw user data from backend
 * @returns {Object} Transformed user data
 */
export const transformUserData = (userData) => {
  if (!userData) return null;

  return {
    id: userData._id || userData.id,
    name: userData.name || userData.username || 'Unknown User',
    email: userData.email,
    avatar: userData.avatar || userData.profileImage,
    bio: userData.bio || '',
    followersCount: userData.followersCount || 0,
    followingCount: userData.followingCount || 0,
    isFollowing: userData.isFollowing || false,
    level: userData.level || 1,
    xp: userData.xp || 0,
    isOnboardingCompleted: userData.isOnboardingCompleted || true,
  };
};

/**
 * Transform backend Hap Bilgi data to frontend format
 * @param {Object} hapBilgiData - Raw Hap Bilgi data from backend
 * @returns {Object} Transformed Hap Bilgi data
 */
export const transformHapBilgiData = (hapBilgiData) => {
  if (!hapBilgiData) return null;

  return {
    id: hapBilgiData._id || hapBilgiData.id,
    title: hapBilgiData.title || '',
    content: hapBilgiData.content || hapBilgiData.text || '',
    category: hapBilgiData.category || 'Genel',
    difficulty: hapBilgiData.difficulty || 'Orta',
    keywords: hapBilgiData.keywords || [],
    relatedQuestions: hapBilgiData.relatedQuestions || [],
    likes: hapBilgiData.likes || 0,
    saves: hapBilgiData.saves || 0,
    views: hapBilgiData.views || 0,
    isLiked: hapBilgiData.isLiked || false,
    isSaved: hapBilgiData.isSaved || false,
    createdAt: hapBilgiData.createdAt,
    timeAgo: hapBilgiData.createdAt ? getTimeAgo(new Date(hapBilgiData.createdAt)) : '1h',
  };
};

/**
 * Get time ago string from date
 * @param {Date} date - Date to calculate time ago
 * @returns {string} Time ago string
 */
export const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Az önce';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}d`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}s`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}g`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}h`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}ay`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y`;
};

/**
 * Validate and sanitize API response
 * @param {Object} response - API response object
 * @returns {Object} Validated response
 */
export const validateApiResponse = (response) => {
  if (!response) {
    return { success: false, error: 'No response received' };
  }

  if (typeof response !== 'object') {
    return { success: false, error: 'Invalid response format' };
  }

  return {
    success: response.success || false,
    data: response.data || null,
    error: response.error || null,
    status: response.status || null,
  };
}; 