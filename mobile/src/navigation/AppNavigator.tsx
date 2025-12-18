import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
                <Stack.Screen name="DailyAttendance" component={DailyAttendanceScreen} />
                <Stack.Screen name="Timetable" component={TimetableScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Notices" component={NoticeBoardScreen} />
                <Stack.Screen name="Homework" component={HomeworkScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
