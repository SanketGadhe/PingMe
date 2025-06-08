import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
    SafeAreaView,
    TextInput,
    FlatList,
    Keyboard,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_MAPS_API_KEY } from '../constants/key';
import { triggerTwilioCall, sendSMSviaTwilio } from '../services/twilloServices';
import AppAlert from '../components/AppAlert';

const HomeScreen = ({ navigation }) => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [destination, setDestination] = useState(null);
    const [tracking, setTracking] = useState(false);
    const [routeCoords, setRouteCoords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [routeLoading, setRouteLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const mapRef = useRef(null);
    const searchTimeout = useRef(null);
    const [trip, setTrip] = useState({})
    const [distanceLeft, setDistanceLeft] = useState(null);
    const [setting, setSetting] = useState(null)
    const [alert, setisAlert] = useState(false)
    const [alertTitle, setAlertTitle] = useState('')
    const [alertMessage, setAlertMessage] = useState('')

    useEffect(() => {
        const fetchLocation = async () => {
            await getCurrentLocation();
        };
        fetchLocation();
    }, []);
    useEffect(() => {
        const checkTracking = async () => {
            const isTracking = await AsyncStorage.getItem('@tracking');
            setTracking(isTracking === 'true');
            if (isTracking === 'true') {
                const tripStr = await AsyncStorage.getItem('@trip');
                if (tripStr) {
                    try {
                        const tripObj = JSON.parse(tripStr);
                        setTrip(tripObj);
                        if (tripObj.destination) setDestination(tripObj.destination);
                        if (tripObj.currentLocation) setCurrentLocation(tripObj.currentLocation);
                        if (tripObj.currentLocation && tripObj.destination) {
                            getDirections(tripObj.currentLocation, tripObj.destination);
                        }
                    } catch (e) {
                        console.error('Failed to parse trip from storage', e);
                    }
                }
            }
        };
        checkTracking();
        const unsubscribe = navigation.addListener('focus', checkTracking);
        return () => {
            unsubscribe(); // <-- wrap in a function!
        };
    }, [navigation]);

    useEffect(() => {
        let locationSubscription = null;

        if (tracking) {
            (async () => {
                const settingsStr = await AsyncStorage.getItem('@app_settings');
                const settings = JSON.parse(settingsStr || '{}');

                const userStr = await AsyncStorage.getItem('@user');
                const user = JSON.parse(userStr || '{}');
                const recipient = user.phone;

                locationSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000,
                        distanceInterval: 10,
                    },
                    async (location) => {
                        try {
                            const coords = {
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            };

                            setCurrentLocation(coords);

                            setTrip((prev) => {
                                const updated = { ...prev, currentLocation: coords };
                                AsyncStorage.setItem('@trip', JSON.stringify(updated));
                                return updated;
                            });

                            if (!destination) return;

                            const dist = getDistanceFromLatLonInKm(
                                coords.latitude,
                                coords.longitude,
                                destination.latitude,
                                destination.longitude
                            );
                            setDistanceLeft(dist);

                            const sendAll = async ({ to, message, triggerKey }) => {
                                if (!to || !message || !settings.accountSid || !settings.authToken || !settings.twilioNumber) {
                                    setAlertTitle('Twilio Details Missing');
                                    setAlertMessage('Please check your Twilio settings in the Settings page.');
                                    setisAlert(true);
                                    return;
                                }

                                const alreadyDone = await AsyncStorage.getItem(triggerKey);
                                if (alreadyDone === 'true') return;
                                try {
                                    await triggerTwilioCall({
                                        to,
                                        from: settings.twilioNumber,
                                        message,
                                        sid: settings.accountSid,
                                        token: settings.authToken,
                                    });

                                    // await sendSMSviaTwilio({
                                    //     to,
                                    //     from: settings.twilioNumber,
                                    //     message,
                                    //     sid: settings.twilioSid,
                                    //     token: settings.twilioToken,
                                    // });

                                    await AsyncStorage.setItem(triggerKey, 'true');
                                } catch (err) {
                                    console.error('Call/SMS Error:', err.message);
                                }
                            };

                            // ✅ Main Trip Threshold Alert
                            if (trip?.distance && dist <= trip.distance) {
                                const alreadyCalled = await AsyncStorage.getItem('@call_made');
                                if (!alreadyCalled) {
                                    let reminderMsg = '';
                                    if (Array.isArray(trip.reminderList) && trip.reminderList.length > 0) {
                                        reminderMsg = `\nDon't forget to take: ${trip.reminderList.join(', ')}.`;
                                    }

                                    const baseMsg = trip.tripMessage?.trim() || settings.defaultCallMessage || '';
                                    const fullMessage =
                                        `${baseMsg} You are just ${dist.toFixed(2)} km from your destination.${reminderMsg} Thanks for choosing HopOFF!`;

                                    await sendAll({
                                        to: recipient,
                                        message: fullMessage,
                                        triggerKey: '@call_made',
                                    });
                                }
                            }

                            // ✅ Pickup Alert (only once)
                            if (
                                trip?.pickup?.number &&
                                trip?.pickup?.message &&
                                dist <= trip.pickup.distance
                            ) {

                                await sendAll({
                                    to: '+91' + trip.pickup.number,
                                    message: trip.pickup.message,
                                    triggerKey: '@pickup_done',
                                });
                            }

                            // ✅ Arrival Alert (only once)
                            if (
                                trip?.arrival?.number &&
                                trip?.arrival?.message &&
                                dist <= 0
                            ) {
                                await sendAll({
                                    to: '+91' + trip.arrival.number,
                                    message: trip.arrival.message,
                                    triggerKey: '@arrival_done',
                                });
                            }
                        } catch (err) {
                            setAlertTitle('Tracking Error');
                            setAlertMessage('Something went wrong during trip monitoring.');
                            setisAlert(true);
                            console.error('Location error:', err);
                        }
                    }
                );
            })();
        }

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [tracking, destination]);


    useEffect(() => {
        if (searchQuery.length > 2) {
            // Debounce search
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
            searchTimeout.current = setTimeout(() => {
                searchPlaces(searchQuery);
            }, 300);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery]);
    const handleMapPress = async (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setShowResults(false); // Hide search results
        setSearchQuery('');    // Optionally clear search bar

        // Optionally, reverse geocode to get address
        let address = '';
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            if (data.status === 'OK' && data.results && data.results[0]) {
                address = data.results[0].formatted_address;
            }
        } catch (e) {
            address = '';
        }

        setDestination({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
            name: address || 'Selected Location',
            address: address,
        });

        if (currentLocation) {
            getDirections(currentLocation, { latitude, longitude });
        }
    };
    const getCurrentLocation = async () => {
        try {
            setLoading(true);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setAlertTitle('Permission Denied')
                setAlertMessage('Location permission is required to show your current location.')
                setisAlert(true)
                // Alert.alert(
                //     'Permission Denied',
                //     'Location permission is required to show your current location.',
                //     [{ text: 'OK' }]
                // );
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };

            setCurrentLocation(coords);
            setLoading(false);
        } catch (error) {
            setAlertTitle('Error')
            setAlertMessage('Failed to get your current location')
            setisAlert(true)
        }
    };

    const searchPlaces = async (query) => {
        if (!query || query.length < 3) return;

        try {
            setIsSearching(true);
            // Use a CORS proxy or direct fetch (this might need adjustment based on your setup)
            let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
            if (currentLocation) {
                url += `&location=${currentLocation.latitude},${currentLocation.longitude}&radius=50000`; // 50km radius
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
                setSearchResults(data.predictions);
                setShowResults(true);
            } else if (data.status === 'ZERO_RESULTS') {
                setSearchResults([]);
                setShowResults(false);
            } else {
                setAlertTitle('Search Error')
                setAlertMessage(data.error_message || 'Unable to search places')
                setisAlert(true)
                setSearchResults([]);
                setShowResults(false);
            }
        } catch (error) {
            setAlertTitle('Network Error')
            setAlertMessage('Unable to connect to search service')
            setisAlert(true)

        } finally {
            setIsSearching(false);
        }
    };

    const getPlaceDetails = async (placeId) => {
        try {

            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.result && data.result.geometry && data.result.geometry.location) {
                const result = {
                    latitude: data.result.geometry.location.lat,
                    longitude: data.result.geometry.location.lng,
                    name: data.result.name || data.result.formatted_address || 'Selected Location',
                    address: data.result.formatted_address || '',
                };
                return result;
            } else {
                setAlertTitle('Location Error')
                setAlertMessage(data.error_message || 'Unable to get location details')
                setisAlert(true)
                return null;
            }
        } catch (error) {
            setAlertTitle('Network Error')
            setAlertMessage('Unable to get location details')
            setisAlert(true)
            return null;
        }
    };

    const handlePlaceSelect = async (place) => {
        setSearchQuery(place.description);
        setShowResults(false);
        Keyboard.dismiss();

        const placeDetails = await getPlaceDetails(place.place_id);


        if (placeDetails) {
            const destCoords = {
                latitude: placeDetails.latitude,
                longitude: placeDetails.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };

            setDestination({
                ...destCoords,
                name: placeDetails.name,
                address: placeDetails.address,
                placeId: place.place_id,
            });


            if (currentLocation) {
                getDirections(currentLocation, destCoords);
            }
        } else {
            // Fallback: try geocoding with the address
            await tryGeocoding(place.description);
        }
    };

    const tryGeocoding = async (address) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
            );

            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results[0]) {
                const result = data.results[0];
                const destCoords = {
                    latitude: result.geometry.location.lat,
                    longitude: result.geometry.location.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };

                setDestination({
                    ...destCoords,
                    name: result.formatted_address,
                    address: result.formatted_address,
                });

                if (currentLocation) {
                    getDirections(currentLocation, destCoords);
                }
            } else {
                setAlertTitle('Error')
                setAlertMessage('Unable to find location coordinates')
                setisAlert(true)
            }
        } catch (error) {
            setAlertTitle('Error')
            setAlertMessage('Unable to find location coordinates')
            setisAlert(true)
        }
    };

    const getDirections = async (origin, dest) => {
        if (!origin?.latitude || !origin?.longitude || !dest?.latitude || !dest?.longitude) {
            return;
        }

        try {
            setRouteLoading(true);
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&key=${GOOGLE_MAPS_API_KEY}`
            );

            const result = await response.json();

            if (result.status === 'OK' && result.routes?.[0]?.overview_polyline?.points) {
                const points = decodePolyline(result.routes[0].overview_polyline.points);
                setRouteCoords(points);

                if (mapRef.current && points.length > 0) {
                    mapRef.current.fitToCoordinates([origin, dest], {
                        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                        animated: true,
                    });
                }
            } else {
                setAlertTitle('Route Not Found')
                setAlertMessage('Unable to find a route to the destination')
                setisAlert(true)
            }
        } catch (error) {
            setAlertTitle('Error')
            setAlertMessage('Failed to get directions')
            setisAlert(true)
        } finally {
            setRouteLoading(false);
        }
    };

    const decodePolyline = (encoded) => {
        if (!encoded) return [];

        const points = [];
        let index = 0;
        const len = encoded.length;
        let lat = 0;
        let lng = 0;

        try {
            while (index < len) {
                let b, shift = 0, result = 0;
                do {
                    b = encoded.charAt(index++).charCodeAt(0) - 63;
                    result |= (b & 0x1f) << shift;
                    shift += 5;
                } while (b >= 0x20 && index < len);

                const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
                lat += dlat;

                shift = 0;
                result = 0;
                do {
                    b = encoded.charAt(index++).charCodeAt(0) - 63;
                    result |= (b & 0x1f) << shift;
                    shift += 5;
                } while (b >= 0x20 && index < len);

                const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
                lng += dlng;

                points.push({
                    latitude: lat / 1e5,
                    longitude: lng / 1e5,
                });
            }
        } catch (error) {
            return [];
        }

        return points;
    };

    const handlePlanTrip = () => {
        if (!destination) {
            setAlertTitle('Select Destination')
            setAlertMessage('Please select a destination first')
            setisAlert(true)
            return;
        }

        navigation.navigate('PlanTrip', {
            destination: destination,
            currentLocation: currentLocation,
        });
    };
    const clearSearch = () => {
        setSearchQuery('');
        setDestination(null);
        setRouteCoords([]);
        setShowResults(false);
    };
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        function deg2rad(deg) {
            return deg * (Math.PI / 180);
        }
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }
    const renderSearchResult = ({ item }) => (
        <TouchableOpacity
            style={styles.searchResultItem}
            onPress={() => handlePlaceSelect(item)}
        >
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.searchResultText}>
                <Text style={styles.searchResultMain}>{item.structured_formatting?.main_text || item.description}</Text>
                <Text style={styles.searchResultSecondary}>
                    {item.structured_formatting?.secondary_text || ''}
                </Text>
            </View>
        </TouchableOpacity>
    );
    useEffect(() => {
        let locationSubscription = null;
        if (tracking) {
            (async () => {
                locationSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000, // update every 5 seconds
                        distanceInterval: 10, // or every 10 meters
                    },
                    (location) => {
                        const coords = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        };
                        setCurrentLocation(coords);
                        setTrip((prev) => {
                            const updated = { ...prev, currentLocation: coords };
                            AsyncStorage.setItem('@trip', JSON.stringify(updated));
                            return updated;
                        });
                    }
                );
            })();
        }
        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [tracking]);
    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Getting your location...</Text>
            </SafeAreaView>
        );
    }
    if (!currentLocation) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Preparing your map...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {/* Show search UI only if not tracking */}
            {!tracking && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for destination..."
                            placeholderTextColor="#888"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                            onSubmitEditing={() => searchPlaces(searchQuery)}
                        />
                        {(searchQuery.length > 0 || isSearching) && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearSearch}
                            >
                                {isSearching ? (
                                    <ActivityIndicator size="small" color="#666" />
                                ) : (
                                    <Ionicons name="close" size={20} color="#666" />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Test Search Button - Remove this after testing */}
                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={() => {

                            searchPlaces(searchQuery || 'New York');

                        }}
                    >
                        <Text style={styles.testButtonText}>Search</Text>
                    </TouchableOpacity>

                    {/* Search Results */}
                    {showResults && searchResults.length > 0 && (
                        <View style={styles.searchResultsContainer}>
                            <FlatList
                                data={searchResults}
                                renderItem={renderSearchResult}
                                keyExtractor={(item) => item.place_id}
                                style={styles.searchResultsList}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    )}

                    {/* No Results Message */}
                    {showResults && searchResults.length === 0 && !isSearching && (
                        <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>No locations found</Text>
                        </View>
                    )}
                </View>
            )}
            {alert && <AppAlert
                visible={alert}
                title={alertTitle}
                message={alertMessage}
                onClose={() => setisAlert(false)}
            />}
            {/* Map always visible */}
            <View style={styles.mapContainer}>
                {currentLocation && (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={currentLocation}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                        onPress={handleMapPress}
                    >
                        {/* Current Location Marker */}
                        {tracking ? <Marker
                            coordinate={currentLocation}
                            title="Your Location"
                        >
                            <Ionicons name="car" size={32} color="#007AFF" />
                        </Marker> : <Marker
                            coordinate={currentLocation}
                            title="Your Location"
                            pinColor="red"
                        />}

                        {/* Destination Marker */}
                        {destination && (
                            <Marker
                                coordinate={destination}
                                title={destination.name || 'Destination'}
                                description={destination.address}
                                pinColor="blue"
                            />
                        )}

                        {/* Route Polyline */}
                        {routeCoords.length > 0 && (
                            <Polyline
                                coordinates={routeCoords}
                                strokeColor="#007AFF"
                                strokeWidth={3}
                            />
                        )}
                    </MapView>
                )}

                {routeLoading && (
                    <View style={styles.routeLoading}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.routeLoadingText}>Finding route...</Text>
                    </View>
                )}
            </View>

            { /* Tracking Panel */}

            {tracking && trip.destination && (
                <View style={styles.trackingPanel}>
                    <Text style={styles.trackingTitle}>🚗 Ongoing Trip</Text>
                    <View style={styles.trackingInfoRow}>
                        <Text style={styles.trackingLabel}>Destination:</Text>
                        <Text style={styles.trackingValue}>
                            {trip.destination.address}
                        </Text>
                    </View>
                    <View style={styles.trackingInfoRow}>
                        <Text style={styles.trackingLabel}>Distance:</Text>
                        <Text style={styles.trackingValue}>
                            {distanceLeft !== null ? `${distanceLeft.toFixed(4)} km` : 'Calculating...'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.cancelTripButton}
                        onPress={async () => {
                            try {
                                // Remove all trip-related async storage keys
                                await AsyncStorage.multiRemove([
                                    '@tracking',
                                    '@trip',
                                    '@call_made',
                                    '@pickup_done',
                                    '@arrival_done'
                                ]);
                                setTracking(false);
                                setTrip({});
                                setDestination(null);
                                setRouteCoords([]);
                                setDistanceLeft(null);
                                setAlertTitle('Trip Cancelled');
                                setAlertMessage('Your ongoing trip has been cancelled.');
                                setisAlert(true);
                            } catch (e) {
                                setAlertTitle('Error');
                                setAlertMessage('Failed to cancel the trip. Please try again.');
                                setisAlert(true);
                            }
                        }}
                    >
                        <Text style={styles.cancelTripButtonText}>Cancel Trip</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Plan Trip Button (only if not tracking) */}
            {!tracking && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.planButton,
                            !destination && styles.planButtonDisabled
                        ]}
                        onPress={handlePlanTrip}
                        disabled={!destination}
                    >
                        <Text style={[
                            styles.planButtonText,
                            !destination && styles.planButtonTextDisabled
                        ]}>
                            Plan Trip
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    settingsButton: {
        padding: 5,
    },
    coordsContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
    },
    coordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    coordLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    coordValue: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'monospace',
    },
    searchContainer: {
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
        zIndex: 1000,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 12,
        marginVertical: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    trackingPanel: {
        position: 'absolute',
        bottom: 10,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 18,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 2000,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    trackingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#007AFF',
    },
    trackingInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    trackingLabel: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
        flex: 1,
    },
    trackingValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
        flex: 2,
        textAlign: 'right',
    },
    cancelTripButton: {
        marginTop: 16,
        backgroundColor: '#FF3B30',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelTripButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 5,
        marginLeft: 10,
    },
    testButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    noResultsContainer: {
        padding: 20,
        alignItems: 'center',
    },
    noResultsText: {
        color: '#666',
        fontSize: 16,
    },
    searchResultsContainer: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        maxHeight: 250,
        zIndex: 1001,
    },
    searchResultsList: {
        maxHeight: 250,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchResultText: {
        flex: 1,
        marginLeft: 10,
    },
    searchResultMain: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    searchResultSecondary: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    routeLoading: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    routeLoadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e1e1e1',
    },
    planButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    planButtonDisabled: {
        backgroundColor: '#ccc',
    },
    planButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    planButtonTextDisabled: {
        color: '#999',
    },
});

export default HomeScreen;