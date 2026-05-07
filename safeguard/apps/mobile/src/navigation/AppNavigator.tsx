import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Onboarding Screens
import SplashScreen from '../screens/onboarding/SplashScreen';
import RoleSelectionScreen from '../screens/onboarding/RoleSelectionScreen';
import SignupScreen from '../screens/onboarding/SignupScreen';
import AadhaarVerificationScreen from '../screens/onboarding/AadhaarVerificationScreen';
import OtpVerificationScreen from '../screens/onboarding/OtpVerificationScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import JourneyScreen from '../screens/JourneyScreen';
import SOSScreen from '../screens/SOSScreen';
import TrackingScreen from '../screens/TrackingScreen';

export type RootStackParamList = {
  Splash: undefined;
  RoleSelection: undefined;
  Signup: undefined;
  AadhaarVerification: { signupData: any };
  OtpVerification: { signupData: any, aadhaarNumber: string };
  Home: undefined;
  Journey: undefined;
  SOS: undefined;
  Tracking: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading component
  }

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Onboarding Stack */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="AadhaarVerification" component={AadhaarVerificationScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />

      {/* Main App Stack */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Journey" component={JourneyScreen} />
      <Stack.Screen name="SOS" component={SOSScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
