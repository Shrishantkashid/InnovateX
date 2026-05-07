import { Platform } from 'react-native';

// Prefer explicit env override; fallback to sensible defaults per runtime.
// Android emulator can't resolve localhost, so use 10.0.2.2 for local API runs.
const DEFAULT_LOCAL_API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000'
  : 'http://localhost:8000';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  || (process.env.NODE_ENV === 'development'
    ? DEFAULT_LOCAL_API_BASE_URL
    : 'https://innovate-x-production.up.railway.app');


export const CONFIG = {
  API_URL: API_BASE_URL,
  AUTH_ENDPOINTS: {
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
  }
};
