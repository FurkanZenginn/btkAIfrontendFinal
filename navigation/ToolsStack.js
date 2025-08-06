import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ToolsScreen from '../screens/ToolsScreen';
import HapBilgiScreen from '../screens/HapBilgiScreen';

const Stack = createStackNavigator();

export default function ToolsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="ToolsMain" 
        component={ToolsScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="HapBilgi" 
        component={HapBilgiScreen}
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
} 