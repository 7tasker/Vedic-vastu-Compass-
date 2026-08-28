import { Capacitor } from '@capacitor/core';

/**
 * Global API configuration utility for web preview & native Android APK (Capacitor).
 * In web preview mode, relative URLs ('/api/...') are routed directly to Vite / Express.
 * In native Android APK mode (running under https://localhost or capacitor://localhost),
 * relative URLs must point to the real Cloud Run backend server.
 */

// Active Cloud Run container host URL
export const BACKEND_SERVER_BASE_URL = 'https://ais-dev-enrzofo7ritteww6qkzjm7-139414157966.asia-east1.run.app';

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (Capacitor.isNativePlatform()) {
    return `${BACKEND_SERVER_BASE_URL}${cleanEndpoint}`;
  }
  
  return cleanEndpoint;
}
