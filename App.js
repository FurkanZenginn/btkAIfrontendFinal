import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SavedPostsProvider } from './contexts/SavedPostsContext';
import TabNavigation from './navigation/TabNavigation';
import AuthNavigation from './navigation/AuthNavigation';
import { View, ActivityIndicator, SafeAreaView, Platform } from 'react-native';

// Basit event emitter oluştur
class SimpleEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Global event emitter'ı başlat
global.eventEmitter = new SimpleEventEmitter();

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </SafeAreaView>
    );
  }

  // Onboarding kaldırıldı - direkt ana uygulamaya yönlendir

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar 
        style="dark" 
        backgroundColor="#fff" 
        translucent={true}
        barStyle="dark-content"
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <NavigationContainer>
          {user ? <TabNavigation /> : <AuthNavigation />}
        </NavigationContainer>
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SavedPostsProvider>
        <AppContent />
      </SavedPostsProvider>
    </AuthProvider>
  );
}
