import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleGoogleLogin = () => {
    Alert.alert('Bilgi', 'Google ile giriş yakında eklenecek!');
  };

  const handleFacebookLogin = () => {
    Alert.alert('Bilgi', 'Facebook ile giriş yakında eklenecek!');
  };

  const handleAppleLogin = () => {
    Alert.alert('Bilgi', 'Apple ile giriş yakında eklenecek!');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Başarılı giriş - kısa bir delay ile mesaj göster
        Alert.alert(
          'Başarılı! 🎉',
          'Giriş yapıldı. Ana sayfaya yönlendiriliyorsunuz...',
          [{ text: 'Tamam' }],
          { cancelable: false }
        );
        
        // 1 saniye sonra otomatik kapat
        setTimeout(() => {
          // Navigation zaten AuthContext'te yapılıyor
        }, 1000);
      } else {
        // Hata durumu
        Alert.alert(
          'Giriş Başarısız ❌',
          result.error || 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.',
          [{ text: 'Tekrar Dene' }]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Bağlantı Hatası',
        'Sunucuya bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#8b5cf6', '#a855f7', '#c084fc']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo and Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="sparkles" size={32} color="#fff" />
              </View>
              <Text style={styles.brandName}>Visually</Text>
              <Text style={styles.tagline}>Görsel hikayelerinizi paylaşın</Text>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              <Text style={styles.welcomeTitle}>Hoş Geldiniz</Text>
              <Text style={styles.welcomeSubtitle}>Hesabınıza giriş yapın</Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Şifre</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
              </View>

                                            {/* Login Button */}
               <TouchableOpacity
                 style={styles.loginButton}
                 onPress={handleLogin}
                 disabled={isLoading}
               >
                 <Text style={styles.loginButtonText}>Giriş Yap</Text>
                 <Ionicons name="arrow-forward" size={16} color="#fff" />
               </TouchableOpacity>

               {/* Divider */}
               <View style={styles.divider}>
                 <View style={styles.dividerLine} />
                 <Text style={styles.dividerText}>VEYA</Text>
                 <View style={styles.dividerLine} />
               </View>

               {/* Social Login Buttons */}
               <TouchableOpacity
                 style={styles.socialButton}
                 onPress={handleGoogleLogin}
               >
                 <Ionicons name="logo-google" size={20} color="#DB4437" />
                 <Text style={styles.socialButtonText}>Google ile devam et</Text>
               </TouchableOpacity>

               <TouchableOpacity
                 style={styles.socialButton}
                 onPress={handleFacebookLogin}
               >
                 <Ionicons name="logo-facebook" size={20} color="#4267B2" />
                 <Text style={styles.socialButtonText}>Facebook ile devam et</Text>
               </TouchableOpacity>

               {Platform.OS === 'ios' && (
                 <TouchableOpacity
                   style={styles.socialButton}
                   onPress={handleAppleLogin}
                 >
                   <Ionicons name="logo-apple" size={20} color="#000" />
                   <Text style={styles.socialButtonText}>Apple ile devam et</Text>
                 </TouchableOpacity>
               )}

               {/* Register Link */}
               <View style={styles.registerLink}>
                 <Text style={styles.registerText}>Hesabınız yok mu? </Text>
                 <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                   <Text style={styles.registerLinkText}>Kayıt olun</Text>
                 </TouchableOpacity>
               </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    paddingHorizontal: 16,
  },
  loginButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 12,
    color: '#9ca3af',
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  socialButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  registerLinkText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
});