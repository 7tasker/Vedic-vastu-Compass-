import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';

/**
 * Trigger the native Google Play Store In-App Review API (or Apple StoreKit on iOS).
 * On Web/PWA, opens the direct Google Play Store web listing as a fallback.
 */
export async function requestGooglePlayReview(
  packageName: string = 'com.tasker7.vastucompass'
): Promise<{ success: boolean; mode: 'native' | 'store_url' | 'fallback'; error?: string }> {
  try {
    if (Capacitor.isNativePlatform()) {
      // Android native in-app review dialog via Google Play In-App Review API
      await InAppReview.requestReview();
      return { success: true, mode: 'native' };
    }

    // Web / PWA / Browser fallback: Direct Play Store review link with market protocol support
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    if (typeof window !== 'undefined') {
      const opened = window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.href = playStoreUrl;
      }
    }
    return { success: true, mode: 'store_url' };
  } catch (err: any) {
    console.warn('In-App Review invocation note:', err);
    // Fallback directly to Play Store URL
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    if (typeof window !== 'undefined') {
      window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
    }
    return { success: false, mode: 'fallback', error: err?.message || String(err) };
  }
}
