import { NativeModules, Platform } from 'react-native';

const getMetroHost = () => {
  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  const host = scriptURL?.match(/^[a-z]+:\/\/([^:/]+)/i)?.[1];

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return host;
};

// Prefer explicit env override. In development, physical devices opened through
// Expo Go need the computer LAN IP, while Android emulators use 10.0.2.2.
const metroHost = getMetroHost();
const DEFAULT_LOCAL_API_BASE_URL = metroHost
  ? `http://${metroHost}:8000`
  : Platform.OS === 'android'
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
