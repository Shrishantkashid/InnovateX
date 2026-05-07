// Use 10.0.2.2 for Android Emulator, localhost for iOS or Web
const API_BASE_URL = 'https://innovate-x-production.up.railway.app';


export const CONFIG = {
  API_URL: API_BASE_URL,
  AUTH_ENDPOINTS: {
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
  }
};
