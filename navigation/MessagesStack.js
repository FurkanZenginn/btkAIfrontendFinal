import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MessagesScreen from '../screens/MessagesScreen';
import HapBilgiScreen from '../screens/HapBilgiScreen';

const Stack = createStackNavigator();

export default function MessagesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MessagesMain" component={MessagesScreen} />
      <Stack.Screen name="HapBilgi" component={HapBilgiScreen} />
    </Stack.Navigator>
  );
} 