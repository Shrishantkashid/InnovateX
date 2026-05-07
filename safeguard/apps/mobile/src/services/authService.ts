import { UserRole } from '../context/AuthContext';
import { CONFIG } from '../constants/config';

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  emergencyContact?: string;
  role: UserRole;
}

const simulateDelay = (ms = 1500) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  signup: async (data: SignupData) => {
    console.log('Attempting signup at:', CONFIG.AUTH_ENDPOINTS.SIGNUP);
    try {
      const response = await fetch(CONFIG.AUTH_ENDPOINTS.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      console.log('Signup Response Raw:', text);
      
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON. Response was:', text);
        throw new Error('Invalid server response format');
      }

      if (!response.ok) {
        throw new Error(result.detail || 'Signup failed');
      }

      return {
        success: true,
        user: result.user,
        token: result.access_token
      };
    } catch (error: any) {
      console.error('Signup Error:', error);
      if (error?.message?.includes('Network request failed')) {
        throw new Error(`Network request failed. Verify API URL (${CONFIG.AUTH_ENDPOINTS.SIGNUP}) and that backend is reachable from this device.`);
      }
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await fetch(CONFIG.AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Login failed');
      }

      return {
        success: true,
        user: result.user,
        token: result.access_token
      };
    } catch (error: any) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  verifyAadhaar: async (aadhaarNumber: string) => {
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/auth/aadhaar/otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ aadhaar_number: aadhaarNumber }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Aadhaar verification failed');
      return { success: true, referenceId: result.reference_id };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  verifyOtp: async (otp: string, referenceId: string) => {
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/auth/aadhaar/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ otp, reference_id: referenceId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'OTP verification failed');
      return result; // contains { success, message, data }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
};
