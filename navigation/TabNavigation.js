import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ChatScreen from '../screens/ChatScreen';
import MessagesStack from './MessagesStack';
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
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Chat') {
            // Özel chat butonu tasarımı
            return (
              <View style={{
                width: 50,
                height: 50,
                backgroundColor: '#8b5cf6',
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10,
              }}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
            );
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabel: ({ focused, color }) => {
          let label;
          if (route.name === 'Home') label = 'Home';
          else if (route.name === 'Search') label = 'Search';
          else if (route.name === 'Chat') label = '';
          else if (route.name === 'Messages') label = 'Messages';
          else if (route.name === 'Profile') label = 'Profile';
          
          return route.name === 'Chat' ? null : (
            <Text style={{ 
              color: color, 
              fontSize: 12,
              fontWeight: focused ? '600' : '400'
            }}>
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
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}