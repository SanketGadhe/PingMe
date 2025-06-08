import React, { useContext, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useUser } from '../context/UserContext';
import AppAlert from '../components/AppAlert';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useUser();
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlert({ visible: true, title, message });
  };


  const handleSignup = async () => {
    if (!name || !phone || !password) {
      showAlert('Missing Fields', 'All fields are required');
      return;
    }
    if (!phone.startsWith('+') || phone.length < 10) {
      showAlert('Invalid Phone', 'Enter phone with country code (e.g., +91...)');
      return;
    }

    try {
      const response = await fetch('https://otpauth-5890.twil.io/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();
      if (result.success) {
        navigation.navigate('VerifyOTP', {
          name,
          phone,
          password,
        });
      } else {
        showAlert('OTP Failed', 'Failed to send OTP');
      }
    } catch (err) {
      showAlert('Error', 'Error sending OTP');
    }
  };

  const handlePhoneChange = (input) => {
    let formatted = input;
    if (!formatted.startsWith('+91')) {
      formatted = '+91' + formatted.replace(/^\+?91?/, '');
    }
    setPhone(formatted);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Sign Up</Text>
      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Phone"
        style={styles.input}
        value={phone}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#888"
        style={[styles.input, { color: '#888' }]}
      />
      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
      <Button title="Sign Up & Send OTP" onPress={handleSignup} />
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10, borderRadius: 5 },
});
