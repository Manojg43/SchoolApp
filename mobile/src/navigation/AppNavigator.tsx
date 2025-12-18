import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import LeaveScreen from '../screens/LeaveScreen';
import SalaryScreen from '../screens/SalaryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Scan" component={ScanScreen} />
                <Stack.Screen name="Leave" component={LeaveScreen} />
                <Stack.Screen name="Salary" component={SalaryScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
