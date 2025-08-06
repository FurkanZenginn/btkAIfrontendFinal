import { Platform } from 'react-native';

// API Base Configuration
// Farklı ortamlar için URL seçimi
const getApiBaseUrl = () => {
  console.log('🔍 Platform:', Platform.OS);
  console.log('🔍 __DEV__:', __DEV__);
  
  // Development ortamı için
  if (__DEV__) {
    // Web ortamı için
    if (Platform.OS === 'web') {
      console.log('🔍 Web environment detected');
      return 'http://localhost:3000/api';
    }
    // Android Emulator için
    if (Platform.OS === 'android') {
      console.log('🔍 Android Emulator detected');
      return 'http://10.0.2.2:3000/api';
    }
    // iOS Simulator için
    if (Platform.OS === 'ios') {
      console.log('🔍 iOS Simulator detected');
      return 'http://localhost:3000/api';
    }
    // Gerçek cihaz için (IP adresinizi buraya yazın)
    console.log('🔍 Real device detected');
    return 'http://10.0.2.2:3000/api';
  }
  
  // Production ortamı için
  console.log('🔍 Production environment detected');
  return 'https://your-production-api.com/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API Base URL:', API_BASE_URL);

// Default headers
const getDefaultHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

// Auth token ile headers
const getAuthHeaders = (token) => {
  console.log('🔐 getAuthHeaders called with token:', token ? 'Token var' : 'Token yok');
  console.log('🔐 getAuthHeaders token value:', token);
  
  // Token'ın geçerli olduğundan emin ol
  if (!token || token === 'null' || token === 'undefined' || token === '') {
    console.log('❌ Invalid token detected:', token);
    return getDefaultHeaders();
  }
  
  // JWT token formatını kontrol et
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    console.log('❌ Invalid JWT token format:', token);
    return getDefaultHeaders();
  }
  
  const headers = {
    ...getDefaultHeaders(),
    'Authorization': `Bearer ${token}`,
  };
  
  console.log('🔐 getAuthHeaders result:', headers);
  console.log('🔐 getAuthHeaders Authorization:', headers.Authorization);
  
  return headers;
};

// API Response Handler
const handleApiResponse = async (response) => {
  try {
    const data = await response.json();
    console.log('📊 Response data:', data);
    
    if (response.ok) {
      console.log('✅ API request successful');
      return { success: true, data };
    } else {
      console.error('❌ API request failed:', response.status, data);
      return { 
        success: false, 
        error: data.error || 'Bir hata oluştu',
        status: response.status 
      };
    }
  } catch (error) {
    console.error('💥 Response parsing error:', error);
    return { 
      success: false, 
      error: 'Response parsing error',
      status: response.status 
    };
  }
};

// API Error Handler
const handleApiError = (error) => {
  console.error('API Error:', error);
  return { 
    success: false, 
    error: 'Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin.' 
  };
};

// Generic API Request Function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 Making API request to:', url);
    console.log('📋 Request options:', options);
    
    const config = {
      headers: getDefaultHeaders(),
      ...options,
    };

    console.log('🔧 Request config:', config);
    const response = await fetch(url, config);
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error('💥 API Request Error:', error);
    return handleApiError(error);
  }
};

// Authenticated API Request Function
const authenticatedApiRequest = async (endpoint, token, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🔐 Making authenticated API request to:', url);
    console.log('🔐 Token received:', token ? 'Token var' : 'Token yok');
    console.log('🔐 Token value:', token);
    
    // Auth headers'ı al
    const authHeaders = getAuthHeaders(token);
    console.log('🔐 Auth headers:', authHeaders);
    console.log('🔐 Authorization header:', authHeaders.Authorization);
    
    // Custom headers varsa merge et, yoksa auth headers kullan
    let finalHeaders;
    if (options.headers) {
      // Custom headers varsa, auth headers'ı koruyarak merge et
      finalHeaders = {
        ...authHeaders,  // Önce auth headers (Authorization dahil)
        ...options.headers  // Sonra custom headers (Content-Type override edebilir)
      };
      // Authorization header'ının kesinlikle korunduğundan emin ol
      finalHeaders.Authorization = authHeaders.Authorization;
    } else {
      finalHeaders = authHeaders;
    }
    
    console.log('🔐 Final headers:', finalHeaders);
    console.log('🔐 Final Authorization header:', finalHeaders.Authorization);
    
    const config = {
      ...options,
      headers: finalHeaders, // headers'ı en son set et ki override olmasın
    };

    console.log('🔧 Authenticated request config:', config);
    console.log('🔧 Request headers:', config.headers);
    console.log('🔧 Config headers type:', typeof config.headers);
    console.log('🔧 Config headers keys:', Object.keys(config.headers || {}));
    console.log('🔧 Options:', options);
    console.log('🔧 Options headers:', options.headers);
    
    // FormData'yı debug et
    if (options.body && options.body instanceof FormData) {
      console.log('📋 FormData in request:');
      for (let [key, value] of options.body.entries()) {
        console.log(`  - ${key}:`, value);
      }
    }
    
    const response = await fetch(url, config);
    console.log('📡 Authenticated response status:', response.status);
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error('💥 Authenticated API Request Error:', error);
    return handleApiError(error);
  }
};

// API Methods
export const api = {
  // GET request
  get: (endpoint, token = null) => {
    const options = { method: 'GET' };
    return token 
      ? authenticatedApiRequest(endpoint, token, options)
      : apiRequest(endpoint, options);
  },

  // GET request
  get: (endpoint, token = null) => {
    const options = { method: 'GET' };
    return token 
      ? authenticatedApiRequest(endpoint, token, options)
      : apiRequest(endpoint, options);
  },

  // POST request
  post: (endpoint, data, token = null, customHeaders = {}) => {
    const options = { 
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    };
    
    // FormData için Content-Type'ı otomatik set etme (browser otomatik set eder)
    // Custom headers varsa ekle
    if (Object.keys(customHeaders).length > 0) {
      options.headers = customHeaders;
    }
    
    return token 
      ? authenticatedApiRequest(endpoint, token, options)
      : apiRequest(endpoint, options);
  },

  // PUT request
  put: (endpoint, data, token = null) => {
    const options = { 
      method: 'PUT',
      body: JSON.stringify(data)
    };
    return token 
      ? authenticatedApiRequest(endpoint, token, options)
      : apiRequest(endpoint, options);
  },

  // DELETE request
  delete: (endpoint, token = null) => {
    const options = { method: 'DELETE' };
    return token 
      ? authenticatedApiRequest(endpoint, token, options)
      : apiRequest(endpoint, options);
  },

  // PATCH request
  patch: (endpoint, data, token = null) => {
    const options = { 
      method: 'PATCH',
      body: JSON.stringify(data)
    };
    return token 
      ? authenticatedApiRequest(endpoint, token, options)
      : apiRequest(endpoint, options);
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    GOOGLE_LOGIN: '/auth/google',
    FACEBOOK_LOGIN: '/auth/facebook',
    APPLE_LOGIN: '/auth/apple',
  },
  
  // User endpoints
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
    UPLOAD_AVATAR: '/user/avatar',
  },
  
  // Users endpoints (for other users)
  USERS: {
    PROFILE: (userId) => `/user/${userId}/profile`,
    POSTS: (userId) => `/user/${userId}/posts`,
    FOLLOW: (userId) => `/user/${userId}/follow`,
    UNFOLLOW: (userId) => `/user/${userId}/follow`,
  },
  
  // Posts endpoints
  POSTS: {
    LIST: '/posts',
    PERSONALIZED: '/posts/personalized',
    CREATE: '/posts',
    GET_BY_ID: (id) => `/posts/${id}`,
    DETAIL: (id) => `/posts/${id}`,
    UPDATE: (id) => `/posts/${id}`,
    DELETE: (id) => `/posts/${id}`,
    LIKE: (id) => `/posts/${id}/like`,
    LIKE_ALT: (id) => `/posts/${id}/toggle-like`, // Alternatif endpoint
    COMMENT: (id) => `/posts/${id}/comments`,
    POPULAR_TAGS: '/posts/popular-tags',
  },
  
  // Comments endpoints
  COMMENTS: {
    GET_BY_POST: (postId) => `/comments?postId=${postId}&page=1&limit=20`,
    GET_BY_POST_ALT: (postId) => `/comments/${postId}?page=1&limit=20`, // Alternatif endpoint
    CREATE: (postId) => `/comments/${postId}`,
    CREATE_ALT: (postId) => `/posts/${postId}/comments`, // Alternatif endpoint
    LIKE: (id) => `/comments/${id}/like`,
    DELETE: (id) => `/comments/${id}`,
    // Backend'den gelen gerçek endpoint'ler
    GET_BY_POST_REAL: (postId) => `/comments?postId=${postId}&page=1&limit=20`,
    CREATE_REAL: (postId) => `/comments/${postId}`,
  },
  
  // AI endpoints
  AI: {
    QUESTION: '/ai/question', // Eski AI soru (geriye uyumluluk)
    ASK_WITH_OPTIONS: '/ai/ask-with-options', // Yeni AI soru (iki seçenekli)
    IMPROVE_PROMPT: '/ai/improve-prompt', // Prompt iyileştirme (YENİ!)
    ANALYZE_IMAGE: '/ai/analyze-image', // Sadece görsel analizi
    ANALYZE_POST: (postId) => `/ai/analyze-post/${postId}`, // Post analizi
    HAP_BILGI: '/hap-bilgi', // Basit string endpoint
    USER_ANALYSIS: '/ai/user-analysis', // Kullanıcı analizi
  },
  
  // Gamification endpoints
  GAMIFICATION: {
    PROFILE: '/gamification/profile',
    LEADERBOARD: '/gamification/leaderboard',
    ACHIEVEMENTS: '/gamification/achievements',
    ACTIVITY: '/gamification/activity',
  },
  
  // Messages endpoints
  MESSAGES: {
    LIST: '/messages',
    SEND: '/messages',
    CONVERSATIONS: '/messages/conversations',
  },
};

export { apiRequest, authenticatedApiRequest };
export default api; 