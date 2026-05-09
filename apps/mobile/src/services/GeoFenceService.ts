import * as Location from 'expo-location';

export type ZoneType = 'safe' | 'unsafe' | 'caution';

export interface GeoZone {
  id: string;
  name: string;
  type: ZoneType;
  latitude: number;
  longitude: number;
  radius: number;
  description?: string;
  risk_score: number;
}

export class GeoFenceService {
  /**
   * Calculate distance between two points in meters
   */
  static getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radius of the earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Find if current location is within any zone
   */
  static checkZones(latitude: number, longitude: number, zones: GeoZone[]): GeoZone | null {
    for (const zone of zones) {
      const distance = this.getDistance(latitude, longitude, zone.latitude, zone.longitude);
      if (distance <= zone.radius) {
        return zone;
      }
    }
    return null;
  }
}
