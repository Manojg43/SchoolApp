import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import LeaveScreen from '../screens/LeaveScreen';
import SalaryScreen from '../screens/SalaryScreen';
import DailyAttendanceScreen from '../screens/DailyAttendanceScreen';
import TimetableScreen from '../screens/TimetableScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NoticeBoardScreen from '../screens/NoticeBoardScreen';
import HomeworkScreen from '../screens/HomeworkScreen';
import EnquiryFormScreen from '../screens/EnquiryFormScreen';
import EnquiryListScreen from '../screens/EnquiryListScreen';
import EnquiryDetailScreen from '../screens/EnquiryDetailScreen';
import { theme } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check for existing auth token on app startup
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('auth_token');
                // Optional: Validate token with backend here if needed
                if (token) {
                    setIsLoggedIn(true);
                } else {
                    setIsLoggedIn(false);
                }
            } catch (error) {
                console.log('Error checking auth token:', error);
                setIsLoggedIn(false);
            } finally {
                // Add a small delay for splash effect integration if desired
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={isLoggedIn ? "Home" : "Login"}
                screenOptions={{ headerShown: false }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Scan" component={ScanScreen} />
                <Stack.Screen name="Leave" component={LeaveScreen} />
                <Stack.Screen name="Salary" component={SalaryScreen} />
                <Stack.Screen name="DailyAttendance" component={DailyAttendanceScreen} />
                <Stack.Screen name="Timetable" component={TimetableScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Notices" component={NoticeBoardScreen} />
                <Stack.Screen name="Homework" component={HomeworkScreen} />
                <Stack.Screen name="EnquiryForm" component={EnquiryFormScreen} />
                <Stack.Screen name="EnquiryList" component={EnquiryListScreen} />
                <Stack.Screen name="EnquiryDetail" component={EnquiryDetailScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
});
