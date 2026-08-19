import { PropertyRecord, UserProfile } from '../types';

export interface VastuBackupData {
  version: string;
  exportedAt: string;
  app: string;
  userEmail?: string;
  properties: PropertyRecord[];
}

/**
 * Export properties & room layouts to a formatted JSON string
 */
export function generatePropertiesJson(properties: PropertyRecord[], userProfile?: UserProfile): string {
  const data: VastuBackupData = {
    version: '1.2.0',
    exportedAt: new Date().toISOString(),
    app: 'Vastu Shastra Compass & House Auditor',
    userEmail: userProfile?.email || 'guest@vastudrishti.app',
    properties,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Download properties as a .json file
 */
export function downloadPropertiesJson(properties: PropertyRecord[], userProfile?: UserProfile, customFilename?: string): boolean {
  try {
    const jsonStr = generatePropertiesJson(properties, userProfile);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeDate = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = customFilename || `Vastu_Properties_Backup_${safeDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to download JSON backup:', err);
    return false;
  }
}

/**
 * Share properties JSON file via Web Share API (native on Android / mobile)
 */
export async function sharePropertiesJson(properties: PropertyRecord[], userProfile?: UserProfile): Promise<{ success: boolean; message: string }> {
  try {
    const jsonStr = generatePropertiesJson(properties, userProfile);
    const safeDate = new Date().toISOString().slice(0, 10);
    const filename = `Vastu_Properties_${safeDate}.json`;
    const file = new File([jsonStr], filename, { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Vastu Properties Backup JSON',
        text: `Exported ${properties.length} Vastu property audits and 16-zone room layouts.`,
        files: [file],
      });
      return { success: true, message: '✓ Shared JSON file successfully via native share!' };
    } else if (navigator.share) {
      await navigator.share({
        title: 'Vastu Properties Backup JSON',
        text: jsonStr,
      });
      return { success: true, message: '✓ Shared JSON text successfully!' };
    } else {
      // Fallback to direct download
      downloadPropertiesJson(properties, userProfile, filename);
      return { success: true, message: '✓ JSON backup downloaded to your device storage.' };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Share was cancelled.' };
    }
    // Fallback to download
    downloadPropertiesJson(properties, userProfile);
    return { success: true, message: '✓ Downloaded JSON file to storage.' };
  }
}

/**
 * Validate and parse uploaded JSON backup file content
 */
export function parseAndValidatePropertiesJson(jsonContent: string): { success: boolean; properties?: PropertyRecord[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonContent);

    let incomingProps: any[] = [];
    if (Array.isArray(parsed)) {
      incomingProps = parsed;
    } else if (parsed && Array.isArray(parsed.properties)) {
      incomingProps = parsed.properties;
    } else {
      return { success: false, error: 'Invalid JSON format. Expected an array of properties or a Vastu backup object.' };
    }

    if (incomingProps.length === 0) {
      return { success: false, error: 'The provided JSON file contains no properties.' };
    }

    // Sanitize and validate each property record
    const validatedProps: PropertyRecord[] = incomingProps.map((p, idx) => {
      return {
        id: p.id || `prop_${Date.now()}_${idx}`,
        name: p.name || `Imported Property ${idx + 1}`,
        address: p.address || 'Imported Address',
        addressType: p.addressType === 'gps' ? 'gps' : 'manual',
        coordinates: p.coordinates && typeof p.coordinates.lat === 'number' ? p.coordinates : undefined,
        propertyType: p.propertyType || 'Flat/Apartment',
        facingDegree: typeof p.facingDegree === 'number' ? p.facingDegree : 45,
        placedRooms: Array.isArray(p.placedRooms) ? p.placedRooms : [],
        createdAt: p.createdAt || new Date().toLocaleDateString(),
        isDemo: !!p.isDemo,
        floorplanUrl: p.floorplanUrl,
        floorplanOpacity: p.floorplanOpacity,
        floorplanRotation: p.floorplanRotation,
        floorplanScale: p.floorplanScale,
        floorplanFlipH: p.floorplanFlipH,
        floorplanFlipV: p.floorplanFlipV,
      };
    });

    return { success: true, properties: validatedProps };
  } catch (err: any) {
    return { success: false, error: `JSON Parse Error: ${err?.message || 'Corrupted or unreadable JSON file.'}` };
  }
}
