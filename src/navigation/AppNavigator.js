import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import ChatScreen from '../screens/ChatScreen';
import ProgresoScreen from '../screens/ProgresoScreen';
import CalendarioScreen from '../screens/CalendarioScreen';
import OfertaScreen from '../screens/OfertaScreen';
import colors from '../constants/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.azulUnab,
      tabBarInactiveTintColor: colors.grisMedio,
      tabBarStyle: { paddingBottom: 6, paddingTop: 4, height: 60 },
      tabBarLabelStyle: { fontSize: 11 },
    }}
  >
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />, tabBarLabel: 'Chat' }}
    />
    <Tab.Screen
      name="Progreso"
      component={ProgresoScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />, tabBarLabel: 'Mi Progreso' }}
    />
    <Tab.Screen
      name="Calendario"
      component={CalendarioScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />, tabBarLabel: 'Calendario' }}
    />
    <Tab.Screen
      name="Oferta"
      component={OfertaScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />, tabBarLabel: 'Oferta' }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;