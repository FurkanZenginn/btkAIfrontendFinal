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
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  // YENİ: Tüm verileri sıfırla
  const handleResetAllData = async () => {
    try {
      console.log('🔄 Tüm Hap Bilgi verileri sıfırlanıyor...');
      await hapBilgiService.resetAllHapBilgiler();
      await loadHapBilgiler(); // Verileri yeniden yükle
      console.log('✅ Tüm veriler sıfırlandı ve yeniden yüklendi');
    } catch (error) {
      console.error('❌ Veri sıfırlama hatası:', error);
    }
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

  // Screen focus olduğunda verileri yeniden yükle
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 HapBilgiScreen focus oldu, veriler yeniden yükleniyor...');
      loadHapBilgiler();
    });

    return unsubscribe;
  }, [navigation]);

  // Hardware back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🔙 Hardware back button pressed');
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      } else {
        navigation.navigate('ToolsMain');
        return true;
      }
    });

    return () => backHandler.remove();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            console.log('🔙 Geri butonuna tıklandı');
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('ToolsMain');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>HAP BİLGİ</Text>
          <Text style={styles.headerSubtitle}>AI Destekli Öğrenme</Text>
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleResetAllData}
        >
          <Ionicons name="refresh" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        

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
            <LinearGradient
              colors={['#f3f4f6', '#e5e7eb']}
              style={styles.emptyStateGradient}
            >
              <View style={styles.emptyStateIconContainer}>
                <Ionicons name="sparkles-outline" size={64} color="#8b5cf6" />
              </View>
              <Text style={styles.emptyStateTitle}>Henüz hap bilgi yok</Text>
              <Text style={styles.emptyStateText}>
                AI'ya soru sorduğunuzda analiz edip hap bilgiler önerecek
              </Text>
              <TouchableOpacity 
                style={styles.aiButton}
                onPress={() => navigation.navigate('Chat')}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#a855f7']}
                  style={styles.aiButtonGradient}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                  <Text style={styles.aiButtonText}>AI'ya Soru Sor</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  searchButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  aiTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  infoTitle: {
    ...FONT_STYLES.h3,
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'left',
    fontSize: 20,
    fontWeight: '700',
  },
  infoText: {
    ...FONT_STYLES.body,
    color: '#4b5563',
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: 16,
    fontSize: 14,
  },
  infoFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  infoFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyStateGradient: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    borderRadius: 25,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  aiButtonText: {
    ...FONT_STYLES.body,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
}); 