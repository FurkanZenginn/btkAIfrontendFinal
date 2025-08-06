import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createStackNavigator();

export default function ProfileCompletionNavigation() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen 
        name="ProfileCompletion" 
        component={EditProfileScreen}
        initialParams={{ isProfileCompletion: true }}
      />
    </Stack.Navigator>
  );
} 