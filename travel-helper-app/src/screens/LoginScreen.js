import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import AppAlert from '../components/AppAlert';

export default function LoginScreen({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlert({ visible: true, title, message });
  };
  const [password, setPassword] = useState('');
  const { login } = useUser();
  const handleLogin = async () => {
    if (!mobile || !password) {
      showAlert('Error', 'Please enter both fields');
      return;
    }

    const savedUser = await AsyncStorage.getItem('@user');
    if (!savedUser) {
      showAlert('User not found', 'No account exists with this number');
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    console.log("User login", mobile, password)
    console.log("User Parsed", parsedUser)
    if (parsedUser.phone !== '+91' + mobile || parsedUser.password !== password) {
      showAlert('Invalid credentials', 'Mobile or password is incorrect');

      return;
    }

    login(parsedUser); // sets context

  };


  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mobile Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={mobile}
        placeholder="Enter your Mobile No"

        onChangeText={setMobile}
        placeholderTextColor="#888"

      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#888"
        placeholder="Enter your password"
        style={[styles.input, { color: '#888' }]}

      />
      <Button title="Login" onPress={handleLogin} />
      <Text style={styles.signupText} onPress={() => navigation.navigate('Signup')}>
        Don’t have an account? Signup
      </Text>
      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  label: { fontSize: 16, marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
  },
  signupText: {
    marginTop: 20,
    color: 'blue',
    textAlign: 'center',
  },
});
