import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createStackNavigator();

export default function NotificationsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
} 