/**
 * Mocked SOS API service for simulating backend communication.
 * Includes artificial delays to test UI loading states and demo flow.
 */

export interface SOSData {
  userId: string;
  latitude: number;
  longitude: number;
  triggerType: 'audio' | 'motion' | 'eta' | 'squeeze' | 'manual' | 'zone_exit';
  threatScore: number;
}

export interface LocationUpdate {
  userId: string;
  sosEventId: string;
  latitude: number;
  longitude: number;
}

const simulateDelay = () => new Promise((resolve) => setTimeout(resolve, 1000));

/**
 * Trigger a new SOS event.
 */
export const triggerSOS = async (data: SOSData) => {
  console.log('[Mock API] Triggering SOS:', data);
  await simulateDelay();
  
  const mockEventId = `sos_${Math.random().toString(36).substr(2, 9)}`;
  const mockToken = Math.random().toString(36).substr(2, 6).toUpperCase();

  return {
    success: true,
    sosEventId: mockEventId,
    trackToken: mockToken,
    trackUrl: `https://safeguard.app/track/${mockToken}`,
  };
};

/**
 * Send live location updates during an SOS event.
 */
export const sendLocation = async (data: LocationUpdate) => {
  console.log('[Mock API] Sending location update:', data);
  await simulateDelay();
  
  return { success: true };
};

/**
 * Mark an SOS event as resolved.
 */
export const resolveSOS = async (sosEventId: string) => {
  console.log('[Mock API] Resolving SOS:', sosEventId);
  await simulateDelay();
  
  return { success: true };
};
