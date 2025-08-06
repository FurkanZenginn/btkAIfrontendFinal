import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import UserProfileScreen from '../screens/UserProfileScreen';

const Stack = createStackNavigator();

export default function UserProfileStack() {
  console.log('🔧 UserProfileStack yüklendi');
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="UserProfileMain" component={UserProfileScreen} />
    </Stack.Navigator>
  );
} 