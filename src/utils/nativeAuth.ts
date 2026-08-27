import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const SERVER_CLIENT_ID = '87203320531-nlb6h8rjmdhg4uilkd1so67h4pr6ieum.apps.googleusercontent.com';

let isGoogleAuthInitialized = false;

/**
 * Initialize native device capabilities on app launch
 * - Styles native status bar with warm Vedic theme color (#78350F)
 * - Safely dismisses the splash screen without white-screen flash
 * - Configures native Google Auth plugin with server client ID
 */
export async function initializeNativeApp(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // 1. Style Status Bar to avoid white header flash
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#78350F' });
  } catch (err) {
    console.warn('Native StatusBar init note:', err);
  }

  try {
    // 2. Initialize GoogleAuth with exact Server Client ID
    if (!isGoogleAuthInitialized) {
      await GoogleAuth.initialize({
        clientId: SERVER_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      isGoogleAuthInitialized = true;
    }
  } catch (err) {
    console.warn('Native GoogleAuth init note:', err);
  }

  try {
    // 3. Smoothly hide Splash Screen
    await SplashScreen.hide({
      fadeOutDuration: 300,
    });
  } catch (err) {
    console.warn('Native SplashScreen hide note:', err);
  }
}

/**
 * Perform Native Google Sign-In using @codetrix-studio/capacitor-google-auth
 * Strictly prevents web popups or browser redirects on Android.
 */
export async function performNativeGoogleSignIn(): Promise<{
  idToken: string;
  email: string;
  name: string;
  imageUrl?: string;
  id?: string;
}> {
  if (!isGoogleAuthInitialized) {
    await GoogleAuth.initialize({
      clientId: SERVER_CLIENT_ID,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    isGoogleAuthInitialized = true;
  }

  const googleUser = await GoogleAuth.signIn();
  
  const idToken = googleUser.authentication?.idToken || '';
  const email = googleUser.email || '';
  const name = (googleUser as any).name || (googleUser as any).displayName || (googleUser as any).givenName || 'Vedic Practitioner';
  const imageUrl = googleUser.imageUrl;
  const id = googleUser.id;

  return {
    idToken,
    email,
    name,
    imageUrl,
    id,
  };
}
