import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

import AuthStack from './AuthStack';
import UserStack from './UserStack';
import OwnerStack from './OwnerStack';
import CourierStack from './CourierStack';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoading, userToken, user } = useContext(AuthContext);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : user?.role === 'user' ? (
          <Stack.Screen name="User" component={UserStack} />
        ) : user?.role === 'owner' ? (
          <Stack.Screen name="Owner" component={OwnerStack} />
        ) : user?.role === 'courier' ? (
          <Stack.Screen name="Courier" component={CourierStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}