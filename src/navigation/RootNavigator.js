import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import CodingScreen from '../screens/CodingScreen';
import TestsScreen from '../screens/TestsScreen';
import TestIntroScreen from '../screens/TestIntroScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import ResumeScreen from '../screens/ResumeScreen';
import AIScreen from '../screens/AIScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.brand600} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
          <Stack.Screen name="Coding" component={CodingScreen} />
          <Stack.Screen name="Tests" component={TestsScreen} />
          <Stack.Screen name="TestIntro" component={TestIntroScreen} />
          <Stack.Screen name="JobDetail" component={JobDetailScreen} />
          <Stack.Screen name="Resume" component={ResumeScreen} />
          <Stack.Screen
            name="AI"
            component={AIScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
  },
});