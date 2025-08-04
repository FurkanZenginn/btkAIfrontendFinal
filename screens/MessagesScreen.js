import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';

import { FONT_STYLES, FONTS, FONT_WEIGHTS, FONT_SIZES } from '../utils/fonts';
import gamificationService from '../services/gamificationService';


export default function MessagesScreen({ navigation }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [learningStats, setLearningStats] = useState([]);
  const [profileData, setProfileData] = useState(null);


  // Öğrenme istatistikleri (varsayılan)
  const defaultStats = [
    { label: 'Çözülen Soru', value: '0', icon: 'checkmark-circle-outline', color: '#10b981' },
    { label: 'Zayıf Konu', value: '0', icon: 'alert-circle-outline', color: '#ef4444' },
    { label: 'Bu Hafta', value: '0', icon: 'calendar-outline', color: '#f59e0b' },
    { label: 'Puan', value: '0', icon: 'trophy-outline', color: '#8b5cf6' },
  ];

  // Hızlı erişim kartları
  const quickCards = [
    {
      id: 'quiz',
      title: 'Quiz',
      subtitle: 'Bilgi Testleri',
      icon: 'help-circle-outline',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#a855f7'],
      onPress: () => console.log('Quiz kartına tıklandı'),
    },
    {
      id: 'hap-bilgi',
      title: 'HAP',
      subtitle: 'Bilgi',
      icon: 'medical-outline',
      color: '#10b981',
      gradient: ['#10b981', '#34d399'],
      onPress: () => navigation.navigate('HapBilgi'),
    },
  ];

  // Puan liderliği (varsayılan veri)
  const defaultLeaderboard = [];

  // Önerilen konular (zayıf konulara göre)
  const recommendedTopics = [
    {
      id: 1,
      subject: 'Fizik',
      topic: 'İvme ve Hareket',
      difficulty: 'Orta',
      questionCount: 12,
      lastAttempt: '2 gün önce',
      successRate: '45%',
      icon: 'speedometer-outline',
      color: '#ef4444',
    },
    {
      id: 2,
      subject: 'Matematik',
      topic: 'Türev',
      difficulty: 'Zor',
      questionCount: 8,
      lastAttempt: '1 hafta önce',
      successRate: '30%',
      icon: 'trending-up-outline',
      color: '#f59e0b',
    },
    {
      id: 3,
      subject: 'Kimya',
      topic: 'Molekül Yapısı',
      difficulty: 'Kolay',
      questionCount: 15,
      lastAttempt: '3 gün önce',
      successRate: '75%',
      icon: 'flask-outline',
      color: '#10b981',
    },
  ];

  // Topluluk soruları (AI analizi sonucu) - Şimdilik boş
  const communityQuestions = [];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#ffd700'; // Altın
      case 2: return '#c0c0c0'; // Gümüş
      case 3: return '#cd7f32'; // Bronz
      default: return '#6b7280';
    }
  };

  // Veri yükleme fonksiyonları
  const loadData = async () => {
    try {
      setLoading(true);

      
      // Paralel olarak tüm verileri yükle
      const [profileResult, leaderboardResult] = await Promise.all([
        gamificationService.getProfile(),
        gamificationService.getLeaderboard()
      ]);

      // Profil verilerini işle
      if (profileResult.success && profileResult.data) {
        const userData = profileResult.data.data?.user || profileResult.data.user;
        const statsData = profileResult.data.data?.stats || profileResult.data.stats;
        
        if (userData && statsData) {
          const newStats = [
            { label: 'Çözülen Soru', value: statsData.postsCreated?.toString() || '0', icon: 'checkmark-circle-outline', color: '#10b981' },
            { label: 'Zayıf Konu', value: '3', icon: 'alert-circle-outline', color: '#ef4444' }, // TODO: Backend'den al
            { label: 'Bu Hafta', value: statsData.aiInteractions?.toString() || '0', icon: 'calendar-outline', color: '#f59e0b' },
            { label: 'Puan', value: userData.xp?.toString() || '0', icon: 'trophy-outline', color: '#8b5cf6' },
          ];
          setLearningStats(newStats);
          setProfileData(userData);
        }
      }

      // Liderlik tablosu verilerini işle
      console.log('📊 Leaderboard result:', leaderboardResult);
      
      if (leaderboardResult.success && leaderboardResult.data) {
        const leaderboardData = leaderboardResult.data.data || leaderboardResult.data;
        console.log('🔍 Leaderboard data:', leaderboardData);
        console.log('📋 Data type:', typeof leaderboardData);
        console.log('📋 Is array:', Array.isArray(leaderboardData));
        console.log('📋 Length:', leaderboardData?.length);
        
        if (Array.isArray(leaderboardData)) {
          console.log('✅ Liderlik tablosu verileri:', leaderboardData);
          setLeaderboard(leaderboardData);
        } else {
          console.log('❌ Liderlik tablosu verisi array değil:', leaderboardData);
          setLeaderboard([]);
        }
      } else {
        console.log('❌ Liderlik tablosu yüklenemedi:', leaderboardResult);
        setLeaderboard([]);
      }



    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setLearningStats(defaultStats);
      setLeaderboard(defaultLeaderboard);

    } finally {
      setLoading(false);

    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };



  // Component mount olduğunda veri yükle
  useEffect(() => {
    loadData();
  }, []);

  // Screen focus olduğunda veri yenile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Öğrenme Merkezi</Text>
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
        {/* Hızlı Erişim Kartları */}
        <View style={styles.quickCardsSection}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickCardsContainer}>
            {quickCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.quickCard,
                  { backgroundColor: card.gradient[0] },
                  selectedCard === card.id && styles.selectedCard
                ]}
                onPress={() => {
                  setSelectedCard(card.id);
                  card.onPress();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name={card.icon} size={28} color="#fff" />
                  </View>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Öğrenme İstatistikleri */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Öğrenme İstatistikleri</Text>
          <View style={styles.statsContainer}>
            {(loading ? defaultStats : learningStats).map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Puan Liderliği */}
        <View style={styles.leaderboardSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Puan Liderliği</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.loadingText}>Liderlik tablosu yükleniyor...</Text>
            </View>
          ) : leaderboard.length > 0 ? (
            leaderboard.slice(0, 5).map((user, index) => (
              <View key={user.rank || user._id || index} style={styles.leaderboardItem}>
                <View style={styles.rankContainer}>
                  <View style={[styles.rankBadge, { backgroundColor: getRankColor(user.rank || index + 1) }]}>
                    <Text style={styles.rankText}>{user.rank || index + 1}</Text>
                  </View>
                </View>
                
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                                         <Text style={styles.avatarText}>{getInitials(user.name || 'Kullanıcı')}</Text>
                  </View>
                  <View style={styles.userDetails}>
                                         <Text style={styles.userName}>{user.name || 'Kullanıcı'}</Text>
                    <Text style={styles.userSubject}>{user.subject || 'Genel'} • Seviye {user.level || user.xp || 0}</Text>
                  </View>
                </View>
                
                <View style={styles.pointsContainer}>
                  <Text style={styles.pointsText}>{user.points || user.xp || 0}</Text>
                  <Text style={styles.pointsLabel}>puan</Text>
                </View>
              </View>
            ))
          ) : (
      <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>Henüz Liderlik Tablosu Yok</Text>
              <Text style={styles.emptyStateText}>Kullanıcılar etkileşimde bulundukça burada görünecek</Text>
            </View>
          )}
        </View>

        {/* Önerilen Konular */}
        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>📚 Önerilen Konular</Text>
          <Text style={styles.sectionSubtitle}>Zayıf olduğun konuları tekrar et</Text>
          
          {recommendedTopics.map((topic) => (
            <TouchableOpacity key={topic.id} style={styles.topicCard}>
              <View style={[styles.topicIcon, { backgroundColor: topic.color + '20' }]}>
                <Ionicons name={topic.icon} size={24} color={topic.color} />
              </View>
              
              <View style={styles.topicContent}>
                <View style={styles.topicHeader}>
                  <Text style={styles.topicSubject}>{topic.subject}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: topic.color + '20' }]}>
                    <Text style={[styles.difficultyText, { color: topic.color }]}>{topic.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.topicName}>{topic.topic}</Text>
                <View style={styles.topicStats}>
                  <Text style={styles.topicStat}>{topic.questionCount} soru</Text>
                  <Text style={styles.topicStat}>•</Text>
                  <Text style={styles.topicStat}>{topic.successRate} başarı</Text>
                  <Text style={styles.topicStat}>•</Text>
                  <Text style={styles.topicStat}>{topic.lastAttempt}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.topicAction}>
                <Ionicons name="play-circle-outline" size={24} color="#8b5cf6" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Topluluk Soruları */}
        <View style={styles.communitySection}>
          <Text style={styles.sectionTitle}>🤝 Topluluk Soruları</Text>
          <Text style={styles.sectionSubtitle}>AI analizi ile benzer sorular</Text>
          
          {communityQuestions.length > 0 ? (
            communityQuestions.map((question) => (
              <View key={question.id} style={styles.communityCard}>
                <View style={styles.communityHeader}>
                  <Text style={styles.communityUser}>{question.user}</Text>
                  <Text style={styles.communityTime}>{question.time}</Text>
                </View>
                
                <View style={styles.questionContent}>
                  <View style={styles.questionTags}>
                    <View style={styles.subjectTag}>
                      <Text style={styles.subjectText}>{question.subject}</Text>
                    </View>
                    <View style={styles.topicTag}>
                      <Text style={styles.topicText}>{question.topic}</Text>
                    </View>
                    {question.isSimilar && (
                      <View style={styles.similarTag}>
                        <Ionicons name="refresh-outline" size={12} color="#8b5cf6" />
                        <Text style={styles.similarText}>Benzer</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.questionText}>{question.question}</Text>
                  
                  <View style={styles.questionFooter}>
                    <View style={styles.responseCount}>
                      <Ionicons name="chatbubble-outline" size={16} color="#9ca3af" />
                      <Text style={styles.responseText}>{question.responses} yanıt</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.answerButton}>
                      <Text style={styles.answerText}>Yanıtla</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>Henüz Topluluk Sorusu Yok</Text>
              <Text style={styles.emptyStateText}>Kullanıcılar soru sordukça burada görünecek</Text>
            </View>
          )}
        </View>
        

      </ScrollView>

        
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
  headerTitle: {
    fontSize: 24,
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
  quickCardsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  quickCardsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  quickCard: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    transform: [{ scale: 0.95 }],
  },
  cardContent: {
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statsSection: {
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  leaderboardSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rankContainer: {
    marginRight: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userSubject: {
    fontSize: 12,
    color: '#6b7280',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  topicsSection: {
    marginBottom: 30,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  topicContent: {
    flex: 1,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topicSubject: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicStat: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 4,
  },
  topicAction: {
    padding: 8,
  },
  communitySection: {
    marginBottom: 30,
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  communityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  questionContent: {
    flex: 1,
  },
  questionTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  subjectTag: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  subjectText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  topicTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  topicText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  similarTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  similarText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  questionText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 12,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responseText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  answerButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  answerText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 5,
  },
});