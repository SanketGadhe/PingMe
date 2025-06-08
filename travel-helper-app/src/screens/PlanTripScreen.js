import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { startBackgroundLocation } from '../services/locationServices';
import AppAlert from '../components/AppAlert';

const PlanTripScreen = ({ route }) => {
    const navigation = useNavigation();
    const { destination, currentLocation } = route?.params || {};

    const [reminder, setReminder] = useState('');
    const [reminderList, setReminderList] = useState([]);
    const [tripMessage, setTripMessage] = useState('');
    const [pickupToggle, setPickupToggle] = useState(false);
    const [pickupName, setPickupName] = useState('');
    const [pickupNumber, setPickupNumber] = useState('');
    const [pickupMessage, setPickupMessage] = useState('');
    const [pickupDistance, setPickupDistance] = useState('');
    const [arrivalToggle, setArrivalToggle] = useState(false);
    const [arrivalName, setArrivalName] = useState('');
    const [arrivalNumber, setArrivalNumber] = useState('');
    const [arrivalMessage, setArrivalMessage] = useState('');
    const [distance, setDistance] = useState('3');
    const [setting, setSetting] = useState(null);

    const [alert, setAlert] = useState({ visible: false, title: '', message: '' });

    const showAlert = (title, message) => {
        setAlert({ visible: true, title, message });
    };

    // ✅ Fetch settings only once and set trip defaults
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const stored = await AsyncStorage.getItem('@app_settings');
                const parsed = JSON.parse(stored || '{}');
                console.log('[PlanTrip] Loaded Twilio Settings:', parsed);
                setSetting(parsed);

                if (parsed?.defaultDistanceKm) {
                    setDistance(String(parsed.defaultDistanceKm));
                }

                if (parsed?.defaultCallMessage) {
                    setTripMessage(parsed.defaultCallMessage);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };

        fetchSettings();
    }, []);

    const handleSaveTrip = async () => {
        if (!destination) return showAlert('Missing Info', 'Destination is required');
        if (!currentLocation) return showAlert('Missing Info', 'Current location is required');

        // ✅ Ensure Twilio config is valid before saving
        if (
            !setting?.accountSid ||
            !setting?.authToken ||
            !setting?.twilioNumber
        ) {
            return showAlert(
                'Twilio Settings Missing',
                'Please configure your Twilio settings in the Settings screen before starting a trip.'
            );
        }

        const trip = {
            destination,
            currentLocation,
            reminderList,
            distance: parseFloat(distance),
            tripMessage,
            pickup: pickupToggle
                ? {
                    name: pickupName,
                    number: pickupNumber,
                    message: pickupMessage || 'I am reaching soon!',
                    distance: parseFloat(pickupDistance || distance),
                }
                : null,
            arrival: arrivalToggle
                ? {
                    name: arrivalName,
                    number: arrivalNumber,
                    message: arrivalMessage || 'I have arrived safely!',
                }
                : null,
        };

        try {
            await AsyncStorage.setItem('@trip', JSON.stringify(trip));
            await AsyncStorage.setItem('@tracking', 'true');
            await startBackgroundLocation();
            showAlert('Trip Started ✅', 'Tracking started in background.');
            navigation.navigate('Home');
        } catch (e) {
            console.error('Error saving trip:', e);
            showAlert('Error', 'Could not start trip.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>🏁 Destination</Text>
            <TextInput
                style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                value={destination?.address || ''}
                editable={false}
                placeholder="Destination not set"
                placeholderTextColor="#888"
            />

            <Text style={styles.heading}>🧳 Reminder</Text>
            <View style={styles.reminderRow}>
                <TextInput
                    placeholder="Add a reminder item"
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={reminder}
                    onChangeText={setReminder}
                    placeholderTextColor="#888"
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        if (!reminder.trim()) return;
                        setReminderList(prev => [...prev, reminder.trim()]);
                        setReminder('');
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
            </View>

            {reminderList.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                    {reminderList.map((item, idx) => (
                        <View key={idx} style={styles.reminderItem}>
                            <Text style={{ flex: 1 }}>{item}</Text>
                            <TouchableOpacity onPress={() => setReminderList(prev => prev.filter((_, i) => i !== idx))}>
                                <Text style={{ color: 'red', fontWeight: 'bold' }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <Text style={styles.heading}>📏 Distance Threshold (km)</Text>
            <TextInput
                placeholder="e.g. 3"
                style={styles.input}
                keyboardType="numeric"
                value={distance}
                onChangeText={setDistance}
                placeholderTextColor="#888"
            />

            <Text style={styles.heading}>📣 Custom Message</Text>
            <TextInput
                placeholder="Set personalized message (optional)"
                style={styles.input}
                value={tripMessage}
                onChangeText={setTripMessage}
                placeholderTextColor="#888"
                multiline
                numberOfLines={5}
            />

            <Text style={styles.heading}>📱 Call for Pickup</Text>
            <Switch value={pickupToggle} onValueChange={setPickupToggle} />
            {pickupToggle && (
                <>
                    <TextInput placeholder="Name" style={styles.input} value={pickupName} onChangeText={setPickupName} placeholderTextColor="#888" />
                    <TextInput placeholder="Phone Number" keyboardType="phone-pad" style={styles.input} value={pickupNumber} onChangeText={setPickupNumber} placeholderTextColor="#888" />
                    <TextInput placeholder="Custom message (optional)" style={styles.input} value={pickupMessage} onChangeText={setPickupMessage} placeholderTextColor="#888" />
                    <TextInput placeholder="Distance before destination (km)" keyboardType="numeric" style={styles.input} value={pickupDistance} onChangeText={setPickupDistance} placeholderTextColor="#888" />
                </>
            )}

            <Text style={styles.heading}>📞 Call after Arrival</Text>
            <Switch value={arrivalToggle} onValueChange={setArrivalToggle} />
            {arrivalToggle && (
                <>
                    <TextInput placeholder="Name" style={styles.input} value={arrivalName} onChangeText={setArrivalName} placeholderTextColor="#888" />
                    <TextInput placeholder="Phone Number" keyboardType="phone-pad" style={styles.input} value={arrivalNumber} onChangeText={setArrivalNumber} placeholderTextColor="#888" />
                    <TextInput placeholder="Custom message (optional)" style={styles.input} value={arrivalMessage} onChangeText={setArrivalMessage} placeholderTextColor="#888" />
                </>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSaveTrip}>
                <Text style={styles.buttonText}>Start Trip 🚀</Text>
            </TouchableOpacity>

            <AppAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, visible: false })}
            />
        </ScrollView>
    );
};

export default PlanTripScreen;


const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 100,
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    addButton: {
        marginLeft: 8,
        backgroundColor: '#2196F3',
        padding: 10,
        borderRadius: 8,
    },
    reminderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    button: {
        backgroundColor: '#28a745',
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 24,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});