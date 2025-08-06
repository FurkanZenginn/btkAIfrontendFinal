// Centralized error handling system

/**
 * Error types for different categories
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

/**
 * Classify error type based on error object
 * @param {Error} error - Error object
 * @returns {string} Error type
 */
export const classifyError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || error.status;

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'ECONNRESET'
  ) {
    return ERROR_TYPES.NETWORK;
  }

  // Authentication errors
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('token') ||
    errorMessage.includes('authentication') ||
    errorCode === 401 ||
    errorCode === 403
  ) {
    return ERROR_TYPES.AUTHENTICATION;
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorCode === 400 ||
    errorCode === 422
  ) {
    return ERROR_TYPES.VALIDATION;
  }

  // Server errors
  if (
    errorCode >= 500 ||
    errorMessage.includes('server') ||
    errorMessage.includes('internal')
  ) {
    return ERROR_TYPES.SERVER;
  }

  return ERROR_TYPES.UNKNOWN;
};

/**
 * Get error severity based on error type and context
 * @param {string} errorType - Error type
 * @param {string} context - Error context (e.g., 'login', 'posts', 'profile')
 * @returns {string} Error severity
 */
export const getErrorSeverity = (errorType, context = '') => {
  switch (errorType) {
    case ERROR_TYPES.AUTHENTICATION:
      return context === 'login' ? ERROR_SEVERITY.HIGH : ERROR_SEVERITY.CRITICAL;
    
    case ERROR_TYPES.NETWORK:
      return ERROR_SEVERITY.MEDIUM;
    
    case ERROR_TYPES.SERVER:
      return ERROR_SEVERITY.HIGH;
    
    case ERROR_TYPES.VALIDATION:
      return ERROR_SEVERITY.LOW;
    
    default:
      return ERROR_SEVERITY.MEDIUM;
  }
};

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, context = '') => {
  const errorType = classifyError(error);
  const errorMessage = error.message?.toLowerCase() || '';

  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
    
    case ERROR_TYPES.AUTHENTICATION:
      if (context === 'login') {
        return 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.';
      }
      return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
    
    case ERROR_TYPES.VALIDATION:
      if (errorMessage.includes('email')) {
        return 'Geçerli bir e-posta adresi girin.';
      }
      if (errorMessage.includes('password')) {
        return 'Şifre en az 6 karakter olmalıdır.';
      }
      return 'Lütfen tüm alanları doğru şekilde doldurun.';
    
    case ERROR_TYPES.SERVER:
      return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
    
    default:
      return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
  }
};

/**
 * Log error with context and severity
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @param {Object} additionalData - Additional data to log
 */
export const logError = (error, context = '', additionalData = {}) => {
  const errorType = classifyError(error);
  const severity = getErrorSeverity(errorType, context);
  const userMessage = getErrorMessage(error, context);

  const errorLog = {
    timestamp: new Date().toISOString(),
    type: errorType,
    severity,
    context,
    message: error.message,
    userMessage,
    stack: error.stack,
    ...additionalData,
  };

  // Log to console in development
  if (__DEV__) {
    console.error('🚨 Error Log:', errorLog);
  }

  // TODO: Send to error tracking service in production
  // if (!__DEV__) {
  //   // Send to Sentry, LogRocket, etc.
  // }

  return errorLog;
};

/**
 * Handle error with proper logging and user feedback
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @param {Function} showToast - Toast function to show user message
 * @param {Object} additionalData - Additional data
 * @returns {Object} Error handling result
 */
export const handleError = (error, context = '', showToast = null, additionalData = {}) => {
  const errorLog = logError(error, context, additionalData);
  const userMessage = getErrorMessage(error, context);

  // Show user-friendly message
  if (showToast && typeof showToast === 'function') {
    showToast(userMessage, 'error');
  }

  return {
    success: false,
    error: userMessage,
    errorType: errorLog.type,
    severity: errorLog.severity,
    shouldRetry: errorLog.type === ERROR_TYPES.NETWORK,
  };
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Function result
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}; 