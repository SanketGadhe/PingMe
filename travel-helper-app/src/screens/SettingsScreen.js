import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  Button,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppAlert from '../components/AppAlert';
import { useUser } from '../context/UserContext';
const SETTINGS_KEY = '@app_settings';

const SettingsScreen = () => {
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [twilioNumber, setTwilioNumber] = useState('');
  const [defaultDistanceKm, setDefaultDistanceKm] = useState('');
  const [defaultCallMessage, setDefaultCallMessage] = useState('');
  const [enableReminders, setEnableReminders] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const logout = useUser();

  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const showAlert = (title, message) => {
    setAlert({ visible: true, title, message });
  };
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      const userStr = await AsyncStorage.getItem('@user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || '');
        setUserPhone(user.phone || '');
      }
      let name = '';
      if (userStr) {
        const user = JSON.parse(userStr);
        name = user.name || '';
        setUserName(name);
        setUserPhone(user.phone || '');
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        setAccountSid(parsed.accountSid || '');
        setAuthToken(parsed.authToken || '');
        setTwilioNumber(parsed.twilioNumber || '');
        setDefaultDistanceKm(
          parsed.defaultDistanceKm !== undefined && parsed.defaultDistanceKm !== null
            ? parsed.defaultDistanceKm.toString()
            : '4'
        );
        setDefaultCallMessage(
          parsed.defaultCallMessage ||
          `Hi ${name},You're almost at your destination. Please get ready to step off safely.`
        );
        setEnableReminders(parsed.enableReminders || false);
        const settings = {
          accountSid,
          authToken,
          twilioNumber,
          defaultDistanceKm: parseFloat(defaultDistanceKm) || 4,
          defaultCallMessage,
          enableReminders,
        };
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

      } else {
        // If no stored settings, set defaults
        setDefaultDistanceKm('4');
        setDefaultCallMessage(
          `Hi ${name},You're almost at your destination. Please get ready to step off safely.`
        );
      }

    } catch (e) {
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  const saveSettings = async () => {
    if (!accountSid || !authToken || !twilioNumber) {
      showAlert('Missing Fields', 'Twilio fields are required');
      return;
    }

    if (!twilioNumber.startsWith('+')) {
      showAlert('Invalid Number', 'Twilio number must start with + and be in E.164 format');
      return;
    }
    if (!userName || !userPhone) {
      showAlert('Missing Fields', 'User name and phone are required');
      return;
    }

    const settings = {
      accountSid,
      authToken,
      twilioNumber,
      defaultDistanceKm: parseFloat(defaultDistanceKm) || 4,
      defaultCallMessage,
      enableReminders,
    };

    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      await AsyncStorage.setItem('@user', JSON.stringify({ name: userName, phone: userPhone }));
      showAlert('Success ✅', 'Settings saved');
      setEditMode(false);
    } catch (e) {
      showAlert('Error', 'Failed to save settings');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>User Info</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={userName}
          editable={editMode}
          onChangeText={setUserName}
          placeholderTextColor="#888"
        />
        <TextInput
          style={styles.input}
          placeholder="Your Phone Number"
          value={userPhone}
          editable={editMode}
          onChangeText={setUserPhone}
          keyboardType="phone-pad"
          placeholderTextColor="#888"
        />
        <Text style={styles.title}>Twilio Credentials</Text>
        <TextInput
          style={styles.input}
          placeholder="Twilio Account SID"
          value={accountSid}
          editable={editMode}
          onChangeText={setAccountSid}
          placeholderTextColor="#888"

        />
        <TextInput
          placeholder="Auth Token"
          value={authToken}
          editable={editMode}
          onChangeText={setAuthToken}
          secureTextEntry
          placeholderTextColor="#888"
          style={[styles.input, { color: '#888' }]}
        />
        <TextInput
          style={styles.input}
          placeholder="+1415xxxxxxx"
          value={twilioNumber}
          editable={editMode}
          onChangeText={setTwilioNumber}
          keyboardType="phone-pad"
          placeholderTextColor="#888"
        />
        <Text style={styles.note}>
          This number must be verified in Twilio Console before using.
        </Text>

        <Text style={styles.title}>Call Defaults</Text>
        <TextInput
          style={styles.input}
          placeholder="Default call distance (km)"
          value={defaultDistanceKm}
          editable={editMode}
          onChangeText={setDefaultDistanceKm}
          keyboardType="numeric"
          placeholderTextColor="#888"
        />
        <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
          You can customize the call message below.
        </Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Default call message"
          value={defaultCallMessage}
          editable={editMode}
          placeholderTextColor="#888"
          onChangeText={setDefaultCallMessage}
          multiline
          numberOfLines={9}
        />

        <Text style={styles.title}>Reminders</Text>
        <View style={styles.switchRow}>
          <Text>Enable post-call reminders</Text>
          <Switch
            value={enableReminders}
            disabled={!editMode}
            onValueChange={setEnableReminders}
          />
        </View>
        <AppAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert({ ...alert, visible: false })}
        />

        {editMode ? (
          <Button title="Save Settings" onPress={saveSettings} marginBottom="3" />
        ) : (
          <Button title="Edit" onPress={() => setEditMode(true)} />
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          if (typeof logout === 'function') {
            await logout();
            showAlert('Logged Out', 'You have been logged out.');
          } else if (logout && logout.logout) {
            await logout.logout();
            showAlert('Logged Out', 'You have been logged out.');
          } else {
            showAlert('Error', 'Logout function not available.');
          }
        }}
      >
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  note: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 180,
    marginBottom: 30,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 1,
  },
  container: {
    padding: 20,
    backgroundColor: '#f7f7f7',
    paddingBottom: 80, // Add extra padding for logout button
  },
});
