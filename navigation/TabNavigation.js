import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_STYLES } from '../utils';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ChatScreen from '../screens/ChatScreen';
import ToolsStack from './ToolsStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return (
              <View style={[
                styles.iconContainer,
                focused && styles.activeIconContainer
              ]}>
                <Ionicons 
                  name={iconName} 
                  size={22} 
                  color={focused ? '#7c3aed' : '#9ca3af'} 
                />
              </View>
            );
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
            return (
              <View style={[
                styles.iconContainer,
                focused && styles.activeIconContainer
              ]}>
                <Ionicons 
                  name={iconName} 
                  size={22} 
                  color={focused ? '#7c3aed' : '#9ca3af'} 
                />
              </View>
            );
          } else if (route.name === 'Chat') {
            return (
              <View style={[
                styles.iconContainer,
                styles.centerButtonContainer
              ]}>
                <Ionicons name="add" size={24} color="#ffffff" />
              </View>
            );
          } else if (route.name === 'Tools') {
            iconName = focused ? 'construct' : 'construct-outline';
            return (
              <View style={[
                styles.iconContainer,
                focused && styles.activeIconContainer
              ]}>
                <Ionicons 
                  name={iconName} 
                  size={22} 
                  color={focused ? '#7c3aed' : '#9ca3af'} 
                />
              </View>
            );
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return (
              <View style={[
                styles.iconContainer,
                focused && styles.activeIconContainer
              ]}>
                <Ionicons 
                  name={iconName} 
                  size={22} 
                  color={focused ? '#7c3aed' : '#9ca3af'} 
                />
              </View>
            );
          }
        },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: ({ route }) => {
          // ProfileStack içindeki UserProfileScreen'de bottom bar'ı gizle
          if (route.name === 'Profile') {
            const state = route.state;
            if (state && state.routes && state.routes.length > 0) {
              const currentRoute = state.routes[state.index];
              if (currentRoute.name === 'UserProfileScreen') {
                return { display: 'none' };
              }
            }
          }
          
          return {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 92 : 82,
            paddingBottom: Platform.OS === 'ios' ? 16 : 12,
            paddingTop: 12,
            paddingHorizontal: 0,
            shadowColor: '#000000',
            shadowOffset: {
              width: 0,
              height: -6,
            },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 20,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          };
        },
        tabBarItemStyle: {
          flex: 1,
          paddingHorizontal: 0,
          maxWidth: '20%', // 5 tab için eşit genişlik
        },
        tabBarLabel: ({ focused, color }) => {
          let label;
          if (route.name === 'Home') label = 'Ana Sayfa';
          else if (route.name === 'Search') label = 'Ara';
          else if (route.name === 'Chat') label = 'Ekle';
          else if (route.name === 'Tools') label = 'Araçlar';
          else if (route.name === 'Profile') label = 'Profil';
          
          return (
            <Text style={[
              styles.tabLabel,
              { 
                color: focused ? '#7c3aed' : '#9ca3af',
                fontWeight: focused ? '700' : '600'
              }
            ]}>
              {label}
            </Text>
          );
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Tools" component={ToolsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
  },
  activeIconContainer: {
    // Tamamen temiz - hiçbir background yok
  },
  centerButtonContainer: {
    backgroundColor: '#7c3aed',
    borderRadius: 18,
    shadowColor: '#7c3aed',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});