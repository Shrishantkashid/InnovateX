import * as Location from 'expo-location';

/**
 * Service for handling location tracking.
 */

let locationSubscription: Location.LocationSubscription | null = null;

export const requestLocationPermissions = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const startWatching = async (onLocationUpdate: (coords: { latitude: number; longitude: number }) => void) => {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    throw new Error('Location permission not granted');
  }

  // Stop any existing subscription
  if (locationSubscription) {
    locationSubscription.remove();
  }

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
    },
    (location) => {
      onLocationUpdate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  );

  return locationSubscription;
};

export const stopWatching = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
};
