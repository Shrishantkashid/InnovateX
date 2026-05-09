import * as Location from 'expo-location';
import { supabase } from './supabase';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

class RealtimeLocationService {
  private subscription: Location.LocationSubscription | null = null;
  private userId: string | null = null;

  async startTracking(userId: string, onUpdate: (location: LocationData) => void) {
    this.userId = userId;
    
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        timeInterval: 2000,
      },
      (location) => {
        const data: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp,
        };

        onUpdate(data);
        this.publishToSupabase(data);
      }
    );
  }

  private async publishToSupabase(location: LocationData) {
    if (!this.userId) return;

    // Send to a realtime channel
    supabase.channel(`user_location_${this.userId}`).send({
      type: 'broadcast',
      event: 'location_update',
      payload: location,
    });
    
    // Also update a 'live_locations' table if needed for persistence
    // await supabase.from('profiles').update({ last_location: location }).eq('id', this.userId);
  }

  stopTracking() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}

export const locationService = new RealtimeLocationService();
