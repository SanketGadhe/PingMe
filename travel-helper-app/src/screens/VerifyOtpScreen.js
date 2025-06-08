import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import AppAlert from '../components/AppAlert';

const VerifyOTPScreen = ({ route, navigation }) => {
    const { name, phone, password } = route.params;
    const [otp, setOTP] = useState('');
    const [alert, setAlert] = useState({ visible: false, title: '', message: '' });


    const { login } = useUser();
    const verifyOTP = async () => {
        if (!otp || otp.length < 4) {
            Alert.alert('Please enter a valid OTP');
            return;
        }

        try {
            const response = await fetch('https://otpauth-5890.twil.io/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone,
                    code: otp,
                }),
            });

            const result = await response.json();
            const user = { name, phone, password };
            if (result.verified) {
                console.log("User", user)
                await AsyncStorage.setItem('user', JSON.stringify(user));
                login(user);
                setAlert({
                    visible: true,
                    title: 'Verified',
                    message: 'OTP Verified',
                });
            } else {
                setAlert({
                    visible: true,
                    title: 'Error',
                    message: 'Invalid OTP',
                });

            }
        } catch (err) {
            setAlert({
                visible: true,
                title: 'Error',
                message: 'OTP verification failed',
            });
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Enter OTP</Text>
            <TextInput
                placeholder="Enter OTP"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOTP}
                style={styles.input}
                placeholderTextColor="#888"
            />
            <Button title="Verify OTP & Continue" onPress={verifyOTP} />
            <AppAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, visible: false })}
            />
        </View>
    );
};

export default VerifyOTPScreen;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10, borderRadius: 5 },
});
