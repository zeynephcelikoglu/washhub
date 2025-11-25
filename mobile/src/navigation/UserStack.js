import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// User Screens
import UserHomeScreen from '../screens/user/UserHomeScreen';
import UserOrdersScreen from '../screens/user/UserOrdersScreen';
import UserAddressesScreen from '../screens/user/UserAddressesScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';
import CreateOrderScreen from '../screens/user/CreateOrderScreen';
import OrderReviewScreen from '../screens/user/OrderReviewScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------- HOME STACK ----------------------
function UserHomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="UserHome"
        component={UserHomeScreen}
        options={{ title: 'WashHub' }}
      />

      <Stack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{ title: 'Sipariş Oluştur' }}
      />

      <Stack.Screen
        name="OrderReview"
        component={OrderReviewScreen}
        options={{ title: 'Sipariş Özeti' }}
      />
    </Stack.Navigator>
  );
}

// ---------------------- ORDERS STACK ----------------------
function UserOrdersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="UserOrders"
        component={UserOrdersScreen}
        options={{ title: 'Siparişlerim' }}
      />
    </Stack.Navigator>
  );
}

// ---------------------- ADDRESSES STACK ----------------------
function UserAddressesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="UserAddresses"
        component={UserAddressesScreen}
        options={{ title: 'Adreslerim' }}
      />
    </Stack.Navigator>
  );
}

// ---------------------- PROFILE STACK ----------------------
function UserProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: 'Profilim' }}
      />
    </Stack.Navigator>
  );
}

// ---------------------- MAIN TAB ----------------------
export default function UserStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'AddressesTab') {
            iconName = focused ? 'map-marker' : 'map-marker-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },

        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="HomeTab" component={UserHomeStack} options={{ title: 'Anasayfa' }} />
      <Tab.Screen name="OrdersTab" component={UserOrdersStack} options={{ title: 'Siparişler' }} />
      <Tab.Screen name="AddressesTab" component={UserAddressesStack} options={{ title: 'Adresler' }} />
      <Tab.Screen name="ProfileTab" component={UserProfileStack} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
