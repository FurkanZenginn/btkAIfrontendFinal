import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../utils/fonts';
import hapBilgiService from '../services/hapBilgiService';

const HapBilgiCard = ({ hapBilgi, onSimilarQuestions, style }) => {
  const [isLiked, setIsLiked] = useState(hapBilgi.isLiked || false);
  const [isSaved, setIsSaved] = useState(hapBilgi.isSaved || false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    // Test ID'lerini kontrol et
    if (hapBilgi._id && (hapBilgi._id.startsWith('test') || hapBilgi._id.length < 10)) {
      Alert.alert('⚠️ Uyarı', 'Bu test verisi, gerçek veri değil!');
      return;
    }
    
    try {
      setLoading(true);
      const result = await hapBilgiService.likeHapBilgi(hapBilgi._id);
      if (result.success) {
        setIsLiked(!isLiked);
        Alert.alert('✅ Başarılı', isLiked ? 'Beğeniden çıkarıldı' : 'Beğenildi!');
      } else {
        Alert.alert('❌ Hata', result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Hap bilgi beğenme hatası:', error);
      Alert.alert('❌ Hata', 'Beğenme işlemi başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Test ID'lerini kontrol et
    if (hapBilgi._id && (hapBilgi._id.startsWith('test') || hapBilgi._id.length < 10)) {
      Alert.alert('⚠️ Uyarı', 'Bu test verisi, gerçek veri değil!');
      return;
    }
    
    try {
      setLoading(true);
      const result = await hapBilgiService.saveHapBilgi(hapBilgi._id);
      if (result.success) {
        setIsSaved(!isSaved);
        Alert.alert('✅ Başarılı', isSaved ? 'Kayıtlardan çıkarıldı' : 'Kaydedildi!');
      } else {
        Alert.alert('❌ Hata', result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Hap bilgi kaydetme hatası:', error);
      Alert.alert('❌ Hata', 'Kaydetme işlemi başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleSimilarQuestions = async () => {
    // Test ID'lerini kontrol et
    if (hapBilgi._id && (hapBilgi._id.startsWith('test') || hapBilgi._id.length < 10)) {
      Alert.alert('⚠️ Uyarı', 'Bu test verisi, gerçek veri değil!');
      return;
    }
    
    console.log('🎯 HapBilgiCard - Benzer Sorular butonuna tıklandı');
    console.log('📋 Hap bilgi ID:', hapBilgi._id);
    console.log('🔗 onSimilarQuestions callback var mı:', !!onSimilarQuestions);
    
    if (onSimilarQuestions) {
      console.log('✅ Callback çağrılıyor...');
      onSimilarQuestions(hapBilgi._id);
    } else {
      console.log('❌ Callback yok!');
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Başlık */}
      <Text style={styles.title}>{hapBilgi.title}</Text>
      
      {/* İçerik */}
      <Text style={styles.content}>{hapBilgi.content}</Text>
      
      {/* Kategori ve Zorluk */}
      <View style={styles.metaContainer}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(hapBilgi.category) }]}>
          <Text style={styles.categoryText}>{hapBilgi.category}</Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(hapBilgi.difficulty) }]}>
          <Text style={styles.difficultyText}>{hapBilgi.difficulty}</Text>
        </View>
      </View>
      
      {/* Anahtar Kelimeler */}
      {hapBilgi.keywords && hapBilgi.keywords.length > 0 && (
        <View style={styles.keywordsContainer}>
          {hapBilgi.keywords.slice(0, 5).map((keyword, index) => (
            <Text key={index} style={styles.keyword}>#{keyword}</Text>
          ))}
        </View>
      )}
      
      {/* İstatistikler */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Ionicons name="heart" size={16} color="#ff4757" />
          <Text style={styles.statText}>{hapBilgi.likes || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="bookmark" size={16} color="#3742fa" />
          <Text style={styles.statText}>{hapBilgi.saves || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="eye" size={16} color="#2ed573" />
          <Text style={styles.statText}>{hapBilgi.views || 0}</Text>
        </View>
      </View>
      
      {/* Aksiyon Butonları */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, isLiked && styles.actionButtonActive]} 
          onPress={handleLike}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={isLiked ? "#fff" : "#ff4757"} 
              />
              <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                {isLiked ? 'Beğenildi' : 'Beğen'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, isSaved && styles.actionButtonActive]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isSaved ? "#fff" : "#3742fa"} 
              />
              <Text style={[styles.actionText, isSaved && styles.actionTextActive]}>
                {isSaved ? 'Kaydedildi' : 'Kaydet'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleSimilarQuestions}
        >
          <Ionicons name="search" size={20} color="#2ed573" />
          <Text style={styles.actionText}>Benzer Sorular</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Kategori renkleri
const getCategoryColor = (category) => {
  const colors = {
    matematik: '#ff6b6b',
    fizik: '#4ecdc4',
    kimya: '#45b7d1',
    biyoloji: '#96ceb4',
    tarih: '#feca57',
    coğrafya: '#ff9ff3',
    türkçe: '#54a0ff',
    ingilizce: '#5f27cd'
  };
  return colors[category] || '#95a5a6';
};

// Zorluk renkleri
const getDifficultyColor = (difficulty) => {
  const colors = {
    kolay: '#2ed573',
    orta: '#ffa502',
    zor: '#ff4757'
  };
  return colors[difficulty] || '#95a5a6';
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    ...FONT_STYLES.h3,
    color: '#2c3e50',
    marginBottom: 8,
  },
  content: {
    ...FONT_STYLES.body,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    ...FONT_STYLES.caption,
    color: '#fff',
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  difficultyText: {
    ...FONT_STYLES.caption,
    color: '#fff',
    fontWeight: '600',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  keyword: {
    ...FONT_STYLES.caption,
    color: '#3498db',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    ...FONT_STYLES.caption,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  actionText: {
    ...FONT_STYLES.caption,
    color: '#6c757d',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#fff',
  },
});

export default HapBilgiCard; 