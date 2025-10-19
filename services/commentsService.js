import api, { API_ENDPOINTS } from './api';
import authService from './authService';

class CommentsService {
  // Post'un yorumlarını getir
  async getComments(postId) {
    try {
      console.log('💬 Get comments - Post ID:', postId);
      
      // Çalışan endpoint'i direkt kullan
      console.log('💬 Get comments - Using working endpoint:', API_ENDPOINTS.COMMENTS.GET_BY_POST(postId));
      const response = await api.get(API_ENDPOINTS.COMMENTS.GET_BY_POST(postId));
      
      console.log('💬 Get comments - Final Response:', response);
      
      // Response yapısını kontrol et
      if (response.success && response.data) {
        console.log('💬 Response structure check:', {
          hasData: !!response.data,
          hasComments: !!response.data.comments,
          hasDataData: !!response.data.data,
          hasDataDataComments: !!response.data.data?.comments
        });
      }
      
      return response;
    } catch (error) {
      console.error('Get comments error:', error);
      return { success: false, error: 'Yorumlar yüklenirken bir hata oluştu.' };
    }
  }

  // Yeni yorum ekle
  async createComment(postId, commentText, parentCommentId = null, isFromGemini = false) {
    try {
      const token = await authService.getToken();
      console.log('💬 Create comment - Token:', token ? 'Token var' : 'Token yok');
      console.log('💬 Create comment - Post ID:', postId);
      console.log('💬 Create comment - Comment:', commentText);
      console.log('💬 Create comment - Parent Comment ID:', parentCommentId);
      console.log('💬 Create comment - Is From Gemini:', isFromGemini);
      
      // Request body'yi hazırla
      const requestBody = { text: commentText };
      if (parentCommentId) {
        requestBody.parentCommentId = parentCommentId;
      }
      if (isFromGemini) {
        requestBody.isFromGemini = true;
      }
      
      // Çalışan endpoint'i direkt kullan
      console.log('💬 Create comment - Using working endpoint:', API_ENDPOINTS.COMMENTS.CREATE_REAL(postId));
      const response = await api.post(
        API_ENDPOINTS.COMMENTS.CREATE_REAL(postId),
        requestBody, // Backend 'text' field'ını bekliyor
        token
      );
      
      console.log('💬 Create comment - Final Response:', response);
      return response;
    } catch (error) {
      console.error('Create comment error:', error);
      return { success: false, error: 'Yorum eklenirken bir hata oluştu.' };
    }
  }

  // Yorum beğen/beğenme
  async toggleCommentLike(commentId) {
    try {
      const token = await authService.getToken();
      const response = await api.put(
        API_ENDPOINTS.COMMENTS.LIKE(commentId),
        {},
        token
      );
      return response;
    } catch (error) {
      console.error('Toggle comment like error:', error);
      return { success: false, error: 'Yorum beğeni işlemi yapılırken bir hata oluştu.' };
    }
  }

  // Yorum sil
  async deleteComment(commentId) {
    try {
      const token = await authService.getToken();
      const response = await api.delete(
        API_ENDPOINTS.COMMENTS.DELETE(commentId),
        token
      );
      return response;
    } catch (error) {
      console.error('Delete comment error:', error);
      return { success: false, error: 'Yorum silinirken bir hata oluştu.' };
    }
  }

  // AI yanıtını kontrol et (HTTP polling için)
  async checkAIResponse(commentId) {
    try {
      const token = await authService.getToken();
      const response = await api.get(
        `/api/comments/${commentId}/ai-response`,
        token
      );
      return response;
    } catch (error) {
      console.error('Check AI response error:', error);
      return { success: false, error: 'AI yanıtı kontrol edilirken bir hata oluştu.' };
    }
  }
}

export default new CommentsService(); 