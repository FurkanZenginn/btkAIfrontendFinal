import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../utils/fonts';
import HapBilgiCard from '../components/HapBilgiCard';
import SimilarQuestionsModal from '../components/SimilarQuestionsModal';
import hapBilgiService from '../services/hapBilgiService';

export default function HapBilgiScreen({ navigation }) {
  const [hapBilgiler, setHapBilgiler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSimilarQuestionsModal, setShowSimilarQuestionsModal] = useState(false);
  const [selectedHapBilgi, setSelectedHapBilgi] = useState(null);

  // Veri yükleme fonksiyonu
  const loadHapBilgiler = async () => {
    try {
      setLoading(true);
      console.log('🔄 Hap Bilgi yükleniyor...');
      
      const result = await hapBilgiService.getRecommendedHapBilgiler(20);
      
      console.log('📊 Hap bilgi result:', result);
      
      if (result && result.success) {
        const hapBilgiData = result.data || [];
        console.log('✅ Hap Bilgi loaded:', hapBilgiData.length, 'items');
        setHapBilgiler(hapBilgiData);
      } else {
        console.error('❌ Hap Bilgi loading failed:', result?.error || 'Unknown error');
        setHapBilgiler([]);
      }
    } catch (error) {
      console.error('❌ Hap Bilgi loading error:', error);
      
      // Token hatası kontrolü
      if (error.message && error.message.includes('Token eksik')) {
        console.log('🔑 Token hatası tespit edildi, kullanıcıyı login sayfasına yönlendir');
        // Kullanıcıyı login sayfasına yönlendir
        navigation.navigate('Login');
        return;
      }
      
      setHapBilgiler([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh fonksiyonu
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHapBilgiler();
    setRefreshing(false);
  };

  // Benzer sorular fonksiyonu
  const handleSimilarQuestions = (hapBilgiId) => {
    console.log('🔍 handleSimilarQuestions çağrıldı:', hapBilgiId);
    console.log('📊 Mevcut hapBilgiler:', hapBilgiler);
    
    const hapBilgi = hapBilgiler.find(hb => hb._id === hapBilgiId);
    console.log('🎯 Bulunan hapBilgi:', hapBilgi);
    
    if (hapBilgi) {
      console.log('✅ Hap bilgi bulundu, modal açılıyor...');
      setSelectedHapBilgi(hapBilgi);
      setShowSimilarQuestionsModal(true);
    } else {
      console.log('❌ Hap bilgi bulunamadı!');
    }
  };

  // Component mount olduğunda veri yükle
  useEffect(() => {
    loadHapBilgiler();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#8b5cf6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HAP BİLGİ</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Açıklama */}
        <View style={styles.infoSection}>
          <Ionicons name="bulb" size={32} color="#8b5cf6" />
          <Text style={styles.infoTitle}>Hap Bilgi Nedir?</Text>
          <Text style={styles.infoText}>
            AI analizi sonucu oluşturulan özet bilgiler. Soru sorduğunuzda AI konuyu analiz edip 
            size özel hap bilgiler oluşturur.
          </Text>
        </View>

        {/* Hap Bilgi Kartları */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Hap bilgiler yükleniyor...</Text>
          </View>
        ) : hapBilgiler.length > 0 ? (
          <View style={styles.cardsContainer}>
            {hapBilgiler.map((hapBilgi) => (
              <HapBilgiCard
                key={hapBilgi._id}
                hapBilgi={hapBilgi}
                onSimilarQuestions={handleSimilarQuestions}
                style={styles.hapBilgiCard}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>Henüz hap bilgi yok</Text>
            <Text style={styles.emptyStateText}>
              AI'ya soru sorduğunuzda analiz edip hap bilgiler önerecek
            </Text>
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={() => navigation.navigate('Chat')}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.aiButtonText}>AI'ya Soru Sor</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Benzer Sorular Modal */}
      <SimilarQuestionsModal
        visible={showSimilarQuestionsModal}
        onClose={() => setShowSimilarQuestionsModal(false)}
        hapBilgiId={selectedHapBilgi?._id}
        hapBilgiTitle={selectedHapBilgi?.title}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 35 : 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    ...FONT_STYLES.h3,
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    marginTop: 12,
  },
  cardsContainer: {
    gap: 16,
  },
  hapBilgiCard: {
    marginBottom: 0, // HapBilgiCard'ın kendi margin'i var
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    ...FONT_STYLES.h3,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonText: {
    ...FONT_STYLES.body,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
}); 