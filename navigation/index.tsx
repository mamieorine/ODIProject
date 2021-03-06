import { FontAwesome } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { ColorSchemeName } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import NotFoundScreen from '../screens/NotFoundScreen';
import MapHomeScreen from '../screens/MapHomeScreen';
import AllRoutesScreen from '../screens/AllRoutesScreen';
import RouteScreen from '../screens/RouteScreen';
import { RootStackParamList, RootTabParamList, RootTabScreenProps } from '../types';
import LinkingConfiguration from './LinkingConfiguration';
import HomeScreen from '../screens/HomeScreen';
import AgreementScreen from '../screens/AgreementScreen';
import CrimeDetailScreen from '../screens/CrimeDetailScreen';

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootNavigator/>
    </NavigationContainer>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator(navigationRef: any) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Agreement" component={AgreementScreen}
        options={{ headerShown: true, title: 'Terms and conditions' }}
      />
      <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CrimeDetailScreen" component={CrimeDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RouteScreen" component={AllRoutesScreen} options={{headerShown: false }}  />
      <Stack.Screen name="MapHomeScreen" component={MapHomeScreen} options={{headerShown: false }}  />
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
      </Stack.Group>
    </Stack.Navigator>
  );
}

export const BottomTab = createBottomTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="MapHomeScreen"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
      }}>
      <BottomTab.Screen
        name="MapHomeScreen"
        component={MapHomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
          headerShown: true
        }}
      />
      <BottomTab.Screen
        name="TabTwo"
        component={AllRoutesScreen}
        options={{
          title: 'Custom Markers',
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
          headerShown: false
        }}
      />
      <BottomTab.Screen
        name="TabThree"
        component={RouteScreen}
        options={{
          title: 'Routes',
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}
