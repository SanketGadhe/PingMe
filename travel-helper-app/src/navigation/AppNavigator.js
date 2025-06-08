import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';

// Screens (adjust imports as per your project structure)
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PlanTripScreen from '../screens/PlanTripScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VerifyOTPScreen from '../screens/VerifyOtpScreen';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { isLoggedIn, loading } = useUser();


    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: true,
                    header: ({ navigation, route, options, back }) =>
                        isLoggedIn ? (
                            <View style={styles.header}>
                                {back ? (
                                    <TouchableOpacity onPress={navigation.goBack} style={{ paddingRight: 12, paddingTop: 20 }}>
                                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ width: 36 }} />
                                )}
                                <Text style={styles.title}>
                                    {options.title || route.name}
                                </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
                                    <Ionicons name="settings" size={24} color="#007AFF" />
                                </TouchableOpacity>
                            </View>
                        ) : undefined,
                }}
            >
                {!isLoggedIn ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ header: () => null }} />
                        <Stack.Screen name="Signup" component={SignupScreen} options={{ header: () => null }} />
                        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} options={{ header: () => null }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
                        <Stack.Screen name="PlanTrip" component={PlanTripScreen} options={{ title: 'Plan Your Trip' }} />
                        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );

};
const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        paddingTop: 20,
        color: '#222',
    },
    settingsButton: {
        padding: 4,
    },
});
export default AppNavigator;
