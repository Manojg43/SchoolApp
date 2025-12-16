import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}


