import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../utils/fonts';
import hapBilgiService from '../services/hapBilgiService';

const SimilarQuestionsModal = ({ visible, onClose, hapBilgiId, hapBilgiTitle, navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && hapBilgiId) {
      loadSimilarQuestions();
    }
  }, [visible, hapBilgiId]);

  const loadSimilarQuestions = async () => {
    try {
      setLoading(true);
      const result = await hapBilgiService.getSimilarQuestions(hapBilgiId);
      
      if (result.success) {
        setQuestions(result.data || []);
      } else {
        Alert.alert('❌ Hata', result.error || 'Benzer sorular yüklenemedi');
      }
    } catch (error) {
      console.error('Benzer sorular yükleme hatası:', error);
      Alert.alert('❌ Hata', 'Benzer sorular yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionPress = (question) => {
    onClose();
    // Post detay sayfasına git
    navigation.navigate('PostDetail', { postId: question.postId });
  };

  const renderQuestionCard = (question, index) => (
    <TouchableOpacity
      key={question._id || index}
      style={styles.questionCard}
      onPress={() => handleQuestionPress(question)}
    >
      <View style={styles.questionHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{question.username}</Text>
          <Text style={styles.timeAgo}>{question.timeAgo}</Text>
        </View>
        <View style={styles.similarityScore}>
          <Text style={styles.similarityText}>{question.similarityScore || 85}%</Text>
          <Text style={styles.similarityLabel}>Benzerlik</Text>
        </View>
      </View>
      
      <Text style={styles.questionText} numberOfLines={3}>
        {question.content}
      </Text>
      
      <View style={styles.questionMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#7f8c8d" />
          <Text style={styles.metaText}>{question.commentCount || 0}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="heart-outline" size={16} color="#7f8c8d" />
          <Text style={styles.metaText}>{question.likes || 0}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="eye-outline" size={16} color="#7f8c8d" />
          <Text style={styles.metaText}>{question.views || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              "{hapBilgiTitle}" konusunda sorular
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Benzer sorular aranıyor...</Text>
              </View>
            ) : questions.length > 0 ? (
              <>
                <View style={styles.infoContainer}>
                  <Ionicons name="information-circle" size={20} color="#3498db" />
                  <Text style={styles.infoText}>
                    Bu konuyla ilgili {questions.length} benzer soru bulundu
                  </Text>
                </View>
                
                {questions.map((question, index) => renderQuestionCard(question, index))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#bdc3c7" />
                <Text style={styles.emptyTitle}>Benzer soru bulunamadı</Text>
                <Text style={styles.emptyText}>
                  Bu konuyla ilgili henüz başka soru sorulmamış. İlk siz sorun!
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerTitle: {
    ...FONT_STYLES.h3,
    color: '#2c3e50',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...FONT_STYLES.body,
    color: '#7f8c8d',
    marginTop: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    ...FONT_STYLES.caption,
    color: '#2c3e50',
    marginLeft: 8,
  },
  questionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    ...FONT_STYLES.caption,
    color: '#2c3e50',
    fontWeight: '600',
  },
  timeAgo: {
    ...FONT_STYLES.caption,
    color: '#7f8c8d',
    fontSize: 12,
  },
  similarityScore: {
    alignItems: 'center',
  },
  similarityText: {
    ...FONT_STYLES.caption,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  similarityLabel: {
    ...FONT_STYLES.caption,
    color: '#7f8c8d',
    fontSize: 10,
  },
  questionText: {
    ...FONT_STYLES.body,
    color: '#34495e',
    lineHeight: 18,
    marginBottom: 12,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    ...FONT_STYLES.caption,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    ...FONT_STYLES.h3,
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    ...FONT_STYLES.body,
    color: '#95a5a6',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default SimilarQuestionsModal; 