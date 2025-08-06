import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

export default function EditProfileScreen({ navigation, route }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
  });
  
  // Profil tamamlama modu kontrolü
  const isProfileCompletion = route?.params?.isProfileCompletion || false;

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const result = await userService.getProfile();
      
      console.log('📥 Profile data result:', result);
      
      if (result.success && result.data) {
        // Backend'den gelen veri formatını kontrol et
        let userData;
        
        if (result.data.data && result.data.data.user) {
          // Çift sarmalanmış format: { data: { data: { user: {...} } } }
          userData = result.data.data.user;
        } else if (result.data.user) {
          // Tek sarmalanmış format: { data: { user: {...} } }
          userData = result.data.user;
        } else if (result.data) {
          // Direkt user data: { data: {...} }
          userData = result.data;
        } else {
          // Hiçbiri değilse mevcut user'ı kullan
          userData = user;
        }
        
        console.log('📥 Extracted userData:', userData);
        
        setProfileData({
          name: userData?.name || user?.name || '',
          avatar: userData?.avatar || user?.avatar || '',
        });
      } else {
        // Backend'den veri gelmezse mevcut user verilerini kullan
        console.log('⚠️ Backend profile data failed, using current user data');
        setProfileData({
          name: user?.name || '',
          avatar: user?.avatar || '',
        });
      }
    } catch (error) {
      console.error('❌ Profil verileri yüklenirken hata:', error);
      // Hata durumunda mevcut user verilerini kullan
      setProfileData({
        name: user?.name || '',
        avatar: user?.avatar || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeri erişim izni gereklidir.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        // Backend gereksinimleri: PNG, JPG, JPEG, GIF desteklenir
        // Dosya boyutu kontrolü için quality düşük tutuldu
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('📷 Selected image:', selectedImage);
        
        // URI'nin file:// ile başladığından emin ol
        if (selectedImage.uri && selectedImage.uri.startsWith('file://')) {
          // Backend gereksinimi: Maksimum 10MB kontrolü
          if (selectedImage.fileSize && selectedImage.fileSize > 10 * 1024 * 1024) {
            Alert.alert('Hata', 'Dosya boyutu 10MB\'dan büyük olamaz. Lütfen daha küçük bir görsel seçin.');
            return;
          }
          
          // Backend desteklenen formatları kontrol et
          const supportedFormats = ['png', 'jpg', 'jpeg', 'gif'];
          const fileExtension = selectedImage.uri.split('.').pop()?.toLowerCase();
          
          if (fileExtension && !supportedFormats.includes(fileExtension)) {
            Alert.alert('Hata', 'Desteklenmeyen dosya formatı. Lütfen PNG, JPG, JPEG veya GIF formatında bir görsel seçin.');
            return;
          }
          
          setProfileData(prev => ({
            ...prev,
            avatar: selectedImage.uri,
          }));
          console.log('✅ Avatar set to (Backend uyumlu):', selectedImage.uri);
          console.log('✅ File size:', selectedImage.fileSize, 'bytes');
          console.log('✅ File format:', fileExtension);
        } else {
          console.error('❌ Invalid image URI:', selectedImage.uri);
          Alert.alert('Hata', 'Seçilen görsel geçersiz.');
        }
      }
    } catch (error) {
      console.error('❌ Görsel seçilirken hata:', error);
      Alert.alert('Hata', 'Görsel seçilirken bir hata oluştu.');
    }
  };

  const removeAvatar = () => {
    console.log('🗑️ Removing avatar');
    setProfileData(prev => ({
      ...prev,
      avatar: '',
    }));
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı boş olamaz.');
      return;
    }

    // Profil tamamlama modunda avatar da zorunlu
    if (isProfileCompletion && !profileData.avatar) {
      Alert.alert('Hata', 'Profil fotoğrafı seçmeniz gereklidir.');
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        name: profileData.name.trim(),
      };

      // Avatar değişikliğini kontrol et
      const currentAvatar = user?.avatar || '';
      const newAvatar = profileData.avatar || '';
      
      console.log('🔍 Avatar comparison:');
      console.log('  - Current avatar:', currentAvatar);
      console.log('  - New avatar:', newAvatar);
      console.log('  - Avatar changed:', newAvatar !== currentAvatar);
      
      // Eğer avatar değiştiyse ekle
      if (newAvatar && newAvatar !== currentAvatar) {
        updateData.avatar = newAvatar;
        console.log('✅ Avatar will be updated');
      } else if (newAvatar === '' && currentAvatar) {
        // Avatar kaldırıldıysa
        updateData.avatar = '';
        console.log('✅ Avatar will be removed');
      } else {
        console.log('ℹ️ No avatar change');
      }

      console.log('📤 Sending update data:', updateData);
      const result = await userService.updateProfile(updateData);
      console.log('📥 Received result:', result);
      
      if (result.success) {
        console.log('📥 Result data to update user:', result.data);
        
        // Backend'den gelen veri formatını kontrol et
        let userDataToUpdate;
        
        if (result.data && result.data.user) {
          userDataToUpdate = result.data.user;
        } else if (result.data) {
          userDataToUpdate = result.data;
        } else {
          // Backend'den veri gelmezse mevcut user'ı güncelle
          userDataToUpdate = {
            ...user,
            name: profileData.name.trim(),
            avatar: newAvatar || currentAvatar
          };
        }
        
        console.log('📥 Final userDataToUpdate:', userDataToUpdate);
        
        // Auth context'teki user'ı güncelle
        await updateUser(userDataToUpdate);
        
        // Profil tamamlama modunda ise ana sayfaya yönlendir
        if (isProfileCompletion) {
          Alert.alert(
            'Hoş Geldin!', 
            'Profil bilgileriniz başarıyla tamamlandı. Ana sayfaya yönlendiriliyorsunuz.',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  // Profil tamamlama modunu kapat
                  // AuthContext'teki needsProfileCompletion'ı false yap
                  // Bu sayede App.js otomatik olarak TabNavigation'a yönlendirecek
                  // Bu işlem AuthContext'teki updateUser fonksiyonunda zaten yapılıyor
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Başarılı', 
            'Profil başarıyla güncellendi!',
            [
              {
                text: 'Tamam',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      } else {
        Alert.alert('Hata', result.error || result.message || 'Profil güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('❌ Profil güncellenirken hata:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Düzenle</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {!isProfileCompletion && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        {isProfileCompletion && <View style={{ width: 24 }} />}
        <Text style={styles.headerTitle}>
          {isProfileCompletion ? 'Profil Bilgilerini Tamamla' : 'Profili Düzenle'}
        </Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#8b5cf6" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isProfileCompletion ? 'Tamamla' : 'Kaydet'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profil Tamamlama Açıklaması */}
        {isProfileCompletion && (
          <View style={styles.completionInfo}>
            <Ionicons name="information-circle" size={24} color="#8b5cf6" />
            <Text style={styles.completionText}>
              Hoş geldin! Profil bilgilerinizi tamamlayarak uygulamayı kullanmaya başlayabilirsiniz.
            </Text>
          </View>
        )}
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Text style={styles.sectionTitle}>Profil Fotoğrafı</Text>
          <View style={styles.avatarContainer}>
            {profileData.avatar ? (
              <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {getInitials(profileData.name)}
                </Text>
              </View>
            )}
            <View style={styles.avatarActions}>
              <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.avatarButtonText}>Fotoğraf Seç</Text>
              </TouchableOpacity>
              {profileData.avatar && (
                <TouchableOpacity 
                  style={[styles.avatarButton, styles.removeButton]} 
                  onPress={removeAvatar}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.avatarButtonText}>Kaldır</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kullanıcı Adı</Text>
          <TextInput
            style={styles.input}
            value={profileData.name}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
            placeholder="Kullanıcı adınızı girin"
            placeholderTextColor="#9ca3af"
            maxLength={50}
          />
          <Text style={styles.inputHint}>
            {profileData.name.length}/50 karakter
          </Text>
        </View>



        {/* Email Section (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>E-posta</Text>
          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{user?.email}</Text>
            <Text style={styles.emailHint}>E-posta değiştirilemez</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 35 : 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  avatarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9fafb',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },

  emailContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  emailText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  emailHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  completionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
}); 