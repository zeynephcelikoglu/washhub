import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Courier Screens
import CourierOrdersScreen from '../screens/courier/CourierOrdersScreen';
import CourierOrderDetailScreen from '../screens/courier/CourierOrderDetailScreen';
import CourierProfileScreen from '../screens/courier/CourierProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------- ORDERS STACK ----------------------
function CourierOrdersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#34C759' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="CourierOrdersList" 
        component={CourierOrdersScreen}
        options={{ title: 'Atanmış Siparişler' }}
      />
      <Stack.Screen 
        name="CourierOrderDetail" 
        component={CourierOrderDetailScreen}
        options={{ title: 'Sipariş Detayı' }}
      />
    </Stack.Navigator>
  );
}

// ---------------------- PROFILE STACK ----------------------
function CourierProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#34C759' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="CourierProfile" 
        component={CourierProfileScreen}
        options={{ title: 'Profilim' }}
      />
    </Stack.Navigator>
  );
}

// ---------------------- MAIN COURIER TAB ----------------------
export default function CourierStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'OrdersTab') {
            iconName = focused ? 'truck' : 'truck-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return (
            <MaterialCommunityIcons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },

        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="OrdersTab" 
        component={CourierOrdersStack}
        options={{ title: 'Siparişler' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={CourierProfileStack}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}
