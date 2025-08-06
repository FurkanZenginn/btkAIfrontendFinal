import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Stack = createStackNavigator();

export default function ProfileStack() {
  console.log('🔧 ProfileStack yüklendi');
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
    </Stack.Navigator>
  );
} 