import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Owner Screens
import OwnerOrdersScreen from '../screens/owner/OwnerOrdersScreen';
import OwnerApproveOrderScreen from '../screens/owner/OwnerApproveOrderScreen';
import OwnerProfileScreen from '../screens/owner/OwnerProfileScreen';
import OwnerProductsScreen from '../screens/owner/OwnerProductsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------- ORDERS STACK ----------------------
function OwnerOrdersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FF9500' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="OwnerOrdersList"
        component={OwnerOrdersScreen}
        options={{ title: 'Siparişler' }}
      />
      <Stack.Screen
        name="ApproveOrder"
        component={OwnerApproveOrderScreen}
        options={{ title: 'Siparişi Onayla' }}
      />
    </Stack.Navigator>
  );
}

// ---------------------- PRODUCTS STACK ----------------------
function OwnerProductsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FF9500' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="OwnerProducts"
        component={OwnerProductsScreen}
        options={{ title: 'Hizmetler' }}
      />
    </Stack.Navigator>
  );
}

// ---------------------- PROFILE STACK ----------------------
function OwnerProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FF9500' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="OwnerProfile"
        component={OwnerProfileScreen}
        options={{ title: 'Profilim' }}
      />
    </Stack.Navigator>
  );
}

// ---------------------- MAIN OWNER TAB ----------------------
export default function OwnerStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'OrdersTab') {
            iconName = focused ? 'clipboard-list' : 'clipboard-list';
          } else if (route.name === 'ProductsTab') {
            iconName = focused ? 'shopping' : 'shopping';
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

        tabBarActiveTintColor: '#FF9500',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="OrdersTab"
        component={OwnerOrdersStack}
        options={{ title: 'Siparişler' }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={OwnerProductsStack}
        options={{ title: 'Hizmetler' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={OwnerProfileStack}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}
