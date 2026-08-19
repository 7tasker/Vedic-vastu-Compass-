import { db, isFirebaseEnabled } from '../lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';

export interface LicenseKeyRecord {
  id: string;
  code: string;
  planId: 'lifetime_pro' | 'pass_2weeks' | 'pass_4weeks' | 'single_property';
  planName: string;
  createdAt: string;
  createdBy: string;
  isRedeemed: boolean;
  redeemedByEmail?: string;
  redeemedAt?: string;
  status: 'active' | 'redeemed' | 'revoked';
}

const LICENSE_KEYS_STORAGE_KEY = 'vastu_license_keys';

export const INITIAL_LICENSE_KEYS: LicenseKeyRecord[] = [
  {
    id: 'key_1',
    code: 'PRO-VASTU-2026',
    planId: 'lifetime_pro',
    planName: 'Lifetime Pro Unlimited Pass',
    createdAt: new Date().toISOString(),
    createdBy: 'Admin Satish',
    isRedeemed: false,
    status: 'active',
  },
  {
    id: 'key_2',
    code: 'PASS-14DAYS-778',
    planId: 'pass_2weeks',
    planName: '14-Day House Hunter Pass',
    createdAt: new Date().toISOString(),
    createdBy: 'Admin Satish',
    isRedeemed: false,
    status: 'active',
  },
  {
    id: 'key_3',
    code: 'PRO-VIP-9981',
    planId: 'lifetime_pro',
    planName: 'Lifetime Pro Unlimited Pass',
    createdAt: new Date().toISOString(),
    createdBy: 'Admin Satish',
    isRedeemed: false,
    status: 'active',
  },
];

export const getLicenseKeys = (): LicenseKeyRecord[] => {
  try {
    const saved = localStorage.getItem(LICENSE_KEYS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse cached license keys:', e);
  }
  return INITIAL_LICENSE_KEYS;
};

export const saveLicenseKeys = async (keys: LicenseKeyRecord[]): Promise<boolean> => {
  localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, JSON.stringify(keys));
  window.dispatchEvent(new Event('vastu_keys_updated'));

  if (isFirebaseEnabled()) {
    try {
      await setDoc(doc(db, 'system_config', 'license_keys'), { keys }, { merge: true });
      return true;
    } catch (e) {
      console.warn('Error saving license keys to Firestore:', e);
    }
  }
  return false;
};

export const generateLicenseKey = async (
  planId: 'lifetime_pro' | 'pass_2weeks' | 'pass_4weeks' | 'single_property' = 'lifetime_pro',
  customCode?: string,
  createdBy: string = 'Admin'
): Promise<{ success: boolean; key?: LicenseKeyRecord; message: string }> => {
  const currentKeys = getLicenseKeys();

  let code = (customCode || '').trim().toUpperCase();
  if (!code) {
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = planId === 'lifetime_pro' ? 'PRO' : planId === 'pass_2weeks' ? 'PASS14' : 'PRO';
    code = `${prefix}-${randPart}-${randPart2}`;
  }

  // Check duplicate
  if (currentKeys.some((k) => k.code === code)) {
    return { success: false, message: `License Key code "${code}" already exists!` };
  }

  const planNames: Record<string, string> = {
    lifetime_pro: 'Lifetime Pro Unlimited Pass',
    pass_2weeks: '14-Day House Hunter Pass',
    pass_4weeks: '28-Day Extended Hunter Pass',
    single_property: 'Single Audit Report',
  };

  const newKey: LicenseKeyRecord = {
    id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code,
    planId,
    planName: planNames[planId] || 'Vedic Pro Membership',
    createdAt: new Date().toISOString(),
    createdBy,
    isRedeemed: false,
    status: 'active',
  };

  const updatedKeys = [newKey, ...currentKeys];
  await saveLicenseKeys(updatedKeys);

  return { success: true, key: newKey, message: `Successfully generated Key: ${code}` };
};

export const redeemLicenseKey = async (
  rawCode: string,
  userEmail: string,
  userUid?: string
): Promise<{
  success: boolean;
  message: string;
  planId?: 'lifetime_pro' | 'pass_2weeks' | 'pass_4weeks' | 'single_property';
}> => {
  const code = (rawCode || '').trim().toUpperCase();

  if (!code) {
    return { success: false, message: 'Please enter a valid license key code.' };
  }

  const currentKeys = getLicenseKeys();
  const keyIndex = currentKeys.findIndex((k) => k.code === code);

  if (keyIndex === -1) {
    return {
      success: false,
      message: `Invalid License Key "${code}". Please enter a valid key generated in Admin Dashboard.`,
    };
  }

  const targetKey = currentKeys[keyIndex];

  if (targetKey.status === 'revoked') {
    return {
      success: false,
      message: `License Key "${code}" has been revoked by Admin.`,
    };
  }

  if (targetKey.isRedeemed || targetKey.status === 'redeemed') {
    const redeemedDate = targetKey.redeemedAt
      ? new Date(targetKey.redeemedAt).toLocaleDateString()
      : 'an earlier date';
    return {
      success: false,
      message: `License Key "${code}" was already redeemed by ${
        targetKey.redeemedByEmail || 'another account'
      } on ${redeemedDate}.`,
    };
  }

  // Key is valid and active!
  const updatedKey: LicenseKeyRecord = {
    ...targetKey,
    isRedeemed: true,
    status: 'redeemed',
    redeemedByEmail: userEmail || 'user@vastudrishti.app',
    redeemedAt: new Date().toISOString(),
  };

  const updatedKeys = [...currentKeys];
  updatedKeys[keyIndex] = updatedKey;

  await saveLicenseKeys(updatedKeys);

  // Sync user profile in Firestore if uid is available
  if (userUid && isFirebaseEnabled()) {
    try {
      const userRef = doc(db, 'users', userUid);
      await updateDoc(userRef, {
        isProMember: true,
        activePlan: updatedKey.planId,
        redeemedKey: updatedKey.code,
        redeemedAt: updatedKey.redeemedAt,
      });
    } catch (err) {
      console.warn('Error updating user pro status in Firestore during key redemption:', err);
    }
  }

  return {
    success: true,
    message: `License Key "${code}" verified & redeemed! Activated ${updatedKey.planName}.`,
    planId: updatedKey.planId,
  };
};

export const revokeLicenseKey = async (id: string): Promise<boolean> => {
  const keys = getLicenseKeys();
  const updated = keys.map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k));
  return saveLicenseKeys(updated);
};

export const deleteLicenseKey = async (id: string): Promise<boolean> => {
  const keys = getLicenseKeys();
  const updated = keys.filter((k) => k.id !== id);
  return saveLicenseKeys(updated);
};

export const subscribeToLicenseKeys = (onChange: (keys: LicenseKeyRecord[]) => void): (() => void) => {
  if (!isFirebaseEnabled()) {
    return () => {};
  }

  const unsub = onSnapshot(
    doc(db, 'system_config', 'license_keys'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.keys)) {
          localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, JSON.stringify(data.keys));
          onChange(data.keys);
        }
      }
    },
    (err) => console.warn('License keys subscription notice:', err)
  );

  return unsub;
};
