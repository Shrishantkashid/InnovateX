import { CONFIG } from '../constants/config';

export interface SOSRequest {
  latitude: number;
  longitude: number;
  risk_level?: string;
  trigger_type?: string;
}

export interface SOSResponse {
  success: boolean;
  sos_event_id: string;
  track_token: string;
  message?: string;
}

export const sosService = {
  createSOS: async (data: SOSRequest): Promise<SOSResponse> => {
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/sos/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Failed to activate SOS');

      return {
        success: true,
        sos_event_id: result.sos_event_id,
        track_token: result.track_token
      };
    } catch (error: any) {
      console.error('SOS Creation Error:', error);
      throw error;
    }
  },

  resolveSOS: async (sosId: string, notes: string = 'Resolved by user'): Promise<boolean> => {
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/sos/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ sos_id: sosId, resolution_notes: notes }),
      });

      if (!response.ok) throw new Error('Failed to resolve SOS');
      return true;
    } catch (error: any) {
      console.error('SOS Resolution Error:', error);
      return false;
    }
  }
};
