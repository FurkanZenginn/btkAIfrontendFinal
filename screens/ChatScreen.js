import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { aiService } from '../services';
import { FONT_STYLES, FONTS, FONT_WEIGHTS, FONT_SIZES } from '../utils/fonts';

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      const createAnimation = (dot, delay) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]);
      };

      Animated.loop(
        Animated.parallel([
          createAnimation(dot1, 0),
          createAnimation(dot2, 200),
          createAnimation(dot3, 400),
        ])
      ).start();
    };

    animateDots();
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.messageContainer, styles.botMessageContainer]}>
      <View style={styles.botAvatar}>
        <Ionicons name="sparkles" size={16} color="#fff" />
      </View>
      <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
        <View style={styles.typingContainer}>
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: dot1,
                transform: [
                  {
                    scale: dot1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: dot2,
                transform: [
                  {
                    scale: dot2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: dot3,
                transform: [
                  {
                    scale: dot3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
        <Text style={styles.typingText}>yazıyor...</Text>
      </View>
    </View>
  );
};

const MessageBubble = ({ message, time, isBot = false, image = null, isHapBilgi = false, isHapBilgiQuestion = false, questionData = null, onHapBilgiConfirm = null, onHapBilgiReject = null }) => {
  console.log('🔍 MessageBubble render:', { message, isHapBilgiQuestion, questionData });
  return (
  <View style={[
    styles.messageContainer,
    isBot ? styles.botMessageContainer : styles.userMessageContainer
  ]}>
    {isBot && (
      <View style={styles.botAvatar}>
        <LinearGradient
          colors={['#8b5cf6', '#a855f7']}
          style={styles.botAvatarGradient}
        >
          <Ionicons name="sparkles" size={16} color="#fff" />
        </LinearGradient>
      </View>
    )}
    
    <View style={[
      styles.messageBubble,
      isBot ? styles.botBubble : styles.userBubble,
      isHapBilgi && styles.hapBilgiBubble
    ]}>
      <Text style={[
        styles.messageText,
        isBot ? styles.botText : styles.userText,
        isHapBilgi && styles.hapBilgiText
      ]}>
        {message}
      </Text>
      {image && (
        <Image source={{ uri: image }} style={styles.messageImage} />
      )}
      
      {/* Hap Bilgi Onay Butonları */}
      {isHapBilgiQuestion && (
        <View style={styles.hapBilgiButtonsContainer}>
          <TouchableOpacity   
            style={[styles.hapBilgiButton, styles.hapBilgiConfirmButton]}
            onPress={() => {
              console.log('📚 Evet, Oluştur butonuna tıklandı');
              onHapBilgiConfirm && onHapBilgiConfirm(questionData);
            }}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.hapBilgiButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.hapBilgiButtonText}>Evet, Oluştur</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.hapBilgiButton, styles.hapBilgiRejectButton]}
            onPress={() => {
              console.log('📚 Hayır butonuna tıklandı');
              onHapBilgiReject && onHapBilgiReject();
            }}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.hapBilgiButtonGradient}
            >
              <Ionicons name="close-circle" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.hapBilgiButtonText}>Hayır</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      <Text style={[
        styles.messageTime,
        isBot ? styles.botTime : styles.userTime
      ]}>
        {time}
      </Text>
    </View>
  </View>
);
};

export default function ChatScreen({ navigation }) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  // responseType state'ini kaldırıyoruz
  const [conversationHistory, setConversationHistory] = useState([]); // AI konuşma geçmişi
  const [messages, setMessages] = useState([
    {
      id: 1,
      message: 'Merhaba! Ben GeminiHoca, yapay zeka asistanınız ✨\n\n💡 Sorunuzu yazın, size yardımcı olayım!\n📸 Görsel ekleyebilir ve sorularınızı daha detaylı sorabilirsiniz.',
      time: '14:30',
      isBot: true,
    }
  ]);
  
  // Yeni modal state'leri
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');
  const [shareImage, setShareImage] = useState(null);
  const [shareType, setShareType] = useState('soru'); // 'soru' veya 'danışma'
  const [shareTags, setShareTags] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Basit tek sohbet sistemi
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('GeminiHoca Sohbeti');
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  
  // Benzersiz ID oluşturma fonksiyonu
  const generateUniqueId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // AsyncStorage'dan sohbeti yükle
  useEffect(() => {
    loadConversation();
  }, []);

  // Debug için mesajları logla
  useEffect(() => {
    console.log('🔄 Messages changed:', messages.length, 'messages');
    console.log('🔄 Conversation title:', conversationTitle);
  }, [messages, conversationTitle]);
  
  const loadConversation = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const savedMessages = await AsyncStorage.getItem('conversation_messages');
      const savedTitle = await AsyncStorage.getItem('conversation_title');
      const savedHistory = await AsyncStorage.getItem('conversation_history');
      
      console.log('📁 Loading conversation from storage');
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        console.log('📁 Loaded messages:', parsedMessages.length, 'messages');
        setMessages(parsedMessages);
      }
      
      if (savedTitle) {
        setConversationTitle(savedTitle);
      }
      
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setConversationHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Sohbet yükleme hatası:', error);
    }
  };
  
  const saveConversation = async (messages, history) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('conversation_messages', JSON.stringify(messages));
      await AsyncStorage.setItem('conversation_history', JSON.stringify(history));
      await AsyncStorage.setItem('conversation_title', conversationTitle);
      console.log('💾 Conversation saved to storage');
    } catch (error) {
      console.error('Sohbet kaydetme hatası:', error);
    }
  };
  
  // Yeni sohbet oluştur (sıfırla)
  const createNewConversation = () => {
    console.log('🆕 Creating new conversation');
    
    // Önce state'leri temizle
    setIsTyping(false);
    setSelectedImage(null);
    setInputText('');
    
    // Yeni sohbet başlat
    const welcomeMessage = {
      id: generateUniqueId(),
      message: 'Merhaba! Ben GeminiHoca, yapay zeka asistanınız ✨\n\n💡 Sorunuzu yazın, size yardımcı olayım!\n📸 Görsel ekleyebilir ve sorularınızı daha detaylı sorabilirsiniz.',
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isBot: true,
    };
    
    console.log('🆕 New conversation created with welcome message');
    
    setMessages([welcomeMessage]);
    setConversationHistory([]);
    setConversationTitle('GeminiHoca Sohbeti');
    saveConversation([welcomeMessage], []);
    
    console.log('🆕 Conversation saved to storage');
  };
  
  // Sohbet başlığını güncelle
  const updateConversationTitle = (newTitle) => {
    console.log('✏️ Updating conversation title:', newTitle);
    setConversationTitle(newTitle);
    saveConversation(messages, conversationHistory);
  };
  
  // Mevcut sohbeti güncelle
  const updateCurrentConversation = (newMessages, newHistory) => {
    console.log('💾 Updating conversation with', newMessages.length, 'messages');
    setMessages(newMessages);
    setConversationHistory(newHistory);
    saveConversation(newMessages, newHistory);
    console.log('💾 Conversation updated successfully');
  };

  // Sohbeti sıfırla
  const resetConversation = () => {
    Alert.alert(
      '🔄 Sohbeti Sıfırla',
      'Tüm sohbet geçmişi silinecek. Devam etmek istiyor musunuz?',
      [
        { text: '❌ İptal', style: 'cancel' },
        {
          text: '✅ Sıfırla',
          style: 'destructive',
          onPress: () => {
            createNewConversation();
            setShowConversationHistory(false);
            Alert.alert('✅ Başarılı', 'Sohbet sıfırlandı!');
          }
        }
      ]
    );
  };

  
  const scrollViewRef = useRef(null);

  // Otomatik kaydırma fonksiyonu
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated });
      }
    }, 100);
  };

  // Mesajlar değiştiğinde otomatik kaydır
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Typing durumu değiştiğinde otomatik kaydır
  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping]);

  const sendMessage = async () => {
    if (inputText.trim()) {
      const userMessage = inputText;
      
      const newMessage = {
        id: generateUniqueId(),
        message: userMessage,
        time: new Date().toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isBot: false,
        image: selectedImage?.uri, // Görsel varsa ekle
      };
      
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setInputText('');
      
      // Konuşma geçmişini güncelle
      const newHistory = [...conversationHistory, { role: 'user', content: userMessage }];
      setConversationHistory(newHistory);
      
      // Mevcut sohbeti güncelle
      updateCurrentConversation(updatedMessages, newHistory);
      
      // Mesaj gönderildiğinde hemen en alta kaydır
      scrollToBottom();
      
      // Show typing indicator with loading message
      setIsTyping(true);
      
      // Loading mesajı ekle
      const loadingMessage = {
        id: generateUniqueId(),
        message: 'AI düşünüyor... 🤔',
        time: new Date().toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isBot: true,
        isLoading: true,
      };
      setMessages(prev => [...prev, loadingMessage]);
      scrollToBottom();
      
      try {
        console.log('🤖 AI\'ya soru gönderiliyor:', userMessage);
        console.log('🤖 Image:', selectedImage?.uri);
        console.log('🤖 Conversation History:', conversationHistory);
        
        // Hızlı AI service ile soru gönder (görsel ile birlikte)
        // Normal AI yanıtı için conversation history kullan
        const response = await aiService.askFast(userMessage, selectedImage?.uri, conversationHistory, false);
        console.log('🤖 AI Response:', response);
        console.log('🤖 Response success:', response.success);
        console.log('🤖 Response data:', response.data);
        console.log('🤖 Response error:', response.error);
        
        // Loading mesajını kaldır ve mevcut mesajları al
        setMessages(prev => {
          const messagesWithoutLoading = prev.filter(msg => !msg.isLoading);
          console.log('📝 Messages after removing loading:', messagesWithoutLoading);
          return messagesWithoutLoading;
        });
        
        // Backend'den gelen response formatını kontrol et
        console.log('🤖 Full response structure:', response);
        
        // Backend'den gelen farklı response formatlarını kontrol et
        let aiResponse = null;
        
        if (response.data && typeof response.data === 'string') {
          // Backend'den string olarak geliyorsa
          aiResponse = response.data;
        } else if (response.aiResponse) {
          // aiResponse field'ı varsa
          aiResponse = response.aiResponse;
        } else if (response.data?.aiResponse) {
          // data.aiResponse field'ı varsa
          aiResponse = response.data.aiResponse;
        } else if (response.message) {
          // message field'ı varsa
          aiResponse = response.message;
        } else if (response.data?.message) {
          // data.message field'ı varsa
          aiResponse = response.data.message;
        }
        
        console.log('🤖 Extracted AI Response:', aiResponse);
        
        if (aiResponse) {
          
          // AI yanıtını konuşma geçmişine ekle
          const newHistory = [...conversationHistory, { role: 'assistant', content: aiResponse }];
          setConversationHistory(newHistory);
          
          const botResponse = {
            id: generateUniqueId(),
            message: aiResponse,
            time: new Date().toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isBot: true,
          };
          
          setIsTyping(false);
          
          // Mevcut mesajları al ve AI yanıtını ekle
          setMessages(prev => {
            const messagesWithoutLoading = prev.filter(msg => !msg.isLoading);
            const messagesWithBotResponse = [...messagesWithoutLoading, botResponse];
            console.log('📝 Messages with bot response:', messagesWithBotResponse);
            return messagesWithBotResponse;
          });
          
          // Hap Bilgi oluşturma onayı sor
          console.log('📚 Hap Bilgi sorusu ekleniyor...');
          const hapBilgiQuestion = {
            id: generateUniqueId(),
            message: '📚 Bu soru ve yanıtından Hap Bilgi oluşturmak ister misin?',
            time: new Date().toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isBot: true,
            isHapBilgiQuestion: true,
            questionData: { question: userMessage, aiResponse: aiResponse }
          };
          console.log('📚 Hap Bilgi sorusu objesi:', hapBilgiQuestion);
          
          // Hap Bilgi mesajını ekle
          setMessages(prev => {
            const finalMessages = [...prev, hapBilgiQuestion];
            console.log('📝 Final messages with Hap Bilgi:', finalMessages);
            
            // Mevcut sohbeti güncelle
            updateCurrentConversation(finalMessages, newHistory);
            
            return finalMessages;
          });
          
          scrollToBottom();
        } else {
          // AI hatası durumunda fallback response
          console.log('🤖 AI Response parsing failed. Response:', response);
          const fallbackResponse = {
            id: generateUniqueId(),
            message: `Üzgünüm, AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin. Hata: ${response.error || 'Yanıt formatı hatası'}`,
            time: new Date().toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isBot: true,
          };
          
          setIsTyping(false);
          setMessages(prev => {
            const messagesWithoutLoading = prev.filter(msg => !msg.isLoading);
            const errorMessages = [...messagesWithoutLoading, fallbackResponse];
            console.log('📝 Error messages:', errorMessages);
            
            // Mevcut oturumu güncelle
            updateCurrentSession(errorMessages, conversationHistory);
            
            return errorMessages;
          });
          scrollToBottom();
        }
      } catch (error) {
        console.error('🤖 AI Error:', error);
        
        // Loading mesajını kaldır
        setMessages(prev => prev.filter(msg => !msg.isLoading));
        
        // Hata durumunda fallback response
        const errorResponse = {
          id: generateUniqueId(),
          message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
          time: new Date().toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true,
        };
        
        setIsTyping(false);
        setMessages(prev => {
          const messagesWithoutLoading = prev.filter(msg => !msg.isLoading);
          const errorMessages = [...messagesWithoutLoading, errorResponse];
          console.log('📝 Catch error messages:', errorMessages);
          
          // Mevcut sohbeti güncelle
          updateCurrentConversation(errorMessages, conversationHistory);
          
          return errorMessages;
        });
        scrollToBottom();
      }
      
      // Görseli temizle
      setSelectedImage(null);
    }
  };

  // Görsel seçme fonksiyonu
  const pickImage = async () => {
    try {
      // İzinleri kontrol et
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeri erişim izni gerekiyor.');
        return;
      }

      // Görsel seç
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        console.log('📸 Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Görsel seçilirken bir hata oluştu.');
    }
  };

  // Görsel kaldırma fonksiyonu
  const removeImage = () => {
    setSelectedImage(null);
  };



  // AI soru paylaşma fonksiyonu
  const handleShareQuestion = () => {
    // Modal'ı aç ve mevcut metni kopyala
    setShareText(inputText);
    setShareImage(selectedImage);
    setShowShareModal(true);
  };

  const handleShareModalSubmit = async () => {
    if (!shareText.trim()) {
      Alert.alert('Hata', 'Paylaşmak için bir metin yazmanız gerekiyor.');
      return;
    }

    setShareLoading(true);
    
    try {
      console.log('📝 Sharing post:', shareText);
      console.log('📝 Share type:', shareType);
      console.log('📝 Share image:', shareImage?.uri);
      console.log('📝 Share tags:', shareTags);
      
      // Eğer etiket yoksa otomatik oluştur
      if (shareTags.length === 0) {
        console.log('🤖 Etiket yok, otomatik oluşturuluyor...');
        await generateAutoTags();
      }
      
      // Post oluştur (etiketlerle birlikte)
      const result = await aiService.shareQuestion(shareText, shareImage?.uri, shareType, shareTags);
      
      console.log('📝 Share result:', result);
      
      if (result.success) {
        // Modal'ı kapat ve formları temizle
        setShowShareModal(false);
        setShareText('');
        setShareImage(null);
        setShareType('soru');
        setShareTags([]);
        setShowTagInput(false);
        setTagInput('');
        
        // Ana formu da temizle
        setInputText('');
        setSelectedImage(null);
        
        // Başarı mesajı ekle
        const successMessage = {
          id: messages.length + 1,
          message: `✅ ${shareType === 'soru' ? 'Soru' : 'Danışma'} başarıyla paylaşıldı! Ana sayfada görünecek.`,
          time: new Date().toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true,
        };
        setMessages(prev => [...prev, successMessage]);
        scrollToBottom();
        
        // Başarı alert'i göster
        Alert.alert(
          'Başarılı! 🎉',
          result.message || 'Paylaşım başarıyla yapıldı! Ana sayfada görünecek.',
          [{ text: 'Tamam' }]
        );
      } else {
        Alert.alert(
          'Paylaşım Hatası ❌',
          result.error || 'Paylaşım sırasında bir hata oluştu.',
          [{ text: 'Tekrar Dene' }]
        );
      }
    } catch (error) {
      console.error('Share modal error:', error);
      Alert.alert(
        'Bağlantı Hatası',
        'Paylaşım sırasında bağlantı hatası oluştu.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setShareLoading(false);
    }
  };

  const pickShareImage = async () => {
    try {
      // İzinleri kontrol et
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeri erişim izni gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Share image selected:', result.assets[0]);
        setShareImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Görsel seçilirken bir hata oluştu.');
    }
  };

  const removeShareImage = () => {
    setShareImage(null);
  };

  // Etiket ekleme fonksiyonları
  const addTag = () => {
    if (tagInput.trim() && !tagInput.startsWith('#')) {
      const newTag = `#${tagInput.trim()}`;
      if (!shareTags.includes(newTag)) {
        setShareTags([...shareTags, newTag]);
        setTagInput('');
      }
    } else if (tagInput.trim() && tagInput.startsWith('#')) {
      const newTag = tagInput.trim();
      if (!shareTags.includes(newTag)) {
        setShareTags([...shareTags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setShareTags(shareTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputSubmit = () => {
    addTag();
    setShowTagInput(false);
  };

  // AI etiket önerisi
  const getAITagSuggestions = async () => {
    if (!shareText.trim()) {
      Alert.alert('Uyarı', 'Önce paylaşım metnini yazın.');
      return;
    }

    try {
      // Loading state'i başlat
      setShareLoading(true);
      
      const aiService = require('../services/aiService').default;
      const prompt = `Bu paylaşım için uygun etiketler öner:

"${shareText}"

ÖNEMLİ TALİMATLAR:
1. Sadece hashtag formatında etiketler ver (#Matematik #Fizik gibi)
2. Maksimum 4-5 etiket öner
3. Ana ders ve konu etiketleri ekle
4. Sadece etiketleri listele, açıklama yapma

Bu içerik için uygun etiketler:`;
      
      const response = await aiService.askFast(prompt, null, [], true);
      
      if (response.success && response.data) {
        const suggestedTags = response.data
          .split(/\s+/)
          .filter(tag => tag.startsWith('#'))
          .map(tag => tag.trim())
          .slice(0, 5); // Maksimum 5 etiket
        
        setShareTags([...new Set([...shareTags, ...suggestedTags])]);
        Alert.alert('✅ Etiketler Eklendi', `${suggestedTags.length} etiket önerildi!`);
      }
    } catch (error) {
      console.error('AI etiket önerisi hatası:', error);
      Alert.alert('Hata', 'AI etiket önerisi alınamadı.');
    } finally {
      // Loading state'i bitir
      setShareLoading(false);
    }
  };

  // Otomatik AI etiket oluşturma (paylaş butonuna basıldığında)
  const generateAutoTags = async () => {
    if (!shareText.trim()) {
      return;
    }

    try {
      console.log('🤖 Otomatik etiket oluşturuluyor...');
      
      const aiService = require('../services/aiService').default;
      const prompt = `Bu ${shareType === 'soru' ? 'soru' : 'danışma'} paylaşımı için uygun etiketler öner:

"${shareText}"

ÖNEMLİ TALİMATLAR:
1. Sadece hashtag formatında etiketler ver (#Matematik #Fizik gibi)
2. Ana ders tespit et (Matematik, Fizik, Kimya, Biyoloji, vb.)
3. Spesifik konu etiketleri ekle
4. Zorluk seviyesi belirt (Kolay, Orta, Zor)
5. Sınav türü ekle (YKS, LGS, AYT, TYT)
6. Maksimum 6 etiket öner
7. Sadece etiketleri listele, açıklama yapma

Bu içerik için uygun etiketler:`;
      
      const response = await aiService.askFast(prompt, null, [], true);
      
      if (response.success && response.data) {
        const suggestedTags = response.data
          .split(/\s+/)
          .filter(tag => tag.startsWith('#'))
          .map(tag => tag.trim())
          .slice(0, 6); // Maksimum 6 etiket
        
        console.log('🤖 Oluşturulan etiketler:', suggestedTags);
        setShareTags(suggestedTags);
      }
    } catch (error) {
      console.error('🤖 Otomatik etiket oluşturma hatası:', error);
    }
  };

  // Etiketleri yenile
  const refreshTags = async () => {
    if (!shareText.trim()) {
      Alert.alert('Uyarı', 'Önce paylaşım metnini yazın.');
      return;
    }
    
    await generateAutoTags();
  };

  // Hap Bilgi oluşturma onayı
  const handleHapBilgiConfirm = async (questionData) => {
    try {
      console.log('📚 Hap Bilgi oluşturma onaylandı');
      console.log('📚 Question:', questionData.question);
      console.log('📚 AI Response:', questionData.aiResponse);
      
      // Loading mesajı ekle
      const loadingMessage = {
        id: generateUniqueId(),
        message: '📚 Hap Bilgi oluşturuluyor...',
        time: new Date().toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isBot: true,
        isLoading: true,
      };
      setMessages(prev => [...prev, loadingMessage]);
      scrollToBottom();
      
      // Hap Bilgi etiketleme için AI'ya ayrı çağrı yap (conversation history olmadan)
      console.log('📚 Hap Bilgi etiketleme için AI çağrısı yapılıyor...');
      console.log('📚 Question:', questionData.question);
      console.log('📚 AI Response:', questionData.aiResponse);
      
      // AI'dan etiket önerisi al (conversation history olmadan)
      const aiService = require('../services/aiService').default;
      const etiketPrompt = `Bu soru ve yanıtından Hap Bilgi oluşturmak istiyorum. Lütfen bu içerik için uygun etiketler öner.

ÖNEMLİ TALİMATLAR:
1. Sadece bu soru ve yanıtına odaklan, önceki konuşmaları dikkate alma
2. Ana ders tespit et (Matematik, Fizik, Kimya, Biyoloji, vb.)
3. Spesifik konu etiketleri ekle
4. Zorluk seviyesi belirt
5. Sadece hashtag formatında etiketler ver (#Matematik #Kalkülüs #Zor gibi)
6. Maksimum 4 etiket ver

Soru: ${questionData.question}
AI Yanıtı: ${questionData.aiResponse}

Bu içerik için uygun etiketler:`;
      
      const etiketResponse = await aiService.askFast(etiketPrompt, null, [], true); // isHapBilgiRequest = true
      console.log('📚 AI Etiket yanıtı:', etiketResponse);
      
      // Hap Bilgi oluşturma servisi çağır
      const hapBilgiService = require('../services/hapBilgiService').default;
      
      // AI'dan gelen etiketleri kullan
      let aiGeneratedTags = [];
      console.log('🔍 Etiket Response Debug:', etiketResponse);
      
      if (etiketResponse.success && etiketResponse.data) {
        const etiketText = etiketResponse.data;
        console.log('📝 Ham etiket metni:', etiketText);
        
        // Etiketleri parse et (hashtag formatında)
        aiGeneratedTags = etiketText
          .split(/\s+/)
          .filter(tag => tag.startsWith('#'))
          .map(tag => tag.trim());
        console.log('🏷️ AI Generated Tags (parsed):', aiGeneratedTags);
      } else {
        console.log('❌ AI etiket yanıtı başarısız veya boş:', etiketResponse);
      }
      
      console.log('🎯 Final AI Generated Tags:', aiGeneratedTags);
      
      const hapBilgiResult = await hapBilgiService.createHapBilgiFromQuestion(questionData.question, questionData.aiResponse, aiGeneratedTags);
      
      // Loading mesajını kaldır
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      console.log('📚 Hap Bilgi oluşturma sonucu:', hapBilgiResult);
      
      if (hapBilgiResult.success) {
        console.log('✅ Hap Bilgi başarıyla oluşturuldu!');
        console.log('🏷️ Generated tags:', hapBilgiResult.data.tags);
        
        // Etiketleri formatla
        const tagsText = hapBilgiResult.data.tags ? 
          `\n\n🏷️ AI Etiketleri:\n${hapBilgiResult.data.tags.join(' ')}` : '';
        
        // Başarı mesajı
        const successMessage = {
          id: generateUniqueId(),
          message: `✅ Hap Bilgi oluşturuldu! Bellekte kaydedildi ve Mesajlar sayfasından görüntüleyebilirsin.${tagsText}`,
          time: new Date().toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true,
          isHapBilgiSuccess: true,
        };
        setMessages(prev => [...prev, successMessage]);
        scrollToBottom();
      } else {
        console.log('❌ Hap Bilgi oluşturulamadı:', hapBilgiResult.error);
        
        // Hata mesajı
        const errorMessage = {
          id: generateUniqueId(),
          message: '❌ Hap Bilgi oluşturulamadı. Lütfen daha sonra tekrar deneyin.',
          time: new Date().toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true,
          isHapBilgiError: true,
        };
        setMessages(prev => [...prev, errorMessage]);
        scrollToBottom();
      }
    } catch (error) {
      console.error('📚 Hap Bilgi oluşturma hatası:', error);
      
      // Loading mesajını kaldır
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      // Hata mesajı
      const errorMessage = {
        id: generateUniqueId(),
        message: '❌ Hap Bilgi oluşturulurken bir hata oluştu.',
        time: new Date().toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isBot: true,
        isHapBilgiError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      scrollToBottom();
    }
  };

  const handleHapBilgiReject = () => {
    console.log('📚 Hap Bilgi oluşturma reddedildi');
    
    const rejectMessage = {
      id: generateUniqueId(),
      message: 'Tamam, Hap Bilgi oluşturulmayacak.',
      time: new Date().toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isBot: true,
    };
    setMessages(prev => [...prev, rejectMessage]);
    scrollToBottom();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#a855f7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerName}>GeminiHoca</Text>
              <View style={styles.statusContainer}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerButtons}>
                    <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowConversationHistory(true)}
        >
          <Ionicons name="folder-open" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={resetConversation}
        >
          <Ionicons name="refresh-circle" size={28} color="#fff" />
        </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollToBottom()}
          onLayout={() => scrollToBottom(false)}
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.message}
              time={message.time}
              isBot={message.isBot}
              image={message.image}
              isHapBilgi={message.isHapBilgi}
              isHapBilgiQuestion={message.isHapBilgiQuestion}
              questionData={message.questionData}
              onHapBilgiConfirm={handleHapBilgiConfirm}
              onHapBilgiReject={handleHapBilgiReject}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {/* Basit Soru-Cevap Sistemi */}
        <View style={styles.simplePromptContainer}>
          <Text style={styles.simplePromptText}>
            💡 Sorunuzu yazın, AI size yardımcı olsun!
          </Text>
        </View>

        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
            <Ionicons name="camera" size={24} color={selectedImage ? "#8b5cf6" : "#9ca3af"} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          <TouchableOpacity style={styles.voiceButton}>
            <Ionicons name="mic" size={24} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={sendMessage}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Soru Paylaş Butonu */}
        <View style={styles.shareQuestionContainer}>
          <TouchableOpacity 
                  style={[styles.shareQuestionButton, isLoading && styles.shareQuestionButtonDisabled]}
      onPress={handleShareQuestion}
      disabled={isLoading}
          >
            <Ionicons name="share-social" size={20} color="#8b5cf6" />
      <Text style={styles.shareQuestionText}>
        {isLoading ? 'Paylaşılıyor...' : 'Soru Paylaş'}
      </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Sohbet Yönetimi Modal */}
      {showConversationHistory && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📁 Sohbet Yönetimi</Text>
              <TouchableOpacity 
                onPress={() => setShowConversationHistory(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Sohbet Bilgileri */}
              <View style={styles.conversationInfo}>
                <Text style={styles.conversationTitle}>{conversationTitle}</Text>
                <Text style={styles.conversationStats}>
                  {messages.length} mesaj • {conversationHistory.length} AI yanıtı
                </Text>
              </View>

              {/* İşlem Butonları */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setEditingTitle(conversationTitle);
                    setShowEditTitleModal(true);
                    setShowConversationHistory(false);
                  }}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#1d4ed8']}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Başlığı Düzenle</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    resetConversation();
                    setShowConversationHistory(false);
                  }}
                >
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Sohbeti Sıfırla</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Başlık Düzenleme Modal */}
      {showEditTitleModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Başlığı Düzenle</Text>
              <TouchableOpacity 
                onPress={() => setShowEditTitleModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Yeni başlık..."
                placeholderTextColor="#9ca3af"
                value={editingTitle}
                onChangeText={setEditingTitle}
                autoFocus
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowEditTitleModal(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalSubmitButton,
                  !editingTitle.trim() && styles.modalSubmitButtonDisabled
                ]}
                onPress={() => {
                  if (editingTitle.trim()) {
                    updateConversationTitle(editingTitle.trim());
                    setShowEditTitleModal(false);
                  }
                }}
                disabled={!editingTitle.trim()}
              >
                <Text style={styles.modalSubmitText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Paylaşım Modal */}
      {showShareModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paylaşım Yap</Text>
              <TouchableOpacity 
                onPress={() => setShowShareModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Görsel Seçimi */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Görsel (Opsiyonel)</Text>
                {shareImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: shareImage.uri }} style={styles.selectedImage} />
                    <TouchableOpacity 
                      onPress={removeShareImage}
                      style={styles.removeImageButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#e31b23" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={pickShareImage}
                    style={styles.addImageButton}
                  >
                    <Ionicons name="camera" size={24} color="#8b5cf6" />
                    <Text style={styles.addImageText}>Görsel Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Metin */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Metin</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Paylaşmak istediğiniz metni yazın..."
                  placeholderTextColor="#9ca3af"
                  value={shareText}
                  onChangeText={setShareText}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Etiketler */}
              <View style={styles.modalSection}>
                <View style={styles.tagHeader}>
                  <Text style={styles.modalSectionTitle}>🏷️ Etiketler</Text>
                  <View style={styles.tagButtons}>
                    <TouchableOpacity
                      style={styles.refreshTagButton}
                      onPress={refreshTags}
                    >
                      <Ionicons name="refresh" size={16} color="#8b5cf6" />
                      <Text style={styles.refreshTagButtonText}>Yenile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.aiTagButton}
                      onPress={getAITagSuggestions}
                      disabled={shareLoading}
                    >
                      {shareLoading ? (
                        <ActivityIndicator size="small" color="#8b5cf6" />
                      ) : (
                        <Ionicons name="sparkles" size={16} color="#8b5cf6" />
                      )}
                      <Text style={styles.aiTagButtonText}>
                        {shareLoading ? 'Öneriliyor...' : 'AI Önerisi'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Mevcut Etiketler */}
                {shareTags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {shareTags.map((tag, index) => (
                      <View key={index} style={styles.tagItem}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <TouchableOpacity
                          onPress={() => removeTag(tag)}
                          style={styles.removeTagButton}
                        >
                          <Ionicons name="close" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Etiket Ekleme */}
                {showTagInput ? (
                  <View style={styles.tagInputContainer}>
                    <TextInput
                      style={styles.tagInput}
                      placeholder="#Matematik"
                      value={tagInput}
                      onChangeText={setTagInput}
                      onSubmitEditing={handleTagInputSubmit}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={styles.addTagButton}
                      onPress={handleTagInputSubmit}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelTagButton}
                      onPress={() => {
                        setShowTagInput(false);
                        setTagInput('');
                      }}
                    >
                      <Ionicons name="close" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={() => setShowTagInput(true)}
                  >
                    <Ionicons name="add" size={16} color="#6b7280" />
                    <Text style={styles.addTagText}>Etiket Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Paylaşım Türü */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Paylaşım Türü</Text>
                <View style={styles.shareTypeContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.shareTypeButton,
                      shareType === 'soru' && styles.shareTypeButtonActive
                    ]}
                                          onPress={() => setShareType('soru')}
                  >
                    <Ionicons 
                      name="help-circle" 
                      size={20} 
                                              color={shareType === 'soru' ? '#fff' : '#8b5cf6'} 
                    />
                    <Text style={[
                      styles.shareTypeText,
                                              shareType === 'soru' && styles.shareTypeTextActive
                    ]}>
                      Soru
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.shareTypeButton,
                      shareType === 'danışma' && styles.shareTypeButtonActive
                    ]}
                                          onPress={() => setShareType('danışma')}
                  >
                    <Ionicons 
                      name="people" 
                      size={20} 
                      color={shareType === 'consultation' ? '#fff' : '#8b5cf6'} 
                    />
                    <Text style={[
                      styles.shareTypeText,
                                              shareType === 'danışma' && styles.shareTypeTextActive
                    ]}>
                      Danışma
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowShareModal(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalSubmitButton,
                  (!shareText.trim() || shareLoading) && styles.modalSubmitButtonDisabled
                ]}
                onPress={handleShareModalSubmit}
                disabled={!shareText.trim() || shareLoading}
              >
                {shareLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Paylaş</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 35 : 10,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    ...FONT_STYLES.h3,
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    ...FONT_STYLES.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  menuButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  botAvatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },
  botBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  hapBilgiBubble: {
    backgroundColor: '#e0f2fe', // Hap bilgi mesajları için farklı bir arka plan
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  messageText: {
    ...FONT_STYLES.body,
    lineHeight: 22,
  },
  botText: {
    color: '#000',
  },
  userText: {
    color: '#fff',
  },
  hapBilgiText: {
    color: '#007bff', // Hap bilgi mesajları için farklı bir metin rengi
  },
  messageTime: {
    ...FONT_STYLES.caption,
    marginTop: 4,
  },
  botTime: {
    color: '#9ca3af',
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  attachButton: {
    marginRight: 10,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    ...FONT_STYLES.body,
    color: '#000',
  },
  voiceButton: {
    marginLeft: 10,
    marginBottom: 8,
  },
  sendButton: {
    backgroundColor: '#8b5cf6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
    marginHorizontal: 2,
  },

  typingText: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  shareQuestionContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  shareQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  shareQuestionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
  },

  simplePromptContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f0f9ff',
    borderTopWidth: 1,
    borderTopColor: '#e0f2fe',
  },
  simplePromptText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0369a1',
    textAlign: 'center',
  },
  // Image Styles
  imagePreviewContainer: {
    position: 'relative',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  messageImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  addImageText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  modalTextInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  shareTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  shareTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  shareTypeButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  shareTypeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  shareTypeTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  modalSubmitText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiTagButtonText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  removeTagButton: {
    padding: 2,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addTagText: {
    fontSize: 14,
    color: '#6b7280',
  },
  cancelTagButton: {
    padding: 8,
  },
  headerTitle: {
    ...FONT_STYLES.h3,
    color: '#fff',
  },
  headerSubtitle: {
    ...FONT_STYLES.caption,
    color: '#e0e7ff',
  },
  // Hap Bilgi Buton Stilleri
  hapBilgiButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  hapBilgiButton: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  hapBilgiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  hapBilgiConfirmButton: {
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#059669',
  },
  hapBilgiRejectButton: {
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  hapBilgiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  buttonIcon: {
    marginRight: 4,
  },
  // Sohbet Geçmişi Stilleri
  newChatButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  newChatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  sessionsList: {
    gap: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sessionItemActive: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f3f4f6',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  sessionMessages: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sessionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  conversationInfo: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 20,
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  conversationStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptySessionsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySessionsSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  tagButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  refreshTagButtonText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
});