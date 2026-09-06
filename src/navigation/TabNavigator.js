import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import LearnScreen from '../screens/LearnScreen';
import PracticeScreen from '../screens/PracticeScreen';
import JobsScreen from '../screens/JobsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors, font, s } from '../theme';

const Tab = createBottomTabNavigator();
const TAB_CONTENT_HEIGHT = s(52);

const ICONS = {
  Home: ['home', 'home-outline'],
  Learn: ['book', 'book-outline'],
  Practice: ['flash', 'flash-outline'],
  Jobs: ['briefcase', 'briefcase-outline'],
  Profile: ['person', 'person-outline'],
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  // Lift tab bar above Android system navigation (gesture bar / 3-button nav).
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? s(20) : 0
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: font(10), fontWeight: '600', marginTop: 2 },
        tabBarStyle: {
          height: TAB_CONTENT_HEIGHT + s(8) + bottomInset,
          paddingTop: s(8),
          paddingBottom: bottomInset,
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderTopColor: colors.line,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          return (
            <Ionicons name={focused ? active : inactive} size={s(23)} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Practice" component={PracticeScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}