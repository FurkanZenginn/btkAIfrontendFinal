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
        <Ionicons name="sparkles" size={16} color="#fff" />
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
          <Text style={styles.debugText}>DEBUG: Hap Bilgi butonları render ediliyor</Text>
          <TouchableOpacity 
            style={[styles.hapBilgiButton, styles.hapBilgiConfirmButton]}
            onPress={() => {
              console.log('📚 Evet, Oluştur butonuna tıklandı');
              onHapBilgiConfirm && onHapBilgiConfirm(questionData);
            }}
          >
            <Text style={styles.hapBilgiButtonText}>✅ Evet, Oluştur</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.hapBilgiButton, styles.hapBilgiRejectButton]}
            onPress={() => {
              console.log('📚 Hayır butonuna tıklandı');
              onHapBilgiReject && onHapBilgiReject();
            }}
          >
            <Text style={styles.hapBilgiButtonText}>❌ Hayır</Text>
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
  const [responseType, setResponseType] = useState('step-by-step'); // 'step-by-step' veya 'direct-solution'
  const [messages, setMessages] = useState([
    {
      id: 1,
      message: 'Merhaba! Ben GeminiHoca, yapay zeka asistanınız ✨ Size nasıl yardımcı olabilirim?\n\n🚀 2x daha hızlı yanıtlar için yanıt türünü seçin:\n• 📝 Adım adım açıklama\n• ⚡ Direkt çözüm\n\n📸 Görsel ekleyebilir ve sorularınızı daha detaylı sorabilirsiniz!',
      time: '14:30',
      isBot: true,
    }
  ]);
  
  // Yeni modal state'leri
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');
  const [shareImage, setShareImage] = useState(null);
  const [shareType, setShareType] = useState('soru'); // 'soru' veya 'danışma'
  const [shareLoading, setShareLoading] = useState(false);
  

  

  
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
        id: messages.length + 1,
        message: userMessage,
        time: new Date().toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isBot: false,
        image: selectedImage?.uri, // Görsel varsa ekle
      };
      
      setMessages([...messages, newMessage]);
      setInputText('');
      
      // Mesaj gönderildiğinde hemen en alta kaydır
      scrollToBottom();
      
      // Show typing indicator with loading message
      setIsTyping(true);
      
      // Loading mesajı ekle
      const loadingMessage = {
        id: messages.length + 2,
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
        console.log('🤖 Response Type:', responseType);
        console.log('🤖 Image:', selectedImage?.uri);
        
        // Hızlı AI service ile soru gönder (görsel ile birlikte)
        const response = await aiService.askFast(userMessage, responseType, selectedImage?.uri);
        console.log('🤖 AI Response:', response);
        console.log('🤖 Response success:', response.success);
        console.log('🤖 Response data:', response.data);
        console.log('🤖 Response error:', response.error);
        
        // Loading mesajını kaldır
        setMessages(prev => prev.filter(msg => !msg.isLoading));
        
        // Backend'den gelen response formatını kontrol et
        console.log('🤖 Full response structure:', response);
        
        if (response.aiResponse || response.data?.aiResponse) {
          console.log('🤖 Response data keys:', Object.keys(response));
          console.log('🤖 Response data aiResponse:', response.aiResponse);
          
          const aiResponse = response.aiResponse || response.data?.aiResponse || 'Üzgünüm, şu anda yanıt veremiyorum.';
          
          const botResponse = {
            id: messages.length + 2,
            message: aiResponse,
            time: new Date().toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isBot: true,
          };
          
          setIsTyping(false);
          setMessages(prev => [...prev, botResponse]);
          scrollToBottom();
          
          // Hap Bilgi oluşturma onayı sor
          console.log('📚 Hap Bilgi sorusu ekleniyor...');
          const hapBilgiQuestion = {
            id: messages.length + 3,
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
          setMessages(prev => {
            const newMessages = [...prev, hapBilgiQuestion];
            console.log('📚 Yeni messages array:', newMessages);
            return newMessages;
          });
          scrollToBottom();
        } else {
          // AI hatası durumunda fallback response
          const fallbackResponse = {
            id: messages.length + 2,
            message: `Üzgünüm, AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin. Hata: ${response.error || 'Bağlantı sorunu'}`,
            time: new Date().toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isBot: true,
          };
          
          setIsTyping(false);
          setMessages(prev => [...prev, fallbackResponse]);
          scrollToBottom();
        }
      } catch (error) {
        console.error('🤖 AI Error:', error);
        
        // Loading mesajını kaldır
        setMessages(prev => prev.filter(msg => !msg.isLoading));
        
        // Hata durumunda fallback response
        const errorResponse = {
          id: messages.length + 2,
          message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
          time: new Date().toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true,
        };
        
        setIsTyping(false);
        setMessages(prev => [...prev, errorResponse]);
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
      
      // Post oluştur
      const result = await aiService.shareQuestion(shareText, shareImage?.uri, shareType);
      
      console.log('📝 Share result:', result);
      
      if (result.success) {
        // Modal'ı kapat ve formları temizle
        setShowShareModal(false);
        setShareText('');
        setShareImage(null);
        setShareType('soru');
        
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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
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

  // Hap Bilgi oluşturma onayı
  const handleHapBilgiConfirm = async (questionData) => {
    try {
      console.log('📚 Hap Bilgi oluşturma onaylandı');
      console.log('📚 Question:', questionData.question);
      console.log('📚 AI Response:', questionData.aiResponse);
      
      // Loading mesajı ekle
      const loadingMessage = {
        id: messages.length + 1,
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
      
      // Hap Bilgi oluşturma servisi çağır
      const hapBilgiService = require('../services/hapBilgiService').default;
      const hapBilgiResult = await hapBilgiService.createHapBilgiFromQuestion(questionData.question, questionData.aiResponse);
      
      // Loading mesajını kaldır
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      console.log('📚 Hap Bilgi oluşturma sonucu:', hapBilgiResult);
      
      if (hapBilgiResult.success) {
        console.log('✅ Hap Bilgi başarıyla oluşturuldu!');
        
        // Başarı mesajı
        const successMessage = {
          id: messages.length + 1,
          message: '✅ Hap Bilgi oluşturuldu! Bellekte kaydedildi ve Mesajlar sayfasından görüntüleyebilirsin.',
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
          id: messages.length + 1,
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
        id: messages.length + 1,
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
      id: messages.length + 1,
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

          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
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

        {/* Response Type Selector */}
        <View style={styles.responseTypeContainer}>
          <Text style={styles.responseTypeLabel}>Yanıt Türü:</Text>
          <View style={styles.responseTypeButtons}>
            <TouchableOpacity 
              style={[
                styles.responseTypeButton,
                responseType === 'step-by-step' && styles.responseTypeButtonActive
              ]}
              onPress={() => setResponseType('step-by-step')}
            >
              <Ionicons 
                name="list" 
                size={16} 
                color={responseType === 'step-by-step' ? '#fff' : '#8b5cf6'} 
              />
              <Text style={[
                styles.responseTypeButtonText,
                responseType === 'step-by-step' && styles.responseTypeButtonTextActive
              ]}>
                Adım Adım
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.responseTypeButton,
                responseType === 'direct-solution' && styles.responseTypeButtonActive
              ]}
              onPress={() => setResponseType('direct-solution')}
            >
              <Ionicons 
                name="flash" 
                size={16} 
                color={responseType === 'direct-solution' ? '#fff' : '#8b5cf6'} 
              />
              <Text style={[
                styles.responseTypeButtonText,
                responseType === 'direct-solution' && styles.responseTypeButtonTextActive
              ]}>
                Direkt Çözüm
              </Text>
            </TouchableOpacity>
          </View>
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
  menuButton: {
    marginLeft: 15,
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
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
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

  responseTypeContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  responseTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  responseTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  responseTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  responseTypeButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  responseTypeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#8b5cf6',
  },
  responseTypeButtonTextActive: {
    color: '#fff',
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
    gap: 10,
    marginTop: 10,
  },
  hapBilgiButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hapBilgiConfirmButton: {
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  hapBilgiRejectButton: {
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  hapBilgiButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  debugText: {
    fontSize: 10,
    color: 'red',
    backgroundColor: 'yellow',
    padding: 2,
    marginBottom: 4,
  },
});