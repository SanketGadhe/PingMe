import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK_NAME } from '../constants/index';

// TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
//     if (error) {
//         console.error('Location task error:', error);
//         return;
//     }
//     if (data) {
//         const { locations } = data;
//         const latestLocation = locations[0];

//         if (!latestLocation) return;

//         try {
//             const tripJson = await AsyncStorage.getItem('@trip');
//             if (!tripJson) return; // No trip planned

//             const trip = JSON.parse(tripJson);
//             const { latitude: destLat, longitude: destLng } = trip.destination;
//             const alertDistanceKm = trip.distance;

//             const { latitude: currLat, longitude: currLng } = latestLocation.coords;

//             const distance = getDistanceFromLatLonInKm(currLat, currLng, destLat, destLng);


//             if (distance <= alertDistanceKm) {
//                 await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
//             }
//         } catch (e) {
//         }
//     }
// });

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
export const startBackgroundLocation = async () => {
    try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') throw new Error('Permission denied');

        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== 'granted') throw new Error('Background permission denied');

        console.log("✅ Location permissions granted");
        // Do nothing else. Tracking handled via watchPositionAsync in HomeScreen
    } catch (err) {
        console.error("❌ Location tracking error:", err);
        throw err;
    }
};
